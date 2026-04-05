-- ============================================================================
-- PHASE 1: Cruise Tourism, Airport Transfers, Scheduled Rides
-- ============================================================================

-- Cruise Lines
CREATE TABLE IF NOT EXISTS cruise_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  logo_url text,
  description text,
  website_url text,
  shore_excursion_email text,
  shore_excursion_phone text,
  partner_application_url text,
  partnership_status text DEFAULT 'prospect' CHECK (partnership_status IN ('prospect', 'contacted', 'negotiating', 'active', 'inactive')),
  commission_rate numeric(5,2),
  requirements text[],
  annual_passengers_vanuatu integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Cruise Ships
CREATE TABLE IF NOT EXISTS cruise_ships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cruise_line_id uuid REFERENCES cruise_lines(id) ON DELETE SET NULL,
  name text NOT NULL,
  imo_number text,
  mmsi_number text,
  passenger_capacity integer,
  crew_capacity integer,
  gross_tonnage integer,
  year_built integer,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Cruise Schedules (arrivals in Port Vila)
CREATE TABLE IF NOT EXISTS cruise_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ship_id uuid NOT NULL REFERENCES cruise_ships(id) ON DELETE CASCADE,
  arrival_date date NOT NULL,
  arrival_time time,
  departure_date date NOT NULL,
  departure_time time,
  port_name text DEFAULT 'Port Vila',
  berth_location text,
  voyage_number text,
  previous_port text,
  next_port text,
  expected_passengers integer,
  is_confirmed boolean DEFAULT true,
  is_cancelled boolean DEFAULT false,
  current_lat numeric(10,8),
  current_lng numeric(11,8),
  data_source text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(ship_id, arrival_date)
);

-- Airlines
CREATE TABLE IF NOT EXISTS airlines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  logo_url text,
  country text,
  created_at timestamptz DEFAULT now()
);

-- Flights (arrivals at Bauerfield Airport)
CREATE TABLE IF NOT EXISTS flights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  airline_id uuid REFERENCES airlines(id),
  flight_number text NOT NULL,
  origin_airport_code text NOT NULL,
  origin_city text,
  origin_country text,
  destination_airport_code text DEFAULT 'VLI',
  scheduled_arrival timestamptz NOT NULL,
  actual_arrival timestamptz,
  aircraft_type text,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'on_time', 'delayed', 'landed', 'cancelled')),
  is_international boolean DEFAULT true,
  estimated_passengers integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tour Packages (platform-wide, drivers can offer them)
CREATE TABLE IF NOT EXISTS tour_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  description text,
  short_description text,
  duration_hours numeric(4,2),
  category text,
  min_passengers integer DEFAULT 1,
  max_passengers integer,
  price_from numeric(10,2),
  currency text DEFAULT 'VUV',
  inclusions text[],
  exclusions text[],
  highlights text[],
  cover_image_url text,
  gallery_images text[],
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Driver Services (what each driver offers with their own pricing)
CREATE TABLE IF NOT EXISTS driver_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('cruise_transfer', 'airport_transfer', 'tour', 'hauling', 'ride')),
  duration_minutes integer,
  base_price numeric(10,2) NOT NULL,
  price_per_person numeric(10,2),
  min_passengers integer DEFAULT 1,
  max_passengers integer,
  inclusions text[],
  meeting_point text,
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Scheduled Rides (pre-booked rides for future dates)
ALTER TABLE ride_bookings ADD COLUMN IF NOT EXISTS scheduled_date date;
ALTER TABLE ride_bookings ADD COLUMN IF NOT EXISTS scheduled_time time;
ALTER TABLE ride_bookings ADD COLUMN IF NOT EXISTS is_scheduled boolean DEFAULT false;
ALTER TABLE ride_bookings ADD COLUMN IF NOT EXISTS cruise_schedule_id uuid REFERENCES cruise_schedules(id);
ALTER TABLE ride_bookings ADD COLUMN IF NOT EXISTS flight_id uuid REFERENCES flights(id);
ALTER TABLE ride_bookings ADD COLUMN IF NOT EXISTS service_category text DEFAULT 'ride';
ALTER TABLE ride_bookings ADD COLUMN IF NOT EXISTS notes text;

-- Enable RLS
ALTER TABLE cruise_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE cruise_ships ENABLE ROW LEVEL SECURITY;
ALTER TABLE cruise_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE airlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_services ENABLE ROW LEVEL SECURITY;

-- Public read for all tourism data
CREATE POLICY "Anyone can view cruise lines" ON cruise_lines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view cruise ships" ON cruise_ships FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view cruise schedules" ON cruise_schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view airlines" ON airlines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view flights" ON flights FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view tour packages" ON tour_packages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view driver services" ON driver_services FOR SELECT TO authenticated USING (true);

-- Admin write
CREATE POLICY "Admins manage cruise lines" ON cruise_lines FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins manage cruise ships" ON cruise_ships FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins manage cruise schedules" ON cruise_schedules FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins manage airlines" ON airlines FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins manage flights" ON flights FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins manage tour packages" ON tour_packages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Drivers manage their own services
CREATE POLICY "Drivers manage own services" ON driver_services FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM drivers WHERE drivers.id = driver_services.driver_id AND drivers.user_id = auth.uid()));
CREATE POLICY "Drivers insert services" ON driver_services FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM drivers WHERE drivers.id = driver_services.driver_id AND drivers.user_id = auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cruise_schedules_arrival ON cruise_schedules(arrival_date);
CREATE INDEX IF NOT EXISTS idx_flights_arrival ON flights(scheduled_arrival);
CREATE INDEX IF NOT EXISTS idx_driver_services_driver ON driver_services(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_services_category ON driver_services(category);

-- Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE cruise_schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE flights;

-- ============================================================================
-- SEED DATA: Cruise Lines & Ships
-- ============================================================================

INSERT INTO cruise_lines (name, description, website_url, shore_excursion_email, annual_passengers_vanuatu, partnership_status, requirements) VALUES
('P&O Cruises Australia', 'Leading Australian cruise line with regular South Pacific sailings', 'https://www.pocruises.com.au', 'shoreexcursions@pocruises.com.au', 50000, 'prospect', ARRAY['Public liability insurance $10M', 'Vehicle registration', 'Police clearance']),
('Royal Caribbean', 'Premium cruise line known for innovative ships', 'https://www.royalcaribbean.com', 'shorexpartners@rccl.com', 25000, 'prospect', ARRAY['Public liability insurance $10M', 'Vehicle inspection certificate']),
('Carnival Cruise Line', 'World''s largest cruise line', 'https://www.carnival.com', 'shoreex@carnival.com', 30000, 'prospect', ARRAY['Public liability insurance $5M', 'Business registration']),
('Princess Cruises', 'Premium destination-focused cruise line', 'https://www.princess.com', 'shoreexcursions@princess.com', 20000, 'prospect', ARRAY['Public liability insurance $10M', 'Driver background check']),
('Holland America Line', 'Premium cruise with classic heritage', 'https://www.hollandamerica.com', 'shoreex@hollandamerica.com', 15000, 'prospect', ARRAY['Public liability insurance $5M']),
('Norwegian Cruise Line', 'Freestyle cruising with flexibility', 'https://www.ncl.com', 'shoreexcursions@ncl.com', 10000, 'prospect', ARRAY['Public liability insurance $5M', 'Vehicle registration']),
('Coral Expeditions', 'Australian expedition cruise line', 'https://www.coralexpeditions.com', 'operations@coralexpeditions.com', 2000, 'prospect', ARRAY['Public liability insurance $5M'])
ON CONFLICT (name) DO NOTHING;

INSERT INTO cruise_ships (cruise_line_id, name, passenger_capacity, year_built, image_url) VALUES
((SELECT id FROM cruise_lines WHERE name = 'P&O Cruises Australia'), 'Pacific Adventure', 2636, 2002, NULL),
((SELECT id FROM cruise_lines WHERE name = 'P&O Cruises Australia'), 'Pacific Encounter', 2600, 2001, NULL),
((SELECT id FROM cruise_lines WHERE name = 'P&O Cruises Australia'), 'Pacific Explorer', 1998, 1997, NULL),
((SELECT id FROM cruise_lines WHERE name = 'Royal Caribbean'), 'Ovation of the Seas', 4180, 2016, NULL),
((SELECT id FROM cruise_lines WHERE name = 'Royal Caribbean'), 'Quantum of the Seas', 4180, 2014, NULL),
((SELECT id FROM cruise_lines WHERE name = 'Carnival Cruise Line'), 'Carnival Splendor', 3006, 2008, NULL),
((SELECT id FROM cruise_lines WHERE name = 'Princess Cruises'), 'Coral Princess', 1970, 2002, NULL),
((SELECT id FROM cruise_lines WHERE name = 'Holland America Line'), 'Westerdam', 1964, 2004, NULL),
((SELECT id FROM cruise_lines WHERE name = 'Norwegian Cruise Line'), 'Norwegian Spirit', 2018, 1998, NULL),
((SELECT id FROM cruise_lines WHERE name = 'Coral Expeditions'), 'Coral Adventurer', 120, 2019, NULL);

-- Sample cruise schedule (next 2 months)
INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, previous_port, next_port) VALUES
((SELECT id FROM cruise_ships WHERE name = 'Pacific Adventure'), '2026-04-10', '08:00', '2026-04-10', '17:00', 2636, 'Noumea', 'Lifou'),
((SELECT id FROM cruise_ships WHERE name = 'Ovation of the Seas'), '2026-04-15', '07:00', '2026-04-15', '18:00', 4180, 'Sydney', 'Mystery Island'),
((SELECT id FROM cruise_ships WHERE name = 'Coral Princess'), '2026-04-18', '08:00', '2026-04-18', '17:00', 1970, 'Brisbane', 'Noumea'),
((SELECT id FROM cruise_ships WHERE name = 'Pacific Encounter'), '2026-04-22', '08:00', '2026-04-22', '17:00', 2600, 'Auckland', 'Lifou'),
((SELECT id FROM cruise_ships WHERE name = 'Carnival Splendor'), '2026-04-28', '07:00', '2026-04-28', '16:00', 3006, 'Sydney', 'Mystery Island'),
((SELECT id FROM cruise_ships WHERE name = 'Westerdam'), '2026-05-02', '08:00', '2026-05-02', '17:00', 1964, 'Noumea', 'Fiji'),
((SELECT id FROM cruise_ships WHERE name = 'Pacific Adventure'), '2026-05-08', '08:00', '2026-05-08', '17:00', 2636, 'Noumea', 'Brisbane'),
((SELECT id FROM cruise_ships WHERE name = 'Ovation of the Seas'), '2026-05-12', '07:00', '2026-05-12', '18:00', 4180, 'Sydney', 'Noumea'),
((SELECT id FROM cruise_ships WHERE name = 'Norwegian Spirit'), '2026-05-15', '08:00', '2026-05-15', '18:00', 2018, 'Auckland', 'Fiji'),
((SELECT id FROM cruise_ships WHERE name = 'Coral Adventurer'), '2026-05-20', '06:00', '2026-05-21', '17:00', 120, 'Santo', 'Tanna')
ON CONFLICT (ship_id, arrival_date) DO NOTHING;

-- Airlines seed
INSERT INTO airlines (name, code, country) VALUES
('Air Vanuatu', 'NF', 'Vanuatu'),
('Fiji Airways', 'FJ', 'Fiji'),
('Qantas', 'QF', 'Australia'),
('Air New Zealand', 'NZ', 'New Zealand'),
('Solomon Airlines', 'IE', 'Solomon Islands')
ON CONFLICT (code) DO NOTHING;

-- Tour packages seed
INSERT INTO tour_packages (name, slug, short_description, duration_hours, price_from, category, inclusions, highlights, is_featured, cover_image_url) VALUES
('Port Vila City Discovery', 'port-vila-city', 'Discover the vibrant capital of Vanuatu', 3, 8000, 'City Tours', ARRAY['Air-conditioned vehicle', 'English-speaking driver', 'Bottled water'], ARRAY['Port Vila Market', 'Independence Park', 'Seafront Promenade'], true, NULL),
('Mele Cascades Waterfall', 'mele-cascades', 'Swim in stunning jungle waterfalls', 4, 12000, 'Nature & Adventure', ARRAY['Round-trip transport', 'Entry fees', 'Bottled water'], ARRAY['Multiple swimming pools', 'Rainforest trek', 'Photo opportunities'], true, NULL),
('Hideaway Island Snorkeling', 'hideaway-island', 'Snorkel at the underwater post office', 5, 15000, 'Water Activities', ARRAY['Round-trip transport', 'Island ferry', 'Snorkel gear', 'Lunch'], ARRAY['Underwater Post Office', 'Coral reef snorkeling', 'Beach time'], true, NULL),
('Ekasup Cultural Village', 'ekasup-village', 'Experience authentic Ni-Vanuatu village life', 3, 10000, 'Cultural', ARRAY['Round-trip transport', 'Village entry fee', 'Cultural show'], ARRAY['Traditional dancing', 'Kava ceremony', 'Handicraft demonstrations'], true, NULL),
('Blue Lagoon & Beach Day', 'blue-lagoon', 'Relax at pristine beaches and blue lagoon', 6, 18000, 'Beach & Relaxation', ARRAY['Round-trip transport', 'Entry fees', 'Picnic lunch'], ARRAY['Crystal-clear lagoon', 'White sand beach', 'Swimming'], false, NULL),
('Full Day Island Explorer', 'full-day-explorer', 'The ultimate Efate island experience', 8, 35000, 'Combo Tours', ARRAY['Full-day transport', 'All entry fees', 'Lunch', 'Refreshments'], ARRAY['Mele Cascades', 'Cultural village', 'Blue Lagoon', 'City tour'], true, NULL),
('Airport Transfer', 'airport-transfer', 'Hassle-free airport pickup or dropoff', 1, 4000, 'Transfers', ARRAY['Meet and greet', 'Luggage assistance', 'Air-conditioned vehicle'], ARRAY['On-time pickup', 'Flight monitoring'], false, NULL),
('Cruise Port Transfer', 'port-transfer', 'Cruise terminal pickup and return service', 0.5, 3000, 'Transfers', ARRAY['Port pickup', 'Air-conditioned vehicle'], ARRAY['Waiting at port', 'Flexible timing'], false, NULL)
ON CONFLICT (slug) DO NOTHING;
