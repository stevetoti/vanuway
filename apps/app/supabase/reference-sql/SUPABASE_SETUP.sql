-- ============================================
-- VANUCAR & VANURIDE DRIVER APP SETUP
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- 1. CREATE DRIVERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.drivers (
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
  current_ride_id UUID REFERENCES public.ride_bookings(id) ON DELETE SET NULL,

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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_drivers_location ON public.drivers(current_lat, current_lng);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON public.drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_vehicle_type ON public.drivers(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON public.drivers(user_id);

-- 2. ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Drivers can view own profile" ON public.drivers;
DROP POLICY IF EXISTS "Drivers can update own profile" ON public.drivers;
DROP POLICY IF EXISTS "Users can view active drivers" ON public.drivers;
DROP POLICY IF EXISTS "Admins can manage drivers" ON public.drivers;

-- Drivers can view their own profile
CREATE POLICY "Drivers can view own profile"
  ON public.drivers FOR SELECT
  USING (auth.uid() = user_id);

-- Drivers can update their own profile
CREATE POLICY "Drivers can update own profile"
  ON public.drivers FOR UPDATE
  USING (auth.uid() = user_id);

-- Drivers can insert their own profile
CREATE POLICY "Drivers can insert own profile"
  ON public.drivers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view active drivers (for finding nearby drivers)
CREATE POLICY "Users can view active drivers"
  ON public.drivers FOR SELECT
  USING (status IN ('available', 'busy') AND is_verified = TRUE);

-- Admins can manage all drivers
CREATE POLICY "Admins can manage drivers"
  ON public.drivers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- 3. CREATE AUTO-UPDATE TRIGGER
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

-- 4. ADD DRIVER_ID TO RIDE_BOOKINGS (if not exists)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ride_bookings'
    AND column_name = 'driver_id'
  ) THEN
    ALTER TABLE public.ride_bookings
    ADD COLUMN driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL;

    CREATE INDEX idx_ride_bookings_driver_id ON public.ride_bookings(driver_id);
  END IF;
END $$;

-- 5. ENABLE REALTIME FOR DRIVER FEATURES
-- ============================================
-- Enable realtime on drivers table
ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;

-- Enable realtime on ride_bookings if not already enabled
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_bookings;
  EXCEPTION
    WHEN duplicate_object THEN
      NULL; -- Table already added to publication
  END;
END $$;

-- 6. FIX USER_ROLES RLS POLICIES (Required for driver registration)
-- ============================================

-- Allow users to insert 'driver' role for themselves during registration
DROP POLICY IF EXISTS "Users can register as drivers" ON public.user_roles;
CREATE POLICY "Users can register as drivers"
  ON public.user_roles FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND role = 'driver'
  );

-- Allow users to view their own roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Allow admins to manage all roles
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- 7. CREATE HELPFUL VIEWS (Optional)
-- ============================================

-- View for available drivers
CREATE OR REPLACE VIEW available_drivers AS
SELECT
  d.id,
  d.vehicle_type,
  d.vehicle_model,
  d.vehicle_color,
  d.license_plate,
  d.current_lat,
  d.current_lng,
  d.rating,
  d.total_rides,
  d.status
FROM public.drivers d
WHERE d.status = 'available'
  AND d.is_verified = TRUE
  AND d.current_lat IS NOT NULL
  AND d.current_lng IS NOT NULL;

-- View for driver earnings
CREATE OR REPLACE VIEW driver_earnings_summary AS
SELECT
  d.id as driver_id,
  d.user_id,
  d.total_rides,
  d.total_earnings,
  d.rating,
  COUNT(CASE WHEN rb.status = 'completed' AND rb.created_at >= CURRENT_DATE THEN 1 END) as today_rides,
  COALESCE(SUM(CASE WHEN rb.status = 'completed' AND rb.created_at >= CURRENT_DATE THEN rb.price ELSE 0 END), 0) as today_earnings,
  COUNT(CASE WHEN rb.status = 'completed' AND rb.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as week_rides,
  COALESCE(SUM(CASE WHEN rb.status = 'completed' AND rb.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN rb.price ELSE 0 END), 0) as week_earnings
FROM public.drivers d
LEFT JOIN public.ride_bookings rb ON rb.driver_id = d.id
GROUP BY d.id, d.user_id, d.total_rides, d.total_earnings, d.rating;

-- 8. SAMPLE DATA FOR TESTING (Optional - Run only if you want test drivers)
-- ============================================
-- UNCOMMENT THE FOLLOWING TO ADD TEST DRIVERS

/*
-- First, create a test user in Supabase Auth
-- Then use that user_id here

INSERT INTO public.drivers (
  user_id,
  vehicle_type,
  vehicle_model,
  vehicle_color,
  license_plate,
  license_number,
  license_expiry,
  insurance_number,
  insurance_expiry,
  status,
  is_verified,
  current_lat,
  current_lng,
  rating,
  total_rides,
  total_earnings
) VALUES
  (
    'YOUR_USER_ID_HERE', -- Replace with actual user ID from auth.users
    'car',
    'Toyota Corolla',
    'White',
    'PORT123',
    'DL12345',
    '2025-12-31',
    'INS9876',
    '2025-12-31',
    'available',
    TRUE,
    -17.7333, -- Port Vila coordinates
    168.3167,
    4.8,
    0,
    0
  ),
  (
    'YOUR_USER_ID_HERE_2', -- Replace with another user ID
    'moto',
    'Honda CBR',
    'Red',
    'PORT456',
    'DL67890',
    '2025-12-31',
    'INS5432',
    '2025-12-31',
    'available',
    TRUE,
    -17.7350,
    168.3180,
    4.9,
    0,
    0
  );
*/

-- ============================================
-- 9. VERIFICATION QUERIES
-- ============================================

-- Check if drivers table was created
SELECT 'Drivers table created' as status, count(*) as driver_count FROM public.drivers;

-- Check if indexes were created
SELECT
  'Indexes created' as status,
  count(*) as index_count
FROM pg_indexes
WHERE tablename = 'drivers';

-- Check drivers RLS policies
SELECT
  'Drivers RLS policies created' as status,
  count(*) as policy_count
FROM pg_policies
WHERE tablename = 'drivers';

-- Check user_roles RLS policies
SELECT
  'User roles RLS policies created' as status,
  count(*) as policy_count
FROM pg_policies
WHERE tablename = 'user_roles';

-- ============================================
-- 10. SUCCESS MESSAGE
-- ============================================
SELECT 'VanuCar & VanuRide Driver System Setup Complete! ✅' as message;

SELECT
  'Next Steps:' as step,
  '1. Create test users in Supabase Auth' as action
UNION ALL
SELECT '2. Test driver registration on the app', ''
UNION ALL
SELECT '3. Verify drivers in Supabase (set is_verified = TRUE)', ''
UNION ALL
SELECT '4. Test complete ride flow', '';

-- Show configured policies
SELECT
  'Configured Policies:' as info,
  tablename,
  policyname
FROM pg_policies
WHERE tablename IN ('drivers', 'user_roles')
ORDER BY tablename, policyname;
