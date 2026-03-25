-- Ferry & Flights Booking System for Vanuatu
-- Inter-island transport booking

-- ============================================
-- TRANSPORT OPERATORS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.transport_operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ferry', 'airline', 'charter')),
  description TEXT,
  logo_url TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  website TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROUTES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.transport_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES public.transport_operators(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('ferry', 'flight')),
  origin_island TEXT NOT NULL,
  destination_island TEXT NOT NULL,
  origin_port TEXT, -- Port Vila Harbour, Bauerfield Airport, etc.
  destination_port TEXT,
  duration_minutes INTEGER,
  distance_km DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SCHEDULES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.transport_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES public.transport_routes(id) ON DELETE CASCADE,
  vessel_name TEXT, -- Ship name or aircraft type
  departure_time TIME NOT NULL,
  arrival_time TIME,
  days_of_week INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7], -- 1=Monday, 7=Sunday
  effective_from DATE NOT NULL,
  effective_until DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FARE CLASSES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.transport_fares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES public.transport_routes(id) ON DELETE CASCADE,
  class_name TEXT NOT NULL, -- 'economy', 'business', 'deck', 'cabin'
  price_adult DECIMAL(10,2) NOT NULL,
  price_child DECIMAL(10,2),
  price_infant DECIMAL(10,2) DEFAULT 0,
  baggage_allowance_kg INTEGER DEFAULT 20,
  is_refundable BOOLEAN DEFAULT false,
  change_fee DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRIPS (ACTUAL DEPARTURES) TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.transport_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES public.transport_schedules(id) ON DELETE SET NULL,
  route_id UUID NOT NULL REFERENCES public.transport_routes(id) ON DELETE CASCADE,
  departure_date DATE NOT NULL,
  departure_time TIME NOT NULL,
  arrival_time TIME,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'boarding', 'departed', 'arrived', 'delayed', 'cancelled')),
  delay_minutes INTEGER DEFAULT 0,
  total_capacity INTEGER DEFAULT 100,
  available_seats INTEGER DEFAULT 100,
  vessel_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BOOKINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.transport_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES public.transport_trips(id) ON DELETE CASCADE,
  fare_id UUID NOT NULL REFERENCES public.transport_fares(id) ON DELETE CASCADE,
  booking_reference TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show')),

  -- Passenger count
  adults INTEGER NOT NULL DEFAULT 1,
  children INTEGER DEFAULT 0,
  infants INTEGER DEFAULT 0,

  -- Pricing
  base_price DECIMAL(10,2) NOT NULL,
  taxes_fees DECIMAL(10,2) DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'VUV',

  -- Payment
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'partial_refund')),
  payment_method TEXT,
  payment_reference TEXT,

  -- Contact details
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT,

  -- Timestamps
  booked_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PASSENGERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.transport_passengers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.transport_bookings(id) ON DELETE CASCADE,
  passenger_type TEXT NOT NULL CHECK (passenger_type IN ('adult', 'child', 'infant')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  nationality TEXT,
  id_type TEXT, -- 'passport', 'national_id', 'drivers_license'
  id_number TEXT,
  seat_number TEXT,
  special_requirements TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_transport_routes_type ON public.transport_routes(type);
CREATE INDEX IF NOT EXISTS idx_transport_routes_origin ON public.transport_routes(origin_island);
CREATE INDEX IF NOT EXISTS idx_transport_routes_destination ON public.transport_routes(destination_island);
CREATE INDEX IF NOT EXISTS idx_transport_schedules_route ON public.transport_schedules(route_id);
CREATE INDEX IF NOT EXISTS idx_transport_trips_date ON public.transport_trips(departure_date);
CREATE INDEX IF NOT EXISTS idx_transport_trips_route ON public.transport_trips(route_id);
CREATE INDEX IF NOT EXISTS idx_transport_bookings_user ON public.transport_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_transport_bookings_trip ON public.transport_bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_transport_bookings_reference ON public.transport_bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_transport_passengers_booking ON public.transport_passengers(booking_id);

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE public.transport_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_fares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_passengers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Public can view operators
DROP POLICY IF EXISTS "Public can view active operators" ON public.transport_operators;
CREATE POLICY "Public can view active operators"
  ON public.transport_operators FOR SELECT
  USING (is_active = true);

-- Public can view routes
DROP POLICY IF EXISTS "Public can view active routes" ON public.transport_routes;
CREATE POLICY "Public can view active routes"
  ON public.transport_routes FOR SELECT
  USING (is_active = true);

-- Public can view schedules
DROP POLICY IF EXISTS "Public can view active schedules" ON public.transport_schedules;
CREATE POLICY "Public can view active schedules"
  ON public.transport_schedules FOR SELECT
  USING (is_active = true);

-- Public can view fares
DROP POLICY IF EXISTS "Public can view active fares" ON public.transport_fares;
CREATE POLICY "Public can view active fares"
  ON public.transport_fares FOR SELECT
  USING (is_active = true);

-- Public can view trips
DROP POLICY IF EXISTS "Public can view scheduled trips" ON public.transport_trips;
CREATE POLICY "Public can view scheduled trips"
  ON public.transport_trips FOR SELECT
  USING (status NOT IN ('cancelled'));

-- Users can view their bookings
DROP POLICY IF EXISTS "Users can view their bookings" ON public.transport_bookings;
CREATE POLICY "Users can view their bookings"
  ON public.transport_bookings FOR SELECT
  USING (user_id = auth.uid());

-- Users can create bookings
DROP POLICY IF EXISTS "Users can create bookings" ON public.transport_bookings;
CREATE POLICY "Users can create bookings"
  ON public.transport_bookings FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update pending bookings
DROP POLICY IF EXISTS "Users can update pending bookings" ON public.transport_bookings;
CREATE POLICY "Users can update pending bookings"
  ON public.transport_bookings FOR UPDATE
  USING (user_id = auth.uid() AND status IN ('pending', 'confirmed'));

-- Users can view their passengers
DROP POLICY IF EXISTS "Users can view their passengers" ON public.transport_passengers;
CREATE POLICY "Users can view their passengers"
  ON public.transport_passengers FOR SELECT
  USING (booking_id IN (SELECT id FROM public.transport_bookings WHERE user_id = auth.uid()));

-- Users can add passengers to their bookings
DROP POLICY IF EXISTS "Users can add passengers" ON public.transport_passengers;
CREATE POLICY "Users can add passengers"
  ON public.transport_passengers FOR INSERT
  WITH CHECK (booking_id IN (SELECT id FROM public.transport_bookings WHERE user_id = auth.uid()));

-- Admins can manage all data
DROP POLICY IF EXISTS "Admins can manage operators" ON public.transport_operators;
CREATE POLICY "Admins can manage operators"
  ON public.transport_operators FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can manage routes" ON public.transport_routes;
CREATE POLICY "Admins can manage routes"
  ON public.transport_routes FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can manage schedules" ON public.transport_schedules;
CREATE POLICY "Admins can manage schedules"
  ON public.transport_schedules FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can manage fares" ON public.transport_fares;
CREATE POLICY "Admins can manage fares"
  ON public.transport_fares FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can manage trips" ON public.transport_trips;
CREATE POLICY "Admins can manage trips"
  ON public.transport_trips FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can manage bookings" ON public.transport_bookings;
CREATE POLICY "Admins can manage bookings"
  ON public.transport_bookings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can manage passengers" ON public.transport_passengers;
CREATE POLICY "Admins can manage passengers"
  ON public.transport_passengers FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ============================================
-- FUNCTIONS
-- ============================================

-- Generate booking reference
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TEXT AS $$
DECLARE
  ref TEXT;
  exists_count INTEGER;
BEGIN
  LOOP
    ref := 'VW' || upper(substring(md5(random()::text) from 1 for 6));
    SELECT COUNT(*) INTO exists_count FROM public.transport_bookings WHERE booking_reference = ref;
    IF exists_count = 0 THEN
      RETURN ref;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set booking reference
CREATE OR REPLACE FUNCTION set_booking_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_reference IS NULL THEN
    NEW.booking_reference := generate_booking_reference();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_booking_reference_trigger ON public.transport_bookings;
CREATE TRIGGER set_booking_reference_trigger
  BEFORE INSERT ON public.transport_bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_reference();

-- Update available seats on booking
CREATE OR REPLACE FUNCTION update_trip_seats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.transport_trips
    SET available_seats = available_seats - (NEW.adults + NEW.children)
    WHERE id = NEW.trip_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
      UPDATE public.transport_trips
      SET available_seats = available_seats + (NEW.adults + NEW.children)
      WHERE id = NEW.trip_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_trip_seats_trigger ON public.transport_bookings;
CREATE TRIGGER update_trip_seats_trigger
  AFTER INSERT OR UPDATE ON public.transport_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_trip_seats();

-- ============================================
-- SEED DATA
-- ============================================

-- Insert Transport Operators
INSERT INTO public.transport_operators (name, type, description, contact_phone, contact_email) VALUES
('Big Sista Shipping', 'ferry', 'Major inter-island ferry operator connecting Port Vila to outer islands', '+678 23456', 'info@bigsista.vu'),
('Ifira Shipping', 'ferry', 'Reliable ferry services throughout Vanuatu', '+678 25678', 'bookings@ifira.vu'),
('Air Vanuatu', 'airline', 'National airline of Vanuatu with domestic and international flights', '+678 23848', 'reservations@airvanuatu.vu'),
('Unity Airlines', 'airline', 'Regional airline serving outer islands', '+678 27890', 'book@unityair.vu'),
('Island Hoppers Charter', 'charter', 'Private charter flights to remote destinations', '+678 28765', 'charter@islandhoppers.vu')
ON CONFLICT DO NOTHING;

-- Insert Routes (Ferry)
INSERT INTO public.transport_routes (operator_id, type, origin_island, destination_island, origin_port, destination_port, duration_minutes, distance_km)
SELECT o.id, 'ferry', 'Efate', 'Tanna', 'Port Vila Harbour', 'Lenakel Wharf', 600, 200
FROM public.transport_operators o WHERE o.name = 'Big Sista Shipping'
ON CONFLICT DO NOTHING;

INSERT INTO public.transport_routes (operator_id, type, origin_island, destination_island, origin_port, destination_port, duration_minutes, distance_km)
SELECT o.id, 'ferry', 'Efate', 'Malekula', 'Port Vila Harbour', 'Lakatoro Wharf', 720, 250
FROM public.transport_operators o WHERE o.name = 'Big Sista Shipping'
ON CONFLICT DO NOTHING;

INSERT INTO public.transport_routes (operator_id, type, origin_island, destination_island, origin_port, destination_port, duration_minutes, distance_km)
SELECT o.id, 'ferry', 'Efate', 'Santo', 'Port Vila Harbour', 'Luganville Port', 960, 350
FROM public.transport_operators o WHERE o.name = 'Ifira Shipping'
ON CONFLICT DO NOTHING;

INSERT INTO public.transport_routes (operator_id, type, origin_island, destination_island, origin_port, destination_port, duration_minutes, distance_km)
SELECT o.id, 'ferry', 'Efate', 'Epi', 'Port Vila Harbour', 'Lamen Bay', 480, 150
FROM public.transport_operators o WHERE o.name = 'Ifira Shipping'
ON CONFLICT DO NOTHING;

-- Insert Routes (Flights)
INSERT INTO public.transport_routes (operator_id, type, origin_island, destination_island, origin_port, destination_port, duration_minutes, distance_km)
SELECT o.id, 'flight', 'Efate', 'Tanna', 'Bauerfield Airport (VLI)', 'Whitegrass Airport (TAH)', 45, 200
FROM public.transport_operators o WHERE o.name = 'Air Vanuatu'
ON CONFLICT DO NOTHING;

INSERT INTO public.transport_routes (operator_id, type, origin_island, destination_island, origin_port, destination_port, duration_minutes, distance_km)
SELECT o.id, 'flight', 'Efate', 'Santo', 'Bauerfield Airport (VLI)', 'Pekoa Airport (SON)', 50, 350
FROM public.transport_operators o WHERE o.name = 'Air Vanuatu'
ON CONFLICT DO NOTHING;

INSERT INTO public.transport_routes (operator_id, type, origin_island, destination_island, origin_port, destination_port, duration_minutes, distance_km)
SELECT o.id, 'flight', 'Efate', 'Malekula', 'Bauerfield Airport (VLI)', 'Norsup Airport (NUS)', 40, 250
FROM public.transport_operators o WHERE o.name = 'Unity Airlines'
ON CONFLICT DO NOTHING;

INSERT INTO public.transport_routes (operator_id, type, origin_island, destination_island, origin_port, destination_port, duration_minutes, distance_km)
SELECT o.id, 'flight', 'Santo', 'Tanna', 'Pekoa Airport (SON)', 'Whitegrass Airport (TAH)', 75, 450
FROM public.transport_operators o WHERE o.name = 'Unity Airlines'
ON CONFLICT DO NOTHING;

-- Insert Fares for Ferry Routes
INSERT INTO public.transport_fares (route_id, class_name, price_adult, price_child, baggage_allowance_kg, is_refundable)
SELECT r.id, 'deck', 3500, 1750, 30, false
FROM public.transport_routes r WHERE r.type = 'ferry' AND r.origin_island = 'Efate' AND r.destination_island = 'Tanna'
ON CONFLICT DO NOTHING;

INSERT INTO public.transport_fares (route_id, class_name, price_adult, price_child, baggage_allowance_kg, is_refundable)
SELECT r.id, 'cabin', 7500, 4000, 50, true
FROM public.transport_routes r WHERE r.type = 'ferry' AND r.origin_island = 'Efate' AND r.destination_island = 'Tanna'
ON CONFLICT DO NOTHING;

INSERT INTO public.transport_fares (route_id, class_name, price_adult, price_child, baggage_allowance_kg, is_refundable)
SELECT r.id, 'deck', 4500, 2250, 30, false
FROM public.transport_routes r WHERE r.type = 'ferry' AND r.origin_island = 'Efate' AND r.destination_island = 'Santo'
ON CONFLICT DO NOTHING;

INSERT INTO public.transport_fares (route_id, class_name, price_adult, price_child, baggage_allowance_kg, is_refundable)
SELECT r.id, 'cabin', 9500, 5000, 50, true
FROM public.transport_routes r WHERE r.type = 'ferry' AND r.origin_island = 'Efate' AND r.destination_island = 'Santo'
ON CONFLICT DO NOTHING;

-- Insert Fares for Flights
INSERT INTO public.transport_fares (route_id, class_name, price_adult, price_child, baggage_allowance_kg, is_refundable, change_fee)
SELECT r.id, 'economy', 12500, 6500, 20, false, 2500
FROM public.transport_routes r WHERE r.type = 'flight' AND r.origin_island = 'Efate' AND r.destination_island = 'Tanna'
ON CONFLICT DO NOTHING;

INSERT INTO public.transport_fares (route_id, class_name, price_adult, price_child, baggage_allowance_kg, is_refundable, change_fee)
SELECT r.id, 'business', 25000, 15000, 30, true, 0
FROM public.transport_routes r WHERE r.type = 'flight' AND r.origin_island = 'Efate' AND r.destination_island = 'Tanna'
ON CONFLICT DO NOTHING;

INSERT INTO public.transport_fares (route_id, class_name, price_adult, price_child, baggage_allowance_kg, is_refundable, change_fee)
SELECT r.id, 'economy', 14500, 7500, 20, false, 2500
FROM public.transport_routes r WHERE r.type = 'flight' AND r.origin_island = 'Efate' AND r.destination_island = 'Santo'
ON CONFLICT DO NOTHING;

-- Insert Schedules for Ferry Routes
INSERT INTO public.transport_schedules (route_id, vessel_name, departure_time, arrival_time, days_of_week, effective_from, notes)
SELECT r.id, 'MV Big Sista', '22:00', '08:00', ARRAY[2,5], '2026-01-01', 'Overnight ferry, departs Tuesday & Friday'
FROM public.transport_routes r WHERE r.type = 'ferry' AND r.destination_island = 'Tanna' AND r.operator_id = (SELECT id FROM public.transport_operators WHERE name = 'Big Sista Shipping')
ON CONFLICT DO NOTHING;

INSERT INTO public.transport_schedules (route_id, vessel_name, departure_time, arrival_time, days_of_week, effective_from, notes)
SELECT r.id, 'MV Ifira', '18:00', '10:00', ARRAY[1,4], '2026-01-01', 'Overnight ferry, departs Monday & Thursday'
FROM public.transport_routes r WHERE r.type = 'ferry' AND r.destination_island = 'Santo' AND r.operator_id = (SELECT id FROM public.transport_operators WHERE name = 'Ifira Shipping')
ON CONFLICT DO NOTHING;

-- Insert Schedules for Flights
INSERT INTO public.transport_schedules (route_id, vessel_name, departure_time, arrival_time, days_of_week, effective_from, notes)
SELECT r.id, 'ATR 72', '07:30', '08:15', ARRAY[1,2,3,4,5,6,7], '2026-01-01', 'Daily morning flight'
FROM public.transport_routes r WHERE r.type = 'flight' AND r.origin_island = 'Efate' AND r.destination_island = 'Tanna' AND r.operator_id = (SELECT id FROM public.transport_operators WHERE name = 'Air Vanuatu')
ON CONFLICT DO NOTHING;

INSERT INTO public.transport_schedules (route_id, vessel_name, departure_time, arrival_time, days_of_week, effective_from, notes)
SELECT r.id, 'ATR 72', '14:00', '14:45', ARRAY[1,3,5,7], '2026-01-01', 'Afternoon flight on Mon, Wed, Fri, Sun'
FROM public.transport_routes r WHERE r.type = 'flight' AND r.origin_island = 'Efate' AND r.destination_island = 'Tanna' AND r.operator_id = (SELECT id FROM public.transport_operators WHERE name = 'Air Vanuatu')
ON CONFLICT DO NOTHING;

INSERT INTO public.transport_schedules (route_id, vessel_name, departure_time, arrival_time, days_of_week, effective_from, notes)
SELECT r.id, 'ATR 72', '08:30', '09:20', ARRAY[1,2,3,4,5,6,7], '2026-01-01', 'Daily morning flight'
FROM public.transport_routes r WHERE r.type = 'flight' AND r.origin_island = 'Efate' AND r.destination_island = 'Santo' AND r.operator_id = (SELECT id FROM public.transport_operators WHERE name = 'Air Vanuatu')
ON CONFLICT DO NOTHING;

INSERT INTO public.transport_schedules (route_id, vessel_name, departure_time, arrival_time, days_of_week, effective_from, notes)
SELECT r.id, 'ATR 72', '16:00', '16:50', ARRAY[1,2,3,4,5,6,7], '2026-01-01', 'Daily afternoon flight'
FROM public.transport_routes r WHERE r.type = 'flight' AND r.origin_island = 'Efate' AND r.destination_island = 'Santo' AND r.operator_id = (SELECT id FROM public.transport_operators WHERE name = 'Air Vanuatu')
ON CONFLICT DO NOTHING;

-- Generate sample trips for the next 30 days
INSERT INTO public.transport_trips (schedule_id, route_id, departure_date, departure_time, arrival_time, total_capacity, available_seats, vessel_name)
SELECT
  s.id,
  s.route_id,
  d.date,
  s.departure_time,
  s.arrival_time,
  CASE WHEN r.type = 'ferry' THEN 200 ELSE 68 END,
  CASE WHEN r.type = 'ferry' THEN 200 ELSE 68 END,
  s.vessel_name
FROM public.transport_schedules s
JOIN public.transport_routes r ON s.route_id = r.id
CROSS JOIN generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', INTERVAL '1 day') AS d(date)
WHERE EXTRACT(ISODOW FROM d.date) = ANY(s.days_of_week)
ON CONFLICT DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.transport_operators IS 'Ferry and airline operators in Vanuatu';
COMMENT ON TABLE public.transport_routes IS 'Routes between islands';
COMMENT ON TABLE public.transport_schedules IS 'Regular schedules for routes';
COMMENT ON TABLE public.transport_fares IS 'Fare classes and pricing for routes';
COMMENT ON TABLE public.transport_trips IS 'Actual departures/trips with availability';
COMMENT ON TABLE public.transport_bookings IS 'User bookings for trips';
COMMENT ON TABLE public.transport_passengers IS 'Individual passengers on bookings';
