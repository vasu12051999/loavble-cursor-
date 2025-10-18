-- Add attachment_name and attachment_type to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS attachment_type TEXT,
ADD COLUMN IF NOT EXISTS attachment_size INTEGER;

-- Create storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('message-attachments', 'message-attachments', false, 10485760, 
   ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 
         'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
         'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
         'text/plain', 'application/zip'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for message attachments
CREATE POLICY "Users can view attachments in their conversations"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'message-attachments' AND
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.messages
      WHERE messages.media_url LIKE '%' || name || '%'
      AND (messages.sender_id = auth.uid() OR messages.recipient_id = auth.uid())
    )
  );

CREATE POLICY "Authenticated users can upload message attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'message-attachments' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete their own message attachments"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'message-attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create typing_status table for real-time typing indicators
CREATE TABLE IF NOT EXISTS public.typing_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_typing BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(job_id, user_id)
);

-- Enable RLS on typing_status
ALTER TABLE public.typing_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies for typing_status
CREATE POLICY "Users can view typing status in their conversations"
  ON public.typing_status FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.messages
      WHERE messages.job_id = typing_status.job_id
      AND (messages.sender_id = auth.uid() OR messages.recipient_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own typing status"
  ON public.typing_status FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own typing status"
  ON public.typing_status FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to auto-delete old typing status
CREATE OR REPLACE FUNCTION public.cleanup_typing_status()
RETURNS void AS $$
BEGIN
  DELETE FROM public.typing_status
  WHERE updated_at < NOW() - INTERVAL '10 seconds';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_messages_job_id_created_at ON public.messages(job_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender_recipient ON public.messages(sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON public.messages(read_at);
CREATE INDEX IF NOT EXISTS idx_typing_status_job_id ON public.typing_status(job_id);

-- Add trigger to update typing status timestamp
CREATE OR REPLACE FUNCTION public.update_typing_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER typing_status_updated_at
  BEFORE UPDATE ON public.typing_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_typing_status_timestamp();
