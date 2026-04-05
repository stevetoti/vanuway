-- FIX ALL DRIVER SELECT POLICIES
-- Drop ALL existing SELECT policies on drivers to start clean
DROP POLICY IF EXISTS "Drivers can view own profile" ON public.drivers;
DROP POLICY IF EXISTS "Drivers can view their own profile" ON public.drivers;
DROP POLICY IF EXISTS "Users can view active drivers" ON public.drivers;
DROP POLICY IF EXISTS "Public can view approved active drivers" ON public.drivers;
DROP POLICY IF EXISTS "Anyone can view active drivers" ON public.drivers;
DROP POLICY IF EXISTS "System can update driver status" ON public.drivers;

-- 1. Drivers can ALWAYS see their own profile (regardless of status)
CREATE POLICY "Drivers can view own profile" ON public.drivers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 2. Anyone authenticated can see available drivers (for ride matching)
CREATE POLICY "Users can view active drivers" ON public.drivers
  FOR SELECT TO authenticated
  USING (
    is_available = true
    OR is_online = true
    OR EXISTS (
      SELECT 1 FROM ride_bookings rb
      WHERE rb.driver_id = drivers.user_id
        AND rb.user_id = auth.uid()
        AND rb.status IN ('accepted', 'arriving', 'arrived', 'in_progress')
    )
  );

-- 3. Admins can see all drivers
DROP POLICY IF EXISTS "Admins can manage drivers" ON public.drivers;
CREATE POLICY "Admins can manage drivers" ON public.drivers
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- 4. Drivers can update their own profile
DROP POLICY IF EXISTS "Drivers can update own profile" ON public.drivers;
DROP POLICY IF EXISTS "Drivers can update their own profile" ON public.drivers;
CREATE POLICY "Drivers can update own profile" ON public.drivers
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- 5. Users can register as drivers
DROP POLICY IF EXISTS "Drivers can insert own profile" ON public.drivers;
CREATE POLICY "Drivers can insert own profile" ON public.drivers
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
