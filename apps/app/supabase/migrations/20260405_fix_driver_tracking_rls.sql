-- Fix: passengers can't see driver location updates during a ride
-- The "Users can view active drivers" policy only allows is_available=true,
-- but during a ride the driver has is_available=false. This blocks realtime
-- location updates on the passenger's tracking map.

-- Drop and recreate with ride-aware condition
DROP POLICY IF EXISTS "Users can view active drivers" ON public.drivers;
CREATE POLICY "Users can view active drivers" ON public.drivers
  FOR SELECT TO authenticated
  USING (
    -- Driver can always see themselves
    user_id = auth.uid()
    -- Available drivers (for assignment)
    OR is_available = true
    -- Passenger can see their assigned driver (even when busy)
    OR EXISTS (
      SELECT 1 FROM ride_bookings rb
      WHERE rb.driver_id = drivers.user_id
        AND rb.user_id = auth.uid()
        AND rb.status IN ('accepted', 'arriving', 'arrived', 'in_progress')
    )
  );
