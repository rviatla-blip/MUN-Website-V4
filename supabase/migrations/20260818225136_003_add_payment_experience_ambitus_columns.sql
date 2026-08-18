/*
# Add experience, Ambitus student flag, payment proof, and payment status columns

1. Modified Tables
- `delegates`: Added four new columns
  - `experience` (text, nullable) — free-text description of the delegate's prior MUN / debate experience
  - `is_ambitus_student` (boolean, default false) — whether the delegate is an Ambitus World School student (drives which Google Sheet tab they land in)
  - `payment_proof_url` (text, nullable) — public URL of the uploaded payment screenshot in storage
  - `payment_status` (text, default 'pending') — one of 'pending', 'submitted', 'verified', 'rejected'

2. Storage
- Create a public storage bucket `payment-proofs` for delegate payment screenshots

3. Security
- RLS already enabled on delegates; no policy changes needed (anon CRUD already permitted for this public-registration app)
- Storage bucket is public-read so the Google Sheet sync function can fetch proof URLs
*/

ALTER TABLE delegates ADD COLUMN IF NOT EXISTS experience text;
ALTER TABLE delegates ADD COLUMN IF NOT EXISTS is_ambitus_student boolean NOT NULL DEFAULT false;
ALTER TABLE delegates ADD COLUMN IF NOT EXISTS payment_proof_url text;
ALTER TABLE delegates ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending';

-- Create storage bucket for payment proof uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: allow anyone to upload and read (public registration app)
DROP POLICY IF EXISTS "anon_upload_payment_proofs" ON storage.objects;
CREATE POLICY "anon_upload_payment_proofs" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'payment-proofs');

DROP POLICY IF EXISTS "anon_read_payment_proofs" ON storage.objects;
CREATE POLICY "anon_read_payment_proofs" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'payment-proofs');

DROP POLICY IF EXISTS "anon_update_payment_proofs" ON storage.objects;
CREATE POLICY "anon_update_payment_proofs" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'payment-proofs') WITH CHECK (bucket_id = 'payment-proofs');
