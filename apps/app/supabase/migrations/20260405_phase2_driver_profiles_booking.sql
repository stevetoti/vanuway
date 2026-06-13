-- ============================================================================
-- PHASE 2: Driver Profiles, Advance Booking, Sub-Ratings
-- ============================================================================

-- Driver Reviews with sub-ratings
CREATE TABLE IF NOT EXISTS driver_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ride_booking_id uuid REFERENCES ride_bookings(id) ON DELETE SET NULL,
  overall_rating integer NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  punctuality_rating integer CHECK (punctuality_rating BETWEEN 1 AND 5),
  vehicle_rating integer CHECK (vehicle_rating BETWEEN 1 AND 5),
  communication_rating integer CHECK (communication_rating BETWEEN 1 AND 5),
  value_rating integer CHECK (value_rating BETWEEN 1 AND 5),
  comment text,
  compliments text[],
  service_type text, -- 'ride', 'tour', 'airport_transfer', 'cruise_transfer'
  is_verified boolean DEFAULT false, -- verified = from a completed booking
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Advance bookings (book a specific driver for a future date)
CREATE TABLE IF NOT EXISTS advance_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  service_id uuid REFERENCES driver_services(id) ON DELETE SET NULL,
  booking_date date NOT NULL,
  booking_time time NOT NULL,
  duration_hours numeric(4,2),
  pickup_location text,
  pickup_lat numeric(10,8),
  pickup_lng numeric(11,8),
  dropoff_location text,
  dropoff_lat numeric(10,8),
  dropoff_lng numeric(11,8),
  passengers integer DEFAULT 1,
  service_category text NOT NULL CHECK (service_category IN ('cruise_transfer', 'airport_transfer', 'tour', 'ride', 'hauling')),
  special_requests text,
  total_price numeric(10,2),
  currency text DEFAULT 'VUV',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  cruise_schedule_id uuid REFERENCES cruise_schedules(id),
  flight_id uuid REFERENCES flights(id),
  contact_name text,
  contact_phone text,
  contact_email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add bio and slug to drivers table
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS slug text UNIQUE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS years_experience integer;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS languages_spoken text[];
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS certifications text[];
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS response_time_minutes integer;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS total_reviews integer DEFAULT 0;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS avg_punctuality numeric(3,2);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS avg_vehicle numeric(3,2);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS avg_communication numeric(3,2);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS avg_value numeric(3,2);

-- Enable RLS
ALTER TABLE driver_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_bookings ENABLE ROW LEVEL SECURITY;

-- Reviews: anyone authenticated can read, users can write their own
CREATE POLICY "Anyone can view driver reviews" ON driver_reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users create own reviews" ON driver_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reviews" ON driver_reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage reviews" ON driver_reviews FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Advance bookings: users see their own, drivers see bookings for them, admins see all
CREATE POLICY "Users view own advance bookings" ON advance_bookings FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Drivers view their advance bookings" ON advance_bookings FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM drivers WHERE drivers.id = advance_bookings.driver_id AND drivers.user_id = auth.uid()));
CREATE POLICY "Users create advance bookings" ON advance_bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users cancel own advance bookings" ON advance_bookings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Drivers update their advance bookings" ON advance_bookings FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM drivers WHERE drivers.id = advance_bookings.driver_id AND drivers.user_id = auth.uid()));
CREATE POLICY "Admins manage advance bookings" ON advance_bookings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_driver_reviews_driver ON driver_reviews(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_reviews_user ON driver_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_advance_bookings_driver ON advance_bookings(driver_id);
CREATE INDEX IF NOT EXISTS idx_advance_bookings_user ON advance_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_advance_bookings_date ON advance_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_drivers_slug ON drivers(slug);

-- Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE advance_bookings;
