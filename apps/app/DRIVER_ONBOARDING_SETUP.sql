-- =====================================================
-- VANUWAY DRIVER ONBOARDING SYSTEM SETUP
-- =====================================================
-- Phase 2-A: Driver Onboarding & Management
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =====================================================
-- HELPER FUNCTION (if not already exists)
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TABLE: drivers
-- =====================================================
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),

  phone_number TEXT NOT NULL,
  email TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,

  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Vanuatu',

  national_id TEXT,
  passport_number TEXT,
  tax_id TEXT,

  license_number TEXT NOT NULL,
  license_type TEXT,
  license_issue_date DATE,
  license_expiry_date DATE,
  license_verified BOOLEAN DEFAULT FALSE,

  bank_name TEXT,
  bank_account_number TEXT,
  bank_account_name TEXT,
  mobile_money_provider TEXT,
  mobile_money_number TEXT,

  profile_photo_url TEXT,
  bio TEXT,
  languages TEXT[],

  application_status TEXT NOT NULL DEFAULT 'pending' CHECK (application_status IN (
    'draft', 'pending', 'under_review', 'approved', 'rejected', 'suspended', 'deactivated'
  )),
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN (
    'unverified', 'partially_verified', 'verified'
  )),

  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,

  is_active BOOLEAN DEFAULT TRUE,
  is_online BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT FALSE,

  background_check_status TEXT DEFAULT 'pending' CHECK (background_check_status IN (
    'pending', 'in_progress', 'passed', 'failed', 'expired'
  )),
  background_check_date DATE,
  background_check_expiry DATE,
  background_check_provider TEXT,

  total_rides INTEGER DEFAULT 0,
  completed_rides INTEGER DEFAULT 0,
  cancelled_rides INTEGER DEFAULT 0,
  acceptance_rate DECIMAL(5,2) DEFAULT 0,
  cancellation_rate DECIMAL(5,2) DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,

  total_earnings DECIMAL(12,2) DEFAULT 0,
  pending_earnings DECIMAL(12,2) DEFAULT 0,
  paid_earnings DECIMAL(12,2) DEFAULT 0,

  safety_training_completed BOOLEAN DEFAULT FALSE,
  safety_training_date DATE,

  preferred_service_types TEXT[],
  preferred_areas TEXT[],

  metadata JSONB,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_drivers_user ON public.drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON public.drivers(application_status, is_active);
CREATE INDEX IF NOT EXISTS idx_drivers_online ON public.drivers(is_online, is_available);
CREATE INDEX IF NOT EXISTS idx_drivers_rating ON public.drivers(average_rating DESC);

-- =====================================================
-- TABLE: driver_vehicles
-- =====================================================
CREATE TABLE IF NOT EXISTS public.driver_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,

  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN (
    'car', 'suv', 'van', 'moto', 'bike', 'truck', 'wheelchair_van'
  )),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  color TEXT,
  license_plate TEXT NOT NULL UNIQUE,

  registration_number TEXT,
  registration_expiry DATE,

  insurance_provider TEXT,
  insurance_policy_number TEXT,
  insurance_expiry DATE,
  insurance_verified BOOLEAN DEFAULT FALSE,

  last_inspection_date DATE,
  next_inspection_due DATE,
  inspection_status TEXT CHECK (inspection_status IN ('pending', 'passed', 'failed', 'expired')),

  passenger_capacity INTEGER DEFAULT 4,
  luggage_capacity INTEGER DEFAULT 2,

  wheelchair_accessible BOOLEAN DEFAULT FALSE,
  has_car_seat BOOLEAN DEFAULT FALSE,
  has_pet_carrier BOOLEAN DEFAULT FALSE,

  vehicle_photos TEXT[],

  is_primary BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN (
    'pending', 'approved', 'rejected'
  )),

  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,

  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_vehicles_driver ON public.driver_vehicles(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_vehicles_type ON public.driver_vehicles(vehicle_type, is_active);
CREATE INDEX IF NOT EXISTS idx_driver_vehicles_primary ON public.driver_vehicles(driver_id, is_primary);

-- =====================================================
-- TABLE: driver_documents
-- =====================================================
CREATE TABLE IF NOT EXISTS public.driver_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,

  document_type TEXT NOT NULL CHECK (document_type IN (
    'drivers_license_front', 'drivers_license_back',
    'national_id_front', 'national_id_back',
    'passport', 'vehicle_registration', 'vehicle_insurance',
    'background_check', 'profile_photo', 'vehicle_photo',
    'bank_statement', 'proof_of_address', 'other'
  )),

  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,

  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN (
    'pending', 'approved', 'rejected', 'expired'
  )),
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,

  expires_at DATE,
  is_expired BOOLEAN GENERATED ALWAYS AS (expires_at < CURRENT_DATE) STORED,

  rejection_reason TEXT,

  metadata JSONB,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_documents_driver ON public.driver_documents(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_documents_type ON public.driver_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_driver_documents_status ON public.driver_documents(verification_status);
CREATE INDEX IF NOT EXISTS idx_driver_documents_expiry ON public.driver_documents(expires_at) WHERE expires_at IS NOT NULL;

-- =====================================================
-- TABLE: driver_applications
-- =====================================================
CREATE TABLE IF NOT EXISTS public.driver_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  step_personal_info BOOLEAN DEFAULT FALSE,
  step_license BOOLEAN DEFAULT FALSE,
  step_vehicle BOOLEAN DEFAULT FALSE,
  step_documents BOOLEAN DEFAULT FALSE,
  step_background_check BOOLEAN DEFAULT FALSE,

  current_step INTEGER DEFAULT 1,
  total_steps INTEGER DEFAULT 5,

  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN (
    'in_progress', 'submitted', 'under_review', 'approved', 'rejected', 'withdrawn'
  )),

  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  submitted_at TIMESTAMPTZ,

  decision_date TIMESTAMPTZ,
  decision_notes TEXT,

  resubmission_count INTEGER DEFAULT 0,

  application_data JSONB,
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_applications_driver ON public.driver_applications(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_applications_status ON public.driver_applications(status);
CREATE INDEX IF NOT EXISTS idx_driver_applications_submitted ON public.driver_applications(submitted_at);

-- =====================================================
-- TABLE: driver_availability
-- =====================================================
CREATE TABLE IF NOT EXISTS public.driver_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,

  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  timezone TEXT DEFAULT 'Pacific/Efate',

  is_active BOOLEAN DEFAULT TRUE,
  is_recurring BOOLEAN DEFAULT TRUE,

  specific_date DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_availability_driver ON public.driver_availability(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_availability_day ON public.driver_availability(day_of_week, is_active);

-- =====================================================
-- TABLE: driver_locations
-- =====================================================
CREATE TABLE IF NOT EXISTS public.driver_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,

  location GEOGRAPHY(Point, 4326) NOT NULL,

  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,

  heading DECIMAL(5,2),
  speed DECIMAL(6,2),
  accuracy DECIMAL(8,2),
  altitude DECIMAL(8,2),

  is_moving BOOLEAN DEFAULT FALSE,

  recorded_at TIMESTAMPTZ DEFAULT NOW(),

  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_driver_locations_driver ON public.driver_locations(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_locations_recorded ON public.driver_locations(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_driver_locations_geography ON public.driver_locations USING GIST(location);

-- =====================================================
-- TABLE: driver_earnings
-- =====================================================
CREATE TABLE IF NOT EXISTS public.driver_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,

  booking_id UUID NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('ride', 'food', 'package', 'other')),

  total_fare DECIMAL(10,2) NOT NULL,
  platform_commission DECIMAL(10,2) NOT NULL,
  driver_earning DECIMAL(10,2) NOT NULL,

  commission_percentage DECIMAL(5,2),
  commission_calculation JSONB,

  bonus_amount DECIMAL(10,2) DEFAULT 0,
  bonus_reason TEXT,
  deduction_amount DECIMAL(10,2) DEFAULT 0,
  deduction_reason TEXT,

  net_earning DECIMAL(10,2) NOT NULL,

  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN (
    'pending', 'approved', 'paid', 'held', 'disputed'
  )),

  payout_id UUID,
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  payment_reference TEXT,

  earned_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_earnings_driver ON public.driver_earnings(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_earnings_status ON public.driver_earnings(payment_status);
CREATE INDEX IF NOT EXISTS idx_driver_earnings_date ON public.driver_earnings(earned_at DESC);
CREATE INDEX IF NOT EXISTS idx_driver_earnings_booking ON public.driver_earnings(booking_id);

-- =====================================================
-- TABLE: driver_payouts
-- =====================================================
CREATE TABLE IF NOT EXISTS public.driver_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,

  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  total_earnings DECIMAL(12,2) NOT NULL,
  total_deductions DECIMAL(12,2) DEFAULT 0,
  total_bonuses DECIMAL(12,2) DEFAULT 0,
  net_payout DECIMAL(12,2) NOT NULL,

  total_rides INTEGER DEFAULT 0,

  payment_method TEXT NOT NULL CHECK (payment_method IN (
    'bank_transfer', 'mobile_money', 'cash', 'check'
  )),
  payment_provider TEXT,
  payment_reference TEXT,

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'completed', 'failed', 'cancelled'
  )),

  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ,

  completed_at TIMESTAMPTZ,
  failure_reason TEXT,

  metadata JSONB,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_payouts_driver ON public.driver_payouts(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_payouts_status ON public.driver_payouts(status);
CREATE INDEX IF NOT EXISTS idx_driver_payouts_period ON public.driver_payouts(period_start, period_end);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_payouts ENABLE ROW LEVEL SECURITY;

-- Drivers
DROP POLICY IF EXISTS "Drivers can view their own profile" ON public.drivers;
CREATE POLICY "Drivers can view their own profile"
  ON public.drivers FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Drivers can update their own profile" ON public.drivers;
CREATE POLICY "Drivers can update their own profile"
  ON public.drivers FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can create a driver profile" ON public.drivers;
CREATE POLICY "Anyone can create a driver profile"
  ON public.drivers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can view approved active drivers" ON public.drivers;
CREATE POLICY "Public can view approved active drivers"
  ON public.drivers FOR SELECT
  USING (application_status = 'approved' AND is_active = true);

-- Driver Vehicles
DROP POLICY IF EXISTS "Drivers can manage their own vehicles" ON public.driver_vehicles;
CREATE POLICY "Drivers can manage their own vehicles"
  ON public.driver_vehicles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.drivers
      WHERE id = driver_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Public can view active verified vehicles" ON public.driver_vehicles;
CREATE POLICY "Public can view active verified vehicles"
  ON public.driver_vehicles FOR SELECT
  USING (verification_status = 'approved' AND is_active = true);

-- Driver Documents
DROP POLICY IF EXISTS "Drivers can manage their own documents" ON public.driver_documents;
CREATE POLICY "Drivers can manage their own documents"
  ON public.driver_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.drivers
      WHERE id = driver_id AND user_id = auth.uid()
    )
  );

-- Driver Applications
DROP POLICY IF EXISTS "Drivers can manage their own applications" ON public.driver_applications;
CREATE POLICY "Drivers can manage their own applications"
  ON public.driver_applications FOR ALL
  USING (auth.uid() = user_id);

-- Driver Availability
DROP POLICY IF EXISTS "Drivers can manage their own availability" ON public.driver_availability;
CREATE POLICY "Drivers can manage their own availability"
  ON public.driver_availability FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.drivers
      WHERE id = driver_id AND user_id = auth.uid()
    )
  );

-- Driver Locations
DROP POLICY IF EXISTS "Drivers can update their own location" ON public.driver_locations;
CREATE POLICY "Drivers can update their own location"
  ON public.driver_locations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.drivers
      WHERE id = driver_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Active riders can view nearby driver locations" ON public.driver_locations;
CREATE POLICY "Active riders can view nearby driver locations"
  ON public.driver_locations FOR SELECT
  USING (true);

-- Driver Earnings
DROP POLICY IF EXISTS "Drivers can view their own earnings" ON public.driver_earnings;
CREATE POLICY "Drivers can view their own earnings"
  ON public.driver_earnings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.drivers
      WHERE id = driver_id AND user_id = auth.uid()
    )
  );

-- Driver Payouts
DROP POLICY IF EXISTS "Drivers can view their own payouts" ON public.driver_payouts;
CREATE POLICY "Drivers can view their own payouts"
  ON public.driver_payouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.drivers
      WHERE id = driver_id AND user_id = auth.uid()
    )
  );

-- =====================================================
-- TRIGGERS
-- =====================================================
DROP TRIGGER IF EXISTS update_drivers_updated_at ON public.drivers;
CREATE TRIGGER update_drivers_updated_at
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_driver_vehicles_updated_at ON public.driver_vehicles;
CREATE TRIGGER update_driver_vehicles_updated_at
  BEFORE UPDATE ON public.driver_vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_driver_documents_updated_at ON public.driver_documents;
CREATE TRIGGER update_driver_documents_updated_at
  BEFORE UPDATE ON public.driver_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_driver_applications_updated_at ON public.driver_applications;
CREATE TRIGGER update_driver_applications_updated_at
  BEFORE UPDATE ON public.driver_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_driver_availability_updated_at ON public.driver_availability;
CREATE TRIGGER update_driver_availability_updated_at
  BEFORE UPDATE ON public.driver_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_driver_payouts_updated_at ON public.driver_payouts;
CREATE TRIGGER update_driver_payouts_updated_at
  BEFORE UPDATE ON public.driver_payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTIONS
-- =====================================================
CREATE OR REPLACE FUNCTION update_driver_stats_after_ride()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.drivers
  SET
    total_rides = total_rides + 1,
    completed_rides = CASE WHEN NEW.status = 'completed' THEN completed_rides + 1 ELSE completed_rides END,
    cancelled_rides = CASE WHEN NEW.status = 'cancelled' THEN cancelled_rides + 1 ELSE cancelled_rides END,
    updated_at = NOW()
  WHERE id = NEW.driver_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION find_nearby_drivers(
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_radius_meters INTEGER DEFAULT 5000,
  p_vehicle_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  driver_id UUID,
  distance_meters DOUBLE PRECISION,
  driver_name TEXT,
  vehicle_type TEXT,
  rating DECIMAL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    ST_Distance(
      dl.location,
      ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
    ) as distance,
    CONCAT(d.first_name, ' ', d.last_name) as name,
    dv.vehicle_type,
    d.average_rating,
    dl.latitude,
    dl.longitude
  FROM public.drivers d
  INNER JOIN public.driver_vehicles dv ON dv.driver_id = d.id AND dv.is_primary = true
  INNER JOIN LATERAL (
    SELECT * FROM public.driver_locations
    WHERE driver_id = d.id
    ORDER BY recorded_at DESC
    LIMIT 1
  ) dl ON true
  WHERE d.is_online = true
    AND d.is_available = true
    AND d.application_status = 'approved'
    AND dv.is_active = true
    AND dv.verification_status = 'approved'
    AND (p_vehicle_type IS NULL OR dv.vehicle_type = p_vehicle_type)
    AND ST_DWithin(
      dl.location,
      ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
      p_radius_meters
    )
  ORDER BY distance
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- REALTIME SUBSCRIPTIONS
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_applications;

-- =====================================================
-- PERMISSIONS
-- =====================================================
GRANT SELECT, INSERT, UPDATE ON public.drivers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.driver_vehicles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.driver_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.driver_applications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.driver_availability TO authenticated;
GRANT SELECT, INSERT ON public.driver_locations TO authenticated;
GRANT SELECT ON public.driver_earnings TO authenticated;
GRANT SELECT ON public.driver_payouts TO authenticated;

-- =====================================================
-- SUCCESS
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ VanuWay Driver Onboarding System Complete!';
  RAISE NOTICE '   8 tables created';
  RAISE NOTICE '   Driver registration, vehicles, documents, GPS tracking, earnings';
END $$;
