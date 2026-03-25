-- Create documents bucket for driver documents (private - needs verification)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Create avatars bucket for profile photos (public - displayed in UI)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create hotel-images bucket for hotel photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hotel-images',
  'hotel-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- RLS Policies for documents bucket
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = 'driver-documents'
);

CREATE POLICY "Users can read own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Admins can read all documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  public.has_role(auth.uid(), 'admin')
);

-- RLS Policies for avatars bucket
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Users can update avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Users can delete avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- RLS Policies for hotel-images bucket
CREATE POLICY "Public can view hotel images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'hotel-images');

CREATE POLICY "Users can upload hotel images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'hotel-images');

CREATE POLICY "Users can update hotel images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'hotel-images');

CREATE POLICY "Users can delete hotel images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'hotel-images');