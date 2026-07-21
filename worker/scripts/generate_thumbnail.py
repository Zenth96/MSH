#!/usr/bin/env python3
"""Generate a simple colored thumbnail and upload to MinIO."""
import json, os, struct, zlib, sys

MINIO_ENDPOINT = os.environ.get('MINIO_ENDPOINT', 'minio')
MINIO_PORT     = os.environ.get('MINIO_PORT', '9000')
MINIO_ACCESS   = os.environ.get('MINIO_ACCESS_KEY', 'msh')
MINIO_SECRET   = os.environ.get('MINIO_SECRET_KEY', 'msh_secret')
MINIO_BUCKET   = os.environ.get('MINIO_BUCKET', 'msh-models')

args = json.loads(sys.argv[1])
model_name = args['modelName']
storage_key = args['storageKey']
thumbnail_key = args['thumbnailKey']

width, height = 128, 128
import hashlib
seed = sum(ord(c) for c in model_name)
r = (seed * 37) % 200 + 30
g = (seed * 71) % 200 + 30
b = (seed * 113) % 200 + 30
# Make it visibly colored, not dark
r = min(r + 40, 255)
g = min(g + 40, 255)
b = min(b + 40, 255)

raw = bytearray()
for y in range(height):
    raw.append(0)

    cx = x_center = width // 2
    cy = y_center = height // 2
    for x in range(width):
        dr = x - cx
        dy = y - cy
        # vignette effect
        dist = (dr * dr + dy * dy) / (cx * cx + cy * cy)
        brightness = max(0.5, 1.0 - dist * 0.5)

        raw.append(int(r * brightness))
        raw.append(int(g * brightness))
        raw.append(int(b * brightness))

compressed = zlib.compress(bytes(raw))


def chunk(ctype, data):
    c = ctype.encode() + data
    return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)


png = b'\x89PNG\r\n\x1a\n'
png += chunk('IHDR', struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0))
png += chunk('IDAT', compressed)
png += chunk('IEND', b'')

# Upload to MinIO via S3 API
import urllib.request
from urllib.parse import quote
import hashlib as hl
import hmac
import datetime

now = datetime.datetime.utcnow()
amz_date = now.strftime('%Y%m%dT%H%M%SZ')
date_stamp = now.strftime('%Y%m%d')

host = f'{MINIO_ENDPOINT}:{MINIO_PORT}'
canonical_uri = f'/{MINIO_BUCKET}/{thumbnail_key}'
signed_headers = 'host;x-amz-content-sha256;x-amz-date'
payload_hash = hl.sha256(png).hexdigest()

canonical_request = (
    f'PUT\n{canonical_uri}\n\n'
    f'host:{host}\n'
    f'x-amz-content-sha256:{payload_hash}\n'
    f'x-amz-date:{amz_date}\n\n'
    f'{signed_headers}\n{payload_hash}'
)

algorithm = 'AWS4-HMAC-SHA256'

def sign(key, msg):
    return hmac.new(key, msg.encode('utf-8'), hl.sha256).digest()

def get_signature_key(key, date, region, service):
    k_date = sign(('AWS4' + key).encode('utf-8'), date)
    k_region = sign(k_date, region)
    k_service = sign(k_region, service)
    k_signing = sign(k_service, 'aws4_request')
    return k_signing

credential_scope = f'{date_stamp}/us-east-1/s3/aws4_request'
string_to_sign = f'{algorithm}\n{amz_date}\n{credential_scope}\n{hl.sha256(canonical_request.encode("utf-8")).hexdigest()}'

signing_key = get_signature_key(MINIO_SECRET, date_stamp, 'us-east-1', 's3')
signature = hmac.new(signing_key, string_to_sign.encode('utf-8'), hl.sha256).hexdigest()

authorization_header = (
    f'{algorithm} Credential={MINIO_ACCESS}/{credential_scope}, '
    f'SignedHeaders={signed_headers}, Signature={signature}'
)

req = urllib.request.Request(
    url=f'http://{host}/{MINIO_BUCKET}/{thumbnail_key}',
    data=png,
    headers={
        'Host': host,
        'x-amz-content-sha256': payload_hash,
        'x-amz-date': amz_date,
        'Authorization': authorization_header,
        'Content-Type': 'image/png',
    },
    method='PUT',
)

try:
    with urllib.request.urlopen(req) as resp:
        print(f'Uploaded thumbnail to {thumbnail_key} ({len(png)} bytes), status={resp.status}')
except urllib.error.HTTPError as e:
    print(f'Upload failed: {e.code} {e.reason}', file=sys.stderr)
    sys.exit(1)
