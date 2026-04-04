-- ============================================
-- FIX: Row Level Security Policy for Driver Registration
-- Run this in Supabase SQL Editor to fix the registration error
-- ============================================

-- Allow users to insert 'driver' role for themselves during registration
CREATE POLICY IF NOT EXISTS "Users can register as drivers"
  ON public.user_roles FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND role = 'driver'
  );

-- Allow users to view their own roles
CREATE POLICY IF NOT EXISTS "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Optional: Allow admins to manage all roles
CREATE POLICY IF NOT EXISTS "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Verify the policies were created
SELECT
  'RLS Policies Created for user_roles' as status,
  count(*) as policy_count
FROM pg_policies
WHERE tablename = 'user_roles';

-- Test query - should show your roles after registration
SELECT * FROM user_roles WHERE user_id = auth.uid();
