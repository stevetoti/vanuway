-- ============================================
-- VANUCAR & VANURIDE COMPLETE SETUP
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. CREATE DRIVERS TABLE
-- ============================================

-- Drop table if exists (clean slate)
DROP TABLE IF EXISTS public.drivers CASCADE;

CREATE TABLE public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('car', 'moto')),
  vehicle_model TEXT NOT NULL,
  vehicle_color TEXT,
  license_plate TEXT NOT NULL UNIQUE,

  -- Driver status
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('available', 'busy', 'offline')),
  is_verified BOOLEAN DEFAULT FALSE,

  -- Current location
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  current_ride_id UUID,

  -- Stats
  rating DECIMAL(3,2) DEFAULT 5.0,
  total_rides INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0,

  -- Documents
  license_number TEXT,
  license_expiry DATE,
  insurance_number TEXT,
  insurance_expiry DATE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================

CREATE INDEX idx_drivers_location ON public.drivers(current_lat, current_lng);
CREATE INDEX idx_drivers_status ON public.drivers(status);
CREATE INDEX idx_drivers_vehicle_type ON public.drivers(vehicle_type);
CREATE INDEX idx_drivers_user_id ON public.drivers(user_id);

-- ============================================
-- 3. SETUP ROW LEVEL SECURITY - DRIVERS
-- ============================================

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Drivers can view own profile" ON public.drivers;
DROP POLICY IF EXISTS "Drivers can update own profile" ON public.drivers;
DROP POLICY IF EXISTS "Drivers can insert own profile" ON public.drivers;
DROP POLICY IF EXISTS "Users can view active drivers" ON public.drivers;
DROP POLICY IF EXISTS "Admins can manage drivers" ON public.drivers;

-- Create new policies
CREATE POLICY "Drivers can view own profile"
  ON public.drivers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Drivers can update own profile"
  ON public.drivers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Drivers can insert own profile"
  ON public.drivers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view active drivers"
  ON public.drivers FOR SELECT
  USING (status IN ('available', 'busy') AND is_verified = TRUE);

CREATE POLICY "Admins can manage drivers"
  ON public.drivers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================
-- 4. SETUP ROW LEVEL SECURITY - USER_ROLES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can register as drivers" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Create new policies
CREATE POLICY "Users can register as drivers"
  ON public.user_roles FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND role = 'driver'
  );

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================
-- 5. UPDATE RIDE_BOOKINGS TABLE
-- ============================================

-- Add driver_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ride_bookings'
    AND column_name = 'driver_id'
  ) THEN
    ALTER TABLE public.ride_bookings
    ADD COLUMN driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add foreign key for current_ride_id in drivers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'drivers_current_ride_id_fkey'
  ) THEN
    ALTER TABLE public.drivers
    ADD CONSTRAINT drivers_current_ride_id_fkey
    FOREIGN KEY (current_ride_id)
    REFERENCES public.ride_bookings(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Create index on driver_id
CREATE INDEX IF NOT EXISTS idx_ride_bookings_driver_id ON public.ride_bookings(driver_id);

-- ============================================
-- 6. AUTO-UPDATE TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_drivers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_drivers_updated_at ON public.drivers;
CREATE TRIGGER set_drivers_updated_at
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW
  EXECUTE FUNCTION update_drivers_updated_at();

-- ============================================
-- 7. ENABLE REALTIME
-- ============================================

-- Enable realtime on drivers table
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Table already added
END $$;

-- Enable realtime on ride_bookings
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_bookings;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Table already added
END $$;

-- ============================================
-- 8. SUCCESS & VERIFICATION
-- ============================================

-- Verify drivers table
SELECT
  'SUCCESS: Drivers table created' as status,
  COUNT(*) as driver_count
FROM public.drivers;

-- Verify indexes
SELECT
  'SUCCESS: Indexes created' as status,
  COUNT(*) as index_count
FROM pg_indexes
WHERE tablename = 'drivers';

-- Verify driver policies
SELECT
  'SUCCESS: Driver RLS policies' as status,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'drivers';

-- Verify user_roles policies
SELECT
  'SUCCESS: User roles RLS policies' as status,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'user_roles';

-- Final success message
SELECT '✅ VanuCar & VanuRide Setup Complete!' as message;
