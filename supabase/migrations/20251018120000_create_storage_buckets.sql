-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']),
  ('job-photos', 'job-photos', true, 10485760, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']),
  ('message-attachments', 'message-attachments', true, 10485760, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain', 'application/zip']),
  ('portfolio-images', 'portfolio-images', true, 10485760, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view public files
CREATE POLICY "Public files are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id IN ('avatars', 'job-photos', 'portfolio-images'));

-- Policy: Authenticated users can view message attachments if they're part of the conversation
CREATE POLICY "Users can view message attachments in their conversations"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'message-attachments' 
  AND auth.uid() IS NOT NULL
);

-- Policy: Users can upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Authenticated users can upload job photos
CREATE POLICY "Authenticated users can upload job photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'job-photos'
  AND auth.uid() IS NOT NULL
);

-- Policy: Users can update their own job photos
CREATE POLICY "Users can update their own job photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'job-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own job photos
CREATE POLICY "Users can delete their own job photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'job-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Authenticated users can upload message attachments
CREATE POLICY "Authenticated users can upload message attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'message-attachments'
  AND auth.uid() IS NOT NULL
);

-- Policy: Users can delete their own message attachments
CREATE POLICY "Users can delete their own message attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'message-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Providers can upload portfolio images
CREATE POLICY "Providers can upload portfolio images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'portfolio-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Providers can update their portfolio images
CREATE POLICY "Providers can update their portfolio images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'portfolio-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Providers can delete their portfolio images
CREATE POLICY "Providers can delete their portfolio images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'portfolio-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
