-- Fix infinite recursion in RLS policies for user_roles and drivers tables
-- The issue: drivers policy queries user_roles directly, but user_roles has RLS enabled with no policies
-- This causes infinite recursion when PostgreSQL tries to check permissions

-- Step 1: Drop ALL existing policies on user_roles to start fresh
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Step 2: Add RLS policies to user_roles table
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add policy for admins to manage user_roles (using SECURITY DEFINER function)
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Step 3: Drop the problematic drivers policy that causes recursion
DROP POLICY IF EXISTS "Admins can manage drivers" ON public.drivers;

-- Step 4: Recreate the admin policy using the SECURITY DEFINER function
CREATE POLICY "Admins can manage drivers"
  ON public.drivers FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Step 5: Fix driver_applications if it has similar issues
DROP POLICY IF EXISTS "Admins can view all applications" ON public.driver_applications;
DROP POLICY IF EXISTS "Admins can update applications" ON public.driver_applications;

-- Recreate with has_role function (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'driver_applications' AND table_schema = 'public') THEN
    EXECUTE 'CREATE POLICY "Admins can view all applications" ON public.driver_applications FOR SELECT USING (public.has_role(auth.uid(), ''admin''::public.app_role))';
    EXECUTE 'CREATE POLICY "Admins can update applications" ON public.driver_applications FOR UPDATE USING (public.has_role(auth.uid(), ''admin''::public.app_role))';
  END IF;
END $$;

-- Verify the has_role function exists and is correct
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
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

-- Grant execute permission on has_role function
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO anon;
