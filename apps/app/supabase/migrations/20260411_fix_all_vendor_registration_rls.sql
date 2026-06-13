-- ============================================================================
-- Ensure ALL vendor registration tables have proper RLS INSERT policies
-- So restaurant, hotel, tour, ferry, pharmacy, utility registrations all work
-- ============================================================================

-- === restaurant_owners ===
ALTER TABLE restaurant_owners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own restaurant owner profile" ON restaurant_owners;
CREATE POLICY "Users can insert own restaurant owner profile" ON restaurant_owners
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own restaurant owner profile" ON restaurant_owners;
CREATE POLICY "Users can view own restaurant owner profile" ON restaurant_owners
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own restaurant owner profile" ON restaurant_owners;
CREATE POLICY "Users can update own restaurant owner profile" ON restaurant_owners
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage all restaurant owners" ON restaurant_owners;
CREATE POLICY "Admins manage all restaurant owners" ON restaurant_owners
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- === tour_providers ===
ALTER TABLE tour_providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own tour provider profile" ON tour_providers;
CREATE POLICY "Users can insert own tour provider profile" ON tour_providers
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own tour provider profile" ON tour_providers;
CREATE POLICY "Users can view own tour provider profile" ON tour_providers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own tour provider profile" ON tour_providers;
CREATE POLICY "Users can update own tour provider profile" ON tour_providers
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Public can view active tour providers" ON tour_providers;
CREATE POLICY "Public can view active tour providers" ON tour_providers
  FOR SELECT TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "Admins manage all tour providers" ON tour_providers;
CREATE POLICY "Admins manage all tour providers" ON tour_providers
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- === tour_operators === (separate from tour_providers)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tour_operators') THEN
    EXECUTE 'ALTER TABLE tour_operators ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Users can insert own tour operator profile" ON tour_operators';
    EXECUTE 'CREATE POLICY "Users can insert own tour operator profile" ON tour_operators FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())';

    EXECUTE 'DROP POLICY IF EXISTS "Users can view own tour operator profile" ON tour_operators';
    EXECUTE 'CREATE POLICY "Users can view own tour operator profile" ON tour_operators FOR SELECT TO authenticated USING (user_id = auth.uid())';

    EXECUTE 'DROP POLICY IF EXISTS "Users can update own tour operator profile" ON tour_operators';
    EXECUTE 'CREATE POLICY "Users can update own tour operator profile" ON tour_operators FOR UPDATE TO authenticated USING (user_id = auth.uid())';

    EXECUTE 'DROP POLICY IF EXISTS "Public can view tour operators" ON tour_operators';
    EXECUTE 'CREATE POLICY "Public can view tour operators" ON tour_operators FOR SELECT TO authenticated, anon USING (true)';
  END IF;
END $$;

-- === pharmacies (if has user_id — reinforce policies) ===
-- Pharmacies already have policies but let's make sure INSERT works
DROP POLICY IF EXISTS "Users can create their own pharmacy" ON pharmacies;
CREATE POLICY "Users can create their own pharmacy" ON pharmacies
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- === utility_providers === (already set, but reinforce)
DROP POLICY IF EXISTS "Users create provider profile" ON utility_providers;
CREATE POLICY "Users create provider profile" ON utility_providers
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
