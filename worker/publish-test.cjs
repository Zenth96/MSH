const {Pool} = require('pg');
const amqp = require('amqplib');
const {S3Client, DeleteObjectCommand} = require('@aws-sdk/client-s3');

const s3 = new S3Client({region:'eu-1',endpoint:'http://minio:9000',credentials:{accessKeyId:'msh',secretAccessKey:'msh_secret'},forcePathStyle:true});

(async()=>{
  const pool=new Pool({host:'postgres',port:5432,database:'msh',user:'msh',password:'msh_secret'});

  // Use the existing Box.glb model
  const modelId='987a5e90-8eb9-41ad-a2ee-d8cebce5c007';
  const storageKey='models/78bdd0bf-3c8c-4077-8a10-c7c999bf2320/2f73c45c-3e5f-43fc-832e-43469b530d86.glb';
  const projectId='78bdd0bf-3c8c-4077-8a10-c7c999bf2320';
  const jobId='test-thumb-'+Date.now();

  await pool.query("INSERT INTO jobs (id,model_id,type,status,created_at,updated_at) VALUES ($1,$2,'GENERATE_THUMBNAIL','PENDING',NOW(),NOW()) ON CONFLICT (id) DO NOTHING",[jobId,modelId]);
  console.log('Job created:',jobId);

  try{await s3.send(new DeleteObjectCommand({Bucket:'msh-models',Key:'thumbnails/'+projectId+'/'+modelId+'_thumb.png'}));console.log('Deleted old thumb');}catch(e){}
  await pool.query("UPDATE model3d SET thumbnail_key=NULL,status='READY' WHERE id=$1",[modelId]);
  console.log('Reset model');

  const conn=await amqp.connect('amqp://msh:msh_secret@rabbitmq:5672');
  const ch=await conn.createChannel();
  await ch.assertQueue('model_processing',{durable:true});
  ch.sendToQueue('model_processing',Buffer.from(JSON.stringify({
    jobId,
    modelId,
    jobType:'GENERATE_THUMBNAIL',
    storageKey,
    fileName:'Box.glb',
    format:'glb'
  })),{persistent:true});
  console.log('Published to model_processing');
  await ch.close();await conn.close();
  await pool.end();
  console.log('Done');
})();
