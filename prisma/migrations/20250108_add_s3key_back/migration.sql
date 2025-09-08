-- Add s3Key column back to Clip table for backward compatibility
ALTER TABLE "Clip" ADD COLUMN IF NOT EXISTS "s3Key" TEXT;

-- Create index for s3Key if it doesn't exist
CREATE INDEX IF NOT EXISTS "Clip_s3Key_idx" ON "Clip" ("s3Key");
