-- Fix 1: Align existing drivers' flags with their status
UPDATE public.drivers
SET
  is_available = true,
  is_online = true,
  updated_at = now()
WHERE
  status = 'available'
  AND is_verified = true
  AND (is_available IS DISTINCT FROM true OR is_online IS DISTINCT FROM true);

-- Also normalize offline/busy drivers
UPDATE public.drivers
SET
  is_available = false,
  is_online = false,
  updated_at = now()
WHERE
  status IN ('offline', 'busy')
  AND (is_available IS DISTINCT FROM false OR is_online IS DISTINCT FROM false);

-- Fix 2: Drop and recreate the RLS policy to require all availability flags
DROP POLICY IF EXISTS "Drivers can view pending rides" ON public.ride_bookings;

CREATE POLICY "Drivers can view pending rides"
ON public.ride_bookings
FOR SELECT
TO authenticated
USING (
  (user_id = auth.uid())
  OR (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()))
  OR (
    status = 'pending'
    AND driver_id IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.drivers
      WHERE drivers.user_id = auth.uid()
        AND drivers.is_available = true
        AND drivers.is_online = true
        AND drivers.is_verified = true
    )
  )
);