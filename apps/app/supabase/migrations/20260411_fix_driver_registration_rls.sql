-- ============================================================================
-- Fix driver registration RLS policy violations
-- Users submitting driver applications were blocked because INSERT policies
-- did not allow them to create their own vehicle, document, application records.
-- ============================================================================

-- === driver_vehicles ===
DROP POLICY IF EXISTS "Drivers can insert own vehicles" ON driver_vehicles;
CREATE POLICY "Drivers can insert own vehicles" ON driver_vehicles
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM drivers WHERE drivers.id = driver_vehicles.driver_id AND drivers.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Drivers can view own vehicles" ON driver_vehicles;
CREATE POLICY "Drivers can view own vehicles" ON driver_vehicles
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM drivers WHERE drivers.id = driver_vehicles.driver_id AND drivers.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Drivers can update own vehicles" ON driver_vehicles;
CREATE POLICY "Drivers can update own vehicles" ON driver_vehicles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM drivers WHERE drivers.id = driver_vehicles.driver_id AND drivers.user_id = auth.uid())
  );

-- Admins can manage all vehicles
DROP POLICY IF EXISTS "Admins manage all vehicles" ON driver_vehicles;
CREATE POLICY "Admins manage all vehicles" ON driver_vehicles
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- === driver_documents ===
DROP POLICY IF EXISTS "Drivers can insert own documents" ON driver_documents;
CREATE POLICY "Drivers can insert own documents" ON driver_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM drivers WHERE drivers.id = driver_documents.driver_id AND drivers.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Drivers can view own documents" ON driver_documents;
CREATE POLICY "Drivers can view own documents" ON driver_documents
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM drivers WHERE drivers.id = driver_documents.driver_id AND drivers.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins manage all documents" ON driver_documents;
CREATE POLICY "Admins manage all documents" ON driver_documents
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- === driver_applications ===
DROP POLICY IF EXISTS "Drivers can insert own application" ON driver_applications;
CREATE POLICY "Drivers can insert own application" ON driver_applications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Drivers can view own application" ON driver_applications;
CREATE POLICY "Drivers can view own application" ON driver_applications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Drivers can update own application" ON driver_applications;
CREATE POLICY "Drivers can update own application" ON driver_applications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- === app_role enum ===
-- Add missing vendor role values to the enum (safe — skips if already exists)
DO $$
BEGIN
  ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'hotel_owner';
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'hotel_owner already exists or error: %', SQLERRM;
END $$;

DO $$
BEGIN
  ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'tour_provider';
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'tour_provider already exists or error: %', SQLERRM;
END $$;

DO $$
BEGIN
  ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'ferry_operator';
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'ferry_operator already exists or error: %', SQLERRM;
END $$;

DO $$
BEGIN
  ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'pharmacy_owner';
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'pharmacy_owner already exists or error: %', SQLERRM;
END $$;

DO $$
BEGIN
  ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'service_provider';
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'service_provider already exists or error: %', SQLERRM;
END $$;

DO $$
BEGIN
  ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'utility_provider';
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'utility_provider already exists or error: %', SQLERRM;
END $$;

-- === user_roles ===
-- Allow users to assign themselves the 'driver' role (self-service roles only)
DROP POLICY IF EXISTS "Users can self-assign driver role" ON user_roles;
CREATE POLICY "Users can self-assign driver role" ON user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND role IN ('driver', 'restaurant_owner', 'hotel_owner', 'tour_provider', 'ferry_operator', 'pharmacy_owner', 'service_provider', 'utility_provider')
  );

DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
CREATE POLICY "Users can view own roles" ON user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- === documents storage bucket ===
-- Ensure the storage bucket policies allow authenticated users to upload
-- their own driver documents (path starts with their user_id)
DO $$
BEGIN
  -- Drop old policies if they exist
  DROP POLICY IF EXISTS "Users can upload own driver documents" ON storage.objects;
  DROP POLICY IF EXISTS "Users can view own driver documents" ON storage.objects;

  -- Create new policies
  CREATE POLICY "Users can upload own driver documents" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'documents'
      AND (storage.foldername(name))[1] = 'driver-documents'
      AND (storage.foldername(name))[2] = auth.uid()::text
    );

  CREATE POLICY "Users can view own driver documents" ON storage.objects
    FOR SELECT TO authenticated
    USING (
      bucket_id = 'documents'
      AND (storage.foldername(name))[1] = 'driver-documents'
      AND (storage.foldername(name))[2] = auth.uid()::text
    );
EXCEPTION WHEN OTHERS THEN
  -- Bucket might not exist yet, policies might conflict — log and continue
  RAISE NOTICE 'Storage policy setup skipped: %', SQLERRM;
END $$;
