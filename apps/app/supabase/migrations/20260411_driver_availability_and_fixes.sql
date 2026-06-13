-- ============================================================================
-- Create missing driver_availability table + allow unassigned bookings
-- ============================================================================

-- === driver_availability ===
CREATE TABLE IF NOT EXISTS driver_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean DEFAULT true,
  is_recurring boolean DEFAULT true,
  specific_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_driver_availability_driver ON driver_availability(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_availability_day ON driver_availability(day_of_week);

ALTER TABLE driver_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view availability" ON driver_availability;
CREATE POLICY "Public can view availability" ON driver_availability
  FOR SELECT TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "Drivers manage own availability" ON driver_availability;
CREATE POLICY "Drivers manage own availability" ON driver_availability
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM drivers WHERE drivers.id = driver_availability.driver_id AND drivers.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM drivers WHERE drivers.id = driver_availability.driver_id AND drivers.user_id = auth.uid()));

-- === advance_bookings: allow driver_id to be NULL for open/unassigned bookings ===
DO $$
BEGIN
  ALTER TABLE advance_bookings ALTER COLUMN driver_id DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'driver_id already nullable or error: %', SQLERRM;
END $$;

-- Allow drivers to view all unassigned bookings (so they can claim them)
DROP POLICY IF EXISTS "Drivers can view unassigned bookings" ON advance_bookings;
CREATE POLICY "Drivers can view unassigned bookings" ON advance_bookings
  FOR SELECT TO authenticated
  USING (
    driver_id IS NULL
    AND EXISTS (SELECT 1 FROM drivers WHERE drivers.user_id = auth.uid() AND drivers.application_status = 'approved')
  );

-- Allow drivers to claim unassigned bookings by updating driver_id to themselves
DROP POLICY IF EXISTS "Drivers can claim unassigned bookings" ON advance_bookings;
CREATE POLICY "Drivers can claim unassigned bookings" ON advance_bookings
  FOR UPDATE TO authenticated
  USING (
    driver_id IS NULL
    AND EXISTS (SELECT 1 FROM drivers WHERE drivers.user_id = auth.uid() AND drivers.application_status = 'approved')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM drivers WHERE drivers.id = advance_bookings.driver_id AND drivers.user_id = auth.uid())
  );
