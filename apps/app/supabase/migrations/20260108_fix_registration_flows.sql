-- ============================================
-- FIX: Registration Flows - Missing columns, RLS policies, and enum values
-- Date: 2026-01-08
-- Fixes all registration flow issues identified across the app
-- ============================================

-- ============================================
-- 1. FIX RESTAURANTS TABLE - Add missing columns
-- ============================================

-- Add missing columns that AddRestaurant.tsx tries to insert
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS cuisine TEXT;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS opening_hours TEXT;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS minimum_order DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'suspended', 'closed'));

-- ============================================
-- 2. FIX RESTAURANTS RLS - Add INSERT policy
-- ============================================

-- Restaurant owners need to be able to create their restaurant listings
DROP POLICY IF EXISTS "Restaurant owners can create restaurants" ON public.restaurants;
CREATE POLICY "Restaurant owners can create restaurants"
  ON public.restaurants FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- ============================================
-- 3. FIX APP_ROLE ENUM - Add missing roles
-- ============================================

-- Add hotel_owner role
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'app_role' AND e.enumlabel = 'hotel_owner'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'hotel_owner';
  END IF;
END $$;

-- Add tour_operator role
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'app_role' AND e.enumlabel = 'tour_operator'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'tour_operator';
  END IF;
END $$;

-- Add tour_provider role
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'app_role' AND e.enumlabel = 'tour_provider'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'tour_provider';
  END IF;
END $$;

-- Add ferry_operator role
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'app_role' AND e.enumlabel = 'ferry_operator'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ferry_operator';
  END IF;
END $$;

-- ============================================
-- 4. FIX TRANSPORT OPERATORS RLS - Add INSERT policy for users
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can register as operators" ON public.transport_operators;
CREATE POLICY "Authenticated users can register as operators"
  ON public.transport_operators FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Also allow users to view their own operator records (even if not yet active)
DROP POLICY IF EXISTS "Users can view own operator records" ON public.transport_operators;
CREATE POLICY "Users can view own operator records"
  ON public.transport_operators FOR SELECT
  TO authenticated
  USING (true); -- Transport operators don't have a user_id column, so we allow viewing all active operators

-- ============================================
-- 5. FIX HOTEL_OWNERS RLS - Ensure policies exist
-- (Table exists in DB but may be missing RLS policies if migrations were not run)
-- ============================================

-- Ensure RLS is enabled
ALTER TABLE public.hotel_owners ENABLE ROW LEVEL SECURITY;

-- Drop and recreate to be safe
DROP POLICY IF EXISTS "Users can view their own hotel owner profile" ON public.hotel_owners;
CREATE POLICY "Users can view their own hotel owner profile"
  ON public.hotel_owners FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own hotel owner profile" ON public.hotel_owners;
CREATE POLICY "Users can insert their own hotel owner profile"
  ON public.hotel_owners FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own hotel owner profile" ON public.hotel_owners;
CREATE POLICY "Users can update their own hotel owner profile"
  ON public.hotel_owners FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all hotel owners" ON public.hotel_owners;
CREATE POLICY "Admins can view all hotel owners"
  ON public.hotel_owners FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can update hotel owners" ON public.hotel_owners;
CREATE POLICY "Admins can update hotel owners"
  ON public.hotel_owners FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ============================================
-- 6. FIX HOTELS RLS - Add INSERT policy
-- ============================================

ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hotel owners can create hotels" ON public.hotels;
CREATE POLICY "Hotel owners can create hotels"
  ON public.hotels FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id IN (SELECT id FROM public.hotel_owners WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Public can view hotels" ON public.hotels;
CREATE POLICY "Public can view hotels"
  ON public.hotels FOR SELECT
  USING (status IN ('active', 'pending_review') OR owner_id IN (SELECT id FROM public.hotel_owners WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Hotel owners can update own hotels" ON public.hotels;
CREATE POLICY "Hotel owners can update own hotels"
  ON public.hotels FOR UPDATE
  TO authenticated
  USING (
    owner_id IN (SELECT id FROM public.hotel_owners WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins can manage all hotels" ON public.hotels;
CREATE POLICY "Admins can manage all hotels"
  ON public.hotels FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ============================================
-- 7. FIX DRIVERS RLS - Ensure INSERT policy exists
-- ============================================

DROP POLICY IF EXISTS "Users can create driver profile" ON public.drivers;
CREATE POLICY "Users can create driver profile"
  ON public.drivers FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- 8. FIX DRIVER_VEHICLES RLS - Ensure policies exist
-- ============================================

ALTER TABLE public.driver_vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Drivers can view own vehicles" ON public.driver_vehicles;
CREATE POLICY "Drivers can view own vehicles"
  ON public.driver_vehicles FOR SELECT
  TO authenticated
  USING (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Drivers can create vehicles" ON public.driver_vehicles;
CREATE POLICY "Drivers can create vehicles"
  ON public.driver_vehicles FOR INSERT
  TO authenticated
  WITH CHECK (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Drivers can update own vehicles" ON public.driver_vehicles;
CREATE POLICY "Drivers can update own vehicles"
  ON public.driver_vehicles FOR UPDATE
  TO authenticated
  USING (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins can manage all vehicles" ON public.driver_vehicles;
CREATE POLICY "Admins can manage all vehicles"
  ON public.driver_vehicles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ============================================
-- 9. FIX DRIVER_DOCUMENTS RLS - Ensure policies exist
-- ============================================

ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Drivers can view own documents" ON public.driver_documents;
CREATE POLICY "Drivers can view own documents"
  ON public.driver_documents FOR SELECT
  TO authenticated
  USING (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Drivers can upload documents" ON public.driver_documents;
CREATE POLICY "Drivers can upload documents"
  ON public.driver_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Drivers can update own documents" ON public.driver_documents;
CREATE POLICY "Drivers can update own documents"
  ON public.driver_documents FOR UPDATE
  TO authenticated
  USING (
    driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins can manage all documents" ON public.driver_documents;
CREATE POLICY "Admins can manage all documents"
  ON public.driver_documents FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ============================================
-- 10. FIX DRIVER_APPLICATIONS RLS - Ensure INSERT policy exists
-- ============================================

ALTER TABLE public.driver_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Drivers can view own applications" ON public.driver_applications;
CREATE POLICY "Drivers can view own applications"
  ON public.driver_applications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Drivers can create applications" ON public.driver_applications;
CREATE POLICY "Drivers can create applications"
  ON public.driver_applications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Drivers can update own applications" ON public.driver_applications;
CREATE POLICY "Drivers can update own applications"
  ON public.driver_applications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- 11. FIX USER_ROLES - Ensure INSERT policy works
-- ============================================

-- Ensure user_roles has proper INSERT policy
DROP POLICY IF EXISTS "Users can add own roles" ON public.user_roles;
CREATE POLICY "Users can add own roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- 12. CREATE STORAGE BUCKETS IF NOT EXIST
-- (Note: Storage buckets typically need to be created via Supabase dashboard or CLI)
-- These are just documentation reminders
-- ============================================

-- Storage buckets needed:
-- 1. 'marketplace' - for marketplace listing images
-- 2. 'properties' - for real estate property images
-- 3. 'health' - for pharmacy logos and images
-- 4. 'hotel-documents' - for hotel owner verification documents
-- 5. 'documents' - for driver documents
-- 6. 'tour-documents' - for tour operator documents

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN public.restaurants.cuisine IS 'Type of cuisine (e.g., Local Vanuatu, Chinese, etc.)';
COMMENT ON COLUMN public.restaurants.opening_hours IS 'Operating hours string';
COMMENT ON COLUMN public.restaurants.minimum_order IS 'Minimum order amount in VUV';
COMMENT ON COLUMN public.restaurants.delivery_fee IS 'Standard delivery fee in VUV';
COMMENT ON COLUMN public.restaurants.status IS 'Restaurant status: pending, approved, active, suspended, closed';
