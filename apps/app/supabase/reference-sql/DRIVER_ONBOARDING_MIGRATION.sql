-- =====================================================
-- VANUWAY DRIVER ONBOARDING - MIGRATION SCRIPT
-- =====================================================
-- This script preserves existing driver data
-- and adds comprehensive onboarding features
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =====================================================
-- STEP 1: Add new columns to existing drivers table
-- =====================================================

-- Personal Information
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say'));

-- Contact Info
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;

-- Address
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS address_line1 TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS address_line2 TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS province TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Vanuatu';

-- ID Documents
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS national_id TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS passport_number TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS tax_id TEXT;

-- License (already has license_number, license_expiry)
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS license_type TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS license_issue_date DATE;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS license_verified BOOLEAN DEFAULT FALSE;

-- Banking
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS bank_account_number TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS bank_account_name TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS mobile_money_provider TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS mobile_money_number TEXT;

-- Profile
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS languages TEXT[];

-- Status fields (renaming from old 'status' to new system)
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS application_status TEXT DEFAULT 'approved' CHECK (application_status IN (
  'draft', 'pending', 'under_review', 'approved', 'rejected', 'suspended', 'deactivated'
));
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'verified' CHECK (verification_status IN (
  'unverified', 'partially_verified', 'verified'
));

ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Availability (keep old 'status' for compatibility, add new fields)
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT FALSE;

-- Background check
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS background_check_status TEXT DEFAULT 'pending' CHECK (background_check_status IN (
  'pending', 'in_progress', 'passed', 'failed', 'expired'
));
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS background_check_date DATE;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS background_check_expiry DATE;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS background_check_provider TEXT;

-- Stats (already has total_rides, rating/average_rating)
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS completed_rides INTEGER DEFAULT 0;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS cancelled_rides INTEGER DEFAULT 0;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS acceptance_rate DECIMAL(5,2) DEFAULT 0;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS cancellation_rate DECIMAL(5,2) DEFAULT 0;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;

-- Earnings (already has total_earnings)
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS pending_earnings DECIMAL(12,2) DEFAULT 0;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS paid_earnings DECIMAL(12,2) DEFAULT 0;

-- Training
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS safety_training_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS safety_training_date DATE;

-- Preferences
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS preferred_service_types TEXT[];
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS preferred_areas TEXT[];

-- Metadata
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS notes TEXT;

-- Migrate old 'rating' to 'average_rating' if needed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'rating') THEN
    UPDATE public.drivers SET average_rating = rating WHERE average_rating IS NULL OR average_rating = 0;
  END IF;
END $$;

-- Sync old 'is_verified' with new status fields
UPDATE public.drivers
SET
  application_status = CASE WHEN is_verified THEN 'approved' ELSE 'pending' END,
  verification_status = CASE WHEN is_verified THEN 'verified' ELSE 'unverified' END,
  is_active = TRUE
WHERE application_status IS NULL OR verification_status IS NULL;

-- =====================================================
-- STEP 2: Create new supporting tables
-- =====================================================

-- TABLE: driver_vehicles
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
  verification_status TEXT DEFAULT 'approved' CHECK (verification_status IN (
    'pending', 'approved', 'rejected'
  )),

  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,

  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrate existing vehicle data from drivers table
INSERT INTO public.driver_vehicles (driver_id, vehicle_type, model, color, license_plate, is_primary, is_active, verification_status, make, year)
SELECT
  id,
  vehicle_type,
  COALESCE(vehicle_model, 'Unknown'),
  vehicle_color,
  license_plate,
  TRUE,
  TRUE,
  'approved',
  'Unknown',
  EXTRACT(YEAR FROM created_at)::INTEGER
FROM public.drivers
WHERE NOT EXISTS (
  SELECT 1 FROM public.driver_vehicles WHERE driver_id = drivers.id
)
ON CONFLICT (license_plate) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_driver_vehicles_driver ON public.driver_vehicles(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_vehicles_type ON public.driver_vehicles(vehicle_type, is_active);
CREATE INDEX IF NOT EXISTS idx_driver_vehicles_primary ON public.driver_vehicles(driver_id, is_primary);

-- TABLE: driver_documents
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

-- TABLE: driver_applications
CREATE TABLE IF NOT EXISTS public.driver_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  step_personal_info BOOLEAN DEFAULT FALSE,
  step_license BOOLEAN DEFAULT FALSE,
  step_vehicle BOOLEAN DEFAULT FALSE,
  step_documents BOOLEAN DEFAULT FALSE,
  step_background_check BOOLEAN DEFAULT FALSE,

  current_step INTEGER DEFAULT 5,
  total_steps INTEGER DEFAULT 5,

  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN (
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

-- TABLE: driver_availability
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

-- TABLE: driver_locations
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

-- TABLE: driver_earnings
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

-- TABLE: driver_payouts
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
-- STEP 3: Update RLS Policies
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE public.driver_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_payouts ENABLE ROW LEVEL SECURITY;

-- Update driver policies to use new status fields
DROP POLICY IF EXISTS "Users can view active drivers" ON public.drivers;
CREATE POLICY "Users can view active drivers"
  ON public.drivers FOR SELECT
  USING (application_status = 'approved' AND is_active = true);

-- Driver Vehicles
CREATE POLICY "Drivers can manage their own vehicles"
  ON public.driver_vehicles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.drivers
      WHERE id = driver_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view active verified vehicles"
  ON public.driver_vehicles FOR SELECT
  USING (verification_status = 'approved' AND is_active = true);

-- Driver Documents
CREATE POLICY "Drivers can manage their own documents"
  ON public.driver_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.drivers
      WHERE id = driver_id AND user_id = auth.uid()
    )
  );

-- Driver Applications
CREATE POLICY "Drivers can manage their own applications"
  ON public.driver_applications FOR ALL
  USING (auth.uid() = user_id);

-- Driver Availability
CREATE POLICY "Drivers can manage their own availability"
  ON public.driver_availability FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.drivers
      WHERE id = driver_id AND user_id = auth.uid()
    )
  );

-- Driver Locations
CREATE POLICY "Drivers can update their own location"
  ON public.driver_locations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.drivers
      WHERE id = driver_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Active riders can view nearby driver locations"
  ON public.driver_locations FOR SELECT
  USING (true);

-- Driver Earnings
CREATE POLICY "Drivers can view their own earnings"
  ON public.driver_earnings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.drivers
      WHERE id = driver_id AND user_id = auth.uid()
    )
  );

-- Driver Payouts
CREATE POLICY "Drivers can view their own payouts"
  ON public.driver_payouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.drivers
      WHERE id = driver_id AND user_id = auth.uid()
    )
  );

-- =====================================================
-- STEP 4: Add triggers
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
-- STEP 5: Add helper functions
-- =====================================================

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
    CONCAT(COALESCE(d.first_name, ''), ' ', COALESCE(d.last_name, '')) as name,
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
-- STEP 6: Enable realtime
-- =====================================================

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_applications;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- STEP 7: Grant permissions
-- =====================================================

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
  RAISE NOTICE '✅ VanuWay Driver Onboarding Migration Complete!';
  RAISE NOTICE '   Existing drivers preserved';
  RAISE NOTICE '   7 new tables added for comprehensive driver management';
  RAISE NOTICE '   Vehicles migrated to separate table';
END $$;
