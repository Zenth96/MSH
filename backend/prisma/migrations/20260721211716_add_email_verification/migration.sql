-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verify_attempt_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "verify_code" TEXT,
ADD COLUMN     "verify_code_expires_at" TIMESTAMP(3);
