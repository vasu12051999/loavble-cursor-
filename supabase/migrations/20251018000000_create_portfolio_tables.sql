-- Create portfolio items table
CREATE TABLE public.portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id),
  images TEXT[] NOT NULL DEFAULT '{}',
  before_image TEXT,
  after_image TEXT,
  completed_date DATE,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for portfolio items
CREATE POLICY "Portfolio items are viewable by everyone"
  ON public.portfolio_items FOR SELECT
  USING (true);

CREATE POLICY "Providers can insert their own portfolio items"
  ON public.portfolio_items FOR INSERT
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can update their own portfolio items"
  ON public.portfolio_items FOR UPDATE
  USING (auth.uid() = provider_id);

CREATE POLICY "Providers can delete their own portfolio items"
  ON public.portfolio_items FOR DELETE
  USING (auth.uid() = provider_id);

-- Create indexes
CREATE INDEX idx_portfolio_items_provider_id ON public.portfolio_items(provider_id);
CREATE INDEX idx_portfolio_items_category_id ON public.portfolio_items(category_id);
CREATE INDEX idx_portfolio_items_is_featured ON public.portfolio_items(is_featured);

-- Add trigger for updated_at
CREATE TRIGGER update_portfolio_items_updated_at
  BEFORE UPDATE ON public.portfolio_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create storage bucket for portfolio images (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('portfolio', 'portfolio', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for portfolio images
CREATE POLICY "Portfolio images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'portfolio');

CREATE POLICY "Authenticated users can upload portfolio images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'portfolio' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own portfolio images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'portfolio' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own portfolio images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'portfolio' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
