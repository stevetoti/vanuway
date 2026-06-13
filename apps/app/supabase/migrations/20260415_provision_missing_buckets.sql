-- Provision storage buckets that the app code expects but were never created.
-- Without these, vendor uploads (marketplace photos, property photos, hotel
-- registration docs, pharmacy docs) fail with "bucket not found".

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('marketplace', 'marketplace', true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('properties', 'properties', true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('hotel-documents', 'hotel-documents', false, 10485760, ARRAY['image/jpeg','image/png','image/webp','application/pdf']),
  ('health', 'health', false, 10485760, ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- RLS policies: authenticated users can manage files inside their own folder.
-- Public buckets allow anonymous SELECT for display; private buckets only allow
-- the owner + service role to read.

-- marketplace (public images)
CREATE POLICY "marketplace_authenticated_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'marketplace' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "marketplace_authenticated_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'marketplace' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "marketplace_authenticated_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'marketplace' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "marketplace_public_select"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'marketplace');

-- properties (public images)
CREATE POLICY "properties_authenticated_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'properties' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "properties_authenticated_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'properties' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "properties_authenticated_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'properties' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "properties_public_select"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'properties');

-- hotel-documents (private)
CREATE POLICY "hotel_documents_owner_all"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'hotel-documents' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'hotel-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- health (private)
CREATE POLICY "health_owner_all"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'health' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'health' AND (storage.foldername(name))[1] = auth.uid()::text);
