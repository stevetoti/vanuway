-- ============================================================================
-- VanuWay Daily: Admin-editable data tables
-- ============================================================================

-- Water Taxi Routes (managed by admin or operators)
CREATE TABLE IF NOT EXISTS water_taxi_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_name text NOT NULL,
  departure_point text NOT NULL,
  arrival_point text NOT NULL,
  price_vuv integer NOT NULL,
  duration_minutes integer DEFAULT 5,
  departures text[] NOT NULL, -- array of times like {'07:00','08:00','09:00'}
  operator_name text,
  operator_phone text,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Kava Price Index (updated weekly by admin)
CREATE TABLE IF NOT EXISTS kava_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grade text NOT NULL, -- 'Premium (Borogu)', 'Standard (Melomelo)', etc
  price_vuv integer NOT NULL,
  unit text DEFAULT 'per kg',
  trend text DEFAULT 'stable' CHECK (trend IN ('up', 'down', 'stable')),
  market_location text DEFAULT 'Port Vila',
  is_active boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

-- Power Outage Reports (community + admin)
CREATE TABLE IF NOT EXISTS power_outages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area text NOT NULL,
  description text,
  reported_by uuid REFERENCES auth.users(id),
  status text DEFAULT 'reported' CHECK (status IN ('reported', 'confirmed', 'resolved')),
  confirmed_by_admin boolean DEFAULT false,
  estimated_restore timestamptz,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Enable RLS
ALTER TABLE water_taxi_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE kava_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE power_outages ENABLE ROW LEVEL SECURITY;

-- Public read for all
CREATE POLICY "Anyone can view water taxi routes" ON water_taxi_routes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view kava prices" ON kava_prices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view power outages" ON power_outages FOR SELECT TO authenticated USING (true);

-- Users can report outages
CREATE POLICY "Users report outages" ON power_outages FOR INSERT TO authenticated WITH CHECK (auth.uid() = reported_by);

-- Admin manage all
CREATE POLICY "Admins manage water taxi" ON water_taxi_routes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins manage kava prices" ON kava_prices FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins manage outages" ON power_outages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Realtime for outages
ALTER PUBLICATION supabase_realtime ADD TABLE power_outages;

-- Seed water taxi routes
INSERT INTO water_taxi_routes (route_name, departure_point, arrival_point, price_vuv, duration_minutes, departures, operator_name) VALUES
('Iririki Island', 'Port Vila Waterfront', 'Iririki Island Resort', 300, 5, ARRAY['07:00','08:00','09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00'], 'Iririki Ferry'),
('Hideaway Island', 'Port Vila Waterfront', 'Hideaway Island', 500, 10, ARRAY['08:30','10:00','11:30','13:00','14:30','16:00'], 'Hideaway Island Resort'),
('Ifira Island', 'Port Vila Waterfront', 'Ifira Island', 200, 5, ARRAY['07:30','09:00','11:00','14:00','16:30'], 'Ifira Community');

-- Seed kava prices
INSERT INTO kava_prices (grade, price_vuv, unit, trend, market_location) VALUES
('Premium (Borogu)', 4500, 'per kg', 'stable', 'Port Vila'),
('Standard (Melomelo)', 3000, 'per kg', 'up', 'Port Vila'),
('Daily (Mixed)', 2000, 'per kg', 'stable', 'Port Vila'),
('Shell (nakamal)', 100, 'per shell', 'stable', 'Port Vila');
