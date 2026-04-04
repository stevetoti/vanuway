-- =====================================================
-- VANUWAY ACCESSIBILITY OPTIONS SYSTEM SETUP
-- =====================================================
-- Phase 1-E: Accessibility Options
--
-- Features:
-- - Wheelchair-accessible vehicles
-- - Service animal support
-- - Audio/visual assistance
-- - Accessibility profiles
-- - Special assistance requests
-- - Driver accessibility training tracking
--
-- Usage: Run this script in your Supabase SQL Editor
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: accessibility_profiles
-- User accessibility needs and preferences
-- =====================================================
CREATE TABLE IF NOT EXISTS public.accessibility_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Mobility assistance
  requires_wheelchair BOOLEAN DEFAULT FALSE,
  wheelchair_type TEXT CHECK (wheelchair_type IN ('manual', 'electric', 'scooter')),
  requires_walker BOOLEAN DEFAULT FALSE,
  requires_crutches BOOLEAN DEFAULT FALSE,
  can_transfer_independently BOOLEAN DEFAULT TRUE,

  -- Service animals
  has_service_animal BOOLEAN DEFAULT FALSE,
  service_animal_type TEXT, -- guide dog, hearing dog, psychiatric, etc.
  service_animal_certified BOOLEAN DEFAULT FALSE,

  -- Sensory assistance
  requires_visual_assistance BOOLEAN DEFAULT FALSE,
  is_blind BOOLEAN DEFAULT FALSE,
  is_low_vision BOOLEAN DEFAULT FALSE,
  requires_audio_assistance BOOLEAN DEFAULT FALSE,
  is_deaf BOOLEAN DEFAULT FALSE,
  is_hard_of_hearing BOOLEAN DEFAULT FALSE,
  preferred_communication TEXT CHECK (preferred_communication IN (
    'voice', 'text', 'sign_language', 'lip_reading', 'visual_cues'
  )),

  -- Cognitive/developmental
  requires_cognitive_support BOOLEAN DEFAULT FALSE,
  needs_simple_instructions BOOLEAN DEFAULT FALSE,

  -- Physical assistance
  requires_physical_assistance BOOLEAN DEFAULT FALSE,
  assistance_description TEXT,

  -- Preferences
  preferred_vehicle_features TEXT[], -- ramp, lift, extra_space, etc.
  avoid_features TEXT[], -- stairs, narrow_doors, etc.

  -- Emergency contacts for special assistance
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,

  -- Notes for drivers
  driver_notes TEXT,

  -- Auto-apply to bookings
  auto_apply_to_rides BOOLEAN DEFAULT TRUE,

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_accessibility_profiles_user ON public.accessibility_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_accessibility_profiles_wheelchair ON public.accessibility_profiles(requires_wheelchair);

-- =====================================================
-- TABLE: vehicle_accessibility_features
-- Accessibility features available in vehicles
-- =====================================================
CREATE TABLE IF NOT EXISTS public.vehicle_accessibility_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  vehicle_id UUID NOT NULL, -- References vehicles table (to be created)
  driver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Wheelchair accessibility
  wheelchair_accessible BOOLEAN DEFAULT FALSE,
  has_ramp BOOLEAN DEFAULT FALSE,
  has_lift BOOLEAN DEFAULT FALSE,
  wheelchair_capacity INTEGER DEFAULT 0, -- How many wheelchairs
  has_wheelchair_restraints BOOLEAN DEFAULT FALSE,

  -- Space and entry
  has_wide_doors BOOLEAN DEFAULT FALSE,
  has_low_floor BOOLEAN DEFAULT FALSE,
  extra_legroom BOOLEAN DEFAULT FALSE,
  spacious_interior BOOLEAN DEFAULT FALSE,

  -- Assistance features
  has_grab_bars BOOLEAN DEFAULT FALSE,
  has_swivel_seat BOOLEAN DEFAULT FALSE,
  has_step_stool BOOLEAN DEFAULT FALSE,

  -- Service animal accommodation
  service_animal_friendly BOOLEAN DEFAULT TRUE,
  has_pet_restraints BOOLEAN DEFAULT FALSE,

  -- Sensory features
  has_audio_announcements BOOLEAN DEFAULT FALSE,
  has_visual_alerts BOOLEAN DEFAULT FALSE,
  has_braille_signage BOOLEAN DEFAULT FALSE,

  -- Child/special needs
  has_child_seat BOOLEAN DEFAULT FALSE,
  has_booster_seat BOOLEAN DEFAULT FALSE,
  child_seat_type TEXT[],

  -- Documentation
  accessibility_certification TEXT[], -- URLs to certificates
  inspection_date DATE,
  inspection_valid_until DATE,

  -- Availability
  is_active BOOLEAN DEFAULT TRUE,

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_accessibility_driver ON public.vehicle_accessibility_features(driver_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_accessibility_wheelchair ON public.vehicle_accessibility_features(wheelchair_accessible, is_active);

-- =====================================================
-- TABLE: driver_accessibility_training
-- Track driver training for accessibility assistance
-- =====================================================
CREATE TABLE IF NOT EXISTS public.driver_accessibility_training (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Training types completed
  wheelchair_assistance_certified BOOLEAN DEFAULT FALSE,
  wheelchair_cert_date DATE,
  wheelchair_cert_expiry DATE,

  service_animal_trained BOOLEAN DEFAULT FALSE,
  service_animal_training_date DATE,

  visual_impairment_trained BOOLEAN DEFAULT FALSE,
  visual_training_date DATE,

  hearing_impairment_trained BOOLEAN DEFAULT FALSE,
  hearing_training_date DATE,

  cognitive_support_trained BOOLEAN DEFAULT FALSE,
  cognitive_training_date DATE,

  -- General accessibility training
  general_accessibility_certified BOOLEAN DEFAULT FALSE,
  general_cert_date DATE,
  general_cert_expiry DATE,

  -- CPR/First Aid
  cpr_certified BOOLEAN DEFAULT FALSE,
  cpr_cert_date DATE,
  cpr_cert_expiry DATE,

  -- Certificates
  training_certificates TEXT[], -- URLs to certificates

  -- Experience
  accessibility_rides_completed INTEGER DEFAULT 0,
  accessibility_rating DECIMAL(3,2), -- Average rating for accessibility support

  -- Willingness
  accepts_wheelchair_requests BOOLEAN DEFAULT TRUE,
  accepts_service_animal_requests BOOLEAN DEFAULT TRUE,
  accepts_special_assistance_requests BOOLEAN DEFAULT TRUE,

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_driver_accessibility_training_driver ON public.driver_accessibility_training(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_accessibility_certified ON public.driver_accessibility_training(wheelchair_assistance_certified, general_accessibility_certified);

-- =====================================================
-- TABLE: accessibility_ride_requests
-- Special accessibility requests for specific rides
-- =====================================================
CREATE TABLE IF NOT EXISTS public.accessibility_ride_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  ride_booking_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Request details
  requires_wheelchair_vehicle BOOLEAN DEFAULT FALSE,
  requires_service_animal_space BOOLEAN DEFAULT FALSE,
  requires_visual_assistance BOOLEAN DEFAULT FALSE,
  requires_audio_assistance BOOLEAN DEFAULT FALSE,
  requires_physical_assistance BOOLEAN DEFAULT FALSE,
  requires_cognitive_support BOOLEAN DEFAULT FALSE,

  -- Specific needs
  assistance_description TEXT,
  special_instructions TEXT,

  -- Match requirements
  requires_certified_driver BOOLEAN DEFAULT FALSE,
  requires_trained_driver BOOLEAN DEFAULT FALSE,

  -- Status
  matched_driver_id UUID REFERENCES auth.users(id),
  driver_confirmed BOOLEAN DEFAULT FALSE,
  driver_confirmed_at TIMESTAMPTZ,

  -- Feedback
  needs_met BOOLEAN,
  assistance_rating INTEGER CHECK (assistance_rating BETWEEN 1 AND 5),
  feedback TEXT,

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_accessibility_ride_requests_booking ON public.accessibility_ride_requests(ride_booking_id);
CREATE INDEX IF NOT EXISTS idx_accessibility_ride_requests_user ON public.accessibility_ride_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_accessibility_ride_requests_driver ON public.accessibility_ride_requests(matched_driver_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.accessibility_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_accessibility_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_accessibility_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessibility_ride_requests ENABLE ROW LEVEL SECURITY;

-- Accessibility Profiles
CREATE POLICY "Users can manage their own accessibility profile"
  ON public.accessibility_profiles
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Vehicle Accessibility Features (drivers can manage their own)
CREATE POLICY "Drivers can manage their vehicle accessibility features"
  ON public.vehicle_accessibility_features
  FOR ALL
  USING (auth.uid() = driver_id)
  WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Anyone can view active accessibility vehicles"
  ON public.vehicle_accessibility_features
  FOR SELECT
  USING (is_active = true);

-- Driver Accessibility Training (drivers can manage their own)
CREATE POLICY "Drivers can manage their own training records"
  ON public.driver_accessibility_training
  FOR ALL
  USING (auth.uid() = driver_id)
  WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Anyone can view driver training status"
  ON public.driver_accessibility_training
  FOR SELECT
  USING (true);

-- Accessibility Ride Requests
CREATE POLICY "Users can manage their own accessibility requests"
  ON public.accessibility_ride_requests
  FOR ALL
  USING (
    auth.uid() = user_id OR
    auth.uid() = matched_driver_id
  )
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to auto-update updated_at timestamp
DROP TRIGGER IF EXISTS update_accessibility_profiles_updated_at ON public.accessibility_profiles;
CREATE TRIGGER update_accessibility_profiles_updated_at
  BEFORE UPDATE ON public.accessibility_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicle_accessibility_features_updated_at ON public.vehicle_accessibility_features;
CREATE TRIGGER update_vehicle_accessibility_features_updated_at
  BEFORE UPDATE ON public.vehicle_accessibility_features
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_driver_accessibility_training_updated_at ON public.driver_accessibility_training;
CREATE TRIGGER update_driver_accessibility_training_updated_at
  BEFORE UPDATE ON public.driver_accessibility_training
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- REALTIME SUBSCRIPTIONS
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.accessibility_ride_requests;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accessibility_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_accessibility_features TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.driver_accessibility_training TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accessibility_ride_requests TO authenticated;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ VanuWay Accessibility Options System Setup Complete!';
  RAISE NOTICE '';
  RAISE NOTICE '♿ Created Tables:';
  RAISE NOTICE '  - accessibility_profiles (user needs)';
  RAISE NOTICE '  - vehicle_accessibility_features (vehicle capabilities)';
  RAISE NOTICE '  - driver_accessibility_training (driver certifications)';
  RAISE NOTICE '  - accessibility_ride_requests (ride-specific requests)';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Security:';
  RAISE NOTICE '  - RLS policies enabled';
  RAISE NOTICE '  - Users manage their own profiles';
  RAISE NOTICE '  - Drivers manage their own vehicles/training';
  RAISE NOTICE '';
  RAISE NOTICE '📱 Features Ready:';
  RAISE NOTICE '  - Wheelchair-accessible vehicle filtering';
  RAISE NOTICE '  - Service animal support';
  RAISE NOTICE '  - Visual/audio assistance';
  RAISE NOTICE '  - Driver accessibility training tracking';
  RAISE NOTICE '  - Special assistance requests';
  RAISE NOTICE '  - Accessibility feedback collection';
END $$;

SELECT json_build_object(
  'message', '✅ VanuWay Accessibility Options System Setup Complete!',
  'tables_created', 4,
  'features', json_build_array(
    'Wheelchair Accessibility',
    'Service Animals',
    'Visual/Audio Assistance',
    'Driver Training'
  )
);
