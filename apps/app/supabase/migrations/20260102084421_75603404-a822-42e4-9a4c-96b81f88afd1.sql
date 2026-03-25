-- Add admin role for user totinarh24@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('68454def-06fa-4ab1-86de-ad760b3d6909', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Create or replace has_role function for RLS policies
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Fix RLS policies on ride_bookings to allow drivers to accept rides
DROP POLICY IF EXISTS "Drivers can update assigned rides" ON public.ride_bookings;
CREATE POLICY "Drivers can update assigned rides"
ON public.ride_bookings
FOR UPDATE
TO authenticated
USING (
  driver_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.drivers WHERE user_id = auth.uid())
)
WITH CHECK (
  driver_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.drivers WHERE user_id = auth.uid())
);

-- Allow drivers to view available rides
DROP POLICY IF EXISTS "Drivers can view pending rides" ON public.ride_bookings;
CREATE POLICY "Drivers can view pending rides"
ON public.ride_bookings
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  driver_id = auth.uid() OR
  (status = 'pending' AND EXISTS (SELECT 1 FROM public.drivers WHERE user_id = auth.uid() AND is_available = true))
);

-- Fix RLS policies on drivers table for assignment updates
DROP POLICY IF EXISTS "System can update driver status" ON public.drivers;
CREATE POLICY "System can update driver status"
ON public.drivers
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Ensure drivers can read all active drivers for assignment
DROP POLICY IF EXISTS "Users can view active drivers" ON public.drivers;
CREATE POLICY "Users can view active drivers"
ON public.drivers
FOR SELECT
TO authenticated
USING (is_available = true OR user_id = auth.uid());