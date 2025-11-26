-- Add new fields to ncm_rules
ALTER TABLE "public"."ncm_rules" 
ADD COLUMN IF NOT EXISTS "legal_reference" text,
ADD COLUMN IF NOT EXISTS "explanation_md" text,
ADD COLUMN IF NOT EXISTS "last_verified_at" timestamp with time zone;

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "request_id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid REFERENCES auth.users(id),
    "ncm" text,
    "calculated_tax" numeric,
    "details" jsonb,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;

-- Allow insert for authenticated users (or service role)
CREATE POLICY "Enable insert for authenticated users"
ON "public"."audit_logs"
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow read for admins (assuming admin role check logic exists or just service role)
-- For now, let's allow users to see their own logs
CREATE POLICY "Users can view their own logs"
ON "public"."audit_logs"
FOR SELECT
USING (auth.uid() = user_id);
