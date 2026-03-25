-- ============================================
-- SAFETY FEATURES SETUP
-- Emergency SOS, Trip Sharing, Verification PIN, Safety Check-ins
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. CREATE EMERGENCY_CONTACTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Contact details
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  relationship TEXT, -- 'spouse', 'parent', 'friend', 'other'
  email TEXT,

  -- Priority
  is_primary BOOLEAN DEFAULT FALSE,
  priority_order INTEGER DEFAULT 1,

  -- Status
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. CREATE TRIP_SHARES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.trip_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Trip reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL, -- Reference to ride_bookings, food_orders, etc.
  service_type TEXT NOT NULL CHECK (service_type IN ('ride', 'food', 'hotel', 'tour', 'other')),

  -- Share details
  share_token TEXT NOT NULL UNIQUE,
  share_url TEXT NOT NULL,
  recipient_name TEXT,
  recipient_phone TEXT,
  recipient_email TEXT,

  -- Shared data
  shared_with_contacts BOOLEAN DEFAULT FALSE,
  auto_share BOOLEAN DEFAULT FALSE, -- Auto-share future trips

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  accessed_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. CREATE SAFETY_ALERTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.safety_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Alert reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID, -- Optional reference to booking
  service_type TEXT CHECK (service_type IN ('ride', 'food', 'hotel', 'tour', 'other')),

  -- Alert details
  alert_type TEXT NOT NULL CHECK (alert_type IN ('sos', 'route_deviation', 'unexpected_stop', 'speed_violation', 'check_in_failed', 'manual', 'other')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),

  -- Location
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  location_address TEXT,

  -- Alert content
  title TEXT NOT NULL,
  message TEXT,
  metadata JSONB,

  -- Response
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,

  -- Notifications sent
  emergency_services_notified BOOLEAN DEFAULT FALSE,
  contacts_notified BOOLEAN DEFAULT FALSE,
  admin_notified BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. CREATE RIDE_VERIFICATION_PINS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.ride_verification_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ride reference
  booking_id UUID NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,

  -- PIN details
  pin_code TEXT NOT NULL,
  pin_type TEXT DEFAULT 'pickup' CHECK (pin_type IN ('pickup', 'dropoff')),

  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  verification_attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,

  -- Expiry
  expires_at TIMESTAMPTZ NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. CREATE SAFETY_CHECK_INS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.safety_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Trip reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('ride', 'food', 'hotel', 'tour', 'other')),

  -- Check-in details
  check_in_type TEXT NOT NULL CHECK (check_in_type IN ('scheduled', 'route_deviation', 'unexpected_stop', 'manual')),
  expected_at TIMESTAMPTZ NOT NULL,

  -- Location
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  location_address TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'missed', 'cancelled')),
  completed_at TIMESTAMPTZ,
  response_message TEXT,

  -- Alert triggered
  alert_triggered BOOLEAN DEFAULT FALSE,
  alert_id UUID REFERENCES public.safety_alerts(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON public.emergency_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_primary ON public.emergency_contacts(user_id, is_primary) WHERE is_primary = TRUE;

CREATE INDEX IF NOT EXISTS idx_trip_shares_user_id ON public.trip_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_shares_booking_id ON public.trip_shares(booking_id);
CREATE INDEX IF NOT EXISTS idx_trip_shares_token ON public.trip_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_trip_shares_active ON public.trip_shares(is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_safety_alerts_user_id ON public.safety_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_alerts_booking_id ON public.safety_alerts(booking_id);
CREATE INDEX IF NOT EXISTS idx_safety_alerts_status ON public.safety_alerts(status);
CREATE INDEX IF NOT EXISTS idx_safety_alerts_severity ON public.safety_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_safety_alerts_created_at ON public.safety_alerts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_verification_pins_booking_id ON public.ride_verification_pins(booking_id);
CREATE INDEX IF NOT EXISTS idx_verification_pins_user_id ON public.ride_verification_pins(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_pins_driver_id ON public.ride_verification_pins(driver_id);

CREATE INDEX IF NOT EXISTS idx_safety_check_ins_user_id ON public.safety_check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_check_ins_booking_id ON public.safety_check_ins(booking_id);
CREATE INDEX IF NOT EXISTS idx_safety_check_ins_status ON public.safety_check_ins(status);
CREATE INDEX IF NOT EXISTS idx_safety_check_ins_expected_at ON public.safety_check_ins(expected_at);

-- ============================================
-- 7. SETUP ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_verification_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_check_ins ENABLE ROW LEVEL SECURITY;

-- Emergency Contacts Policies
DROP POLICY IF EXISTS "Users can manage own emergency contacts" ON public.emergency_contacts;
CREATE POLICY "Users can manage own emergency contacts"
  ON public.emergency_contacts FOR ALL
  USING (auth.uid() = user_id);

-- Trip Shares Policies
DROP POLICY IF EXISTS "Users can manage own trip shares" ON public.trip_shares;
DROP POLICY IF EXISTS "Public can view active trip shares" ON public.trip_shares;

CREATE POLICY "Users can manage own trip shares"
  ON public.trip_shares FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view active trip shares"
  ON public.trip_shares FOR SELECT
  USING (is_active = TRUE);

-- Safety Alerts Policies
DROP POLICY IF EXISTS "Users can view own safety alerts" ON public.safety_alerts;
DROP POLICY IF EXISTS "Users can create safety alerts" ON public.safety_alerts;
DROP POLICY IF EXISTS "Emergency contacts can view user alerts" ON public.safety_alerts;
DROP POLICY IF EXISTS "Admins can manage all alerts" ON public.safety_alerts;

CREATE POLICY "Users can view own safety alerts"
  ON public.safety_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create safety alerts"
  ON public.safety_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all alerts"
  ON public.safety_alerts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Verification PINs Policies
DROP POLICY IF EXISTS "Users can view own verification pins" ON public.ride_verification_pins;
DROP POLICY IF EXISTS "Drivers can view assigned ride pins" ON public.ride_verification_pins;

CREATE POLICY "Users can view own verification pins"
  ON public.ride_verification_pins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Drivers can view assigned ride pins"
  ON public.ride_verification_pins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.drivers
      WHERE user_id = auth.uid()
      AND id = driver_id
    )
  );

-- Safety Check-ins Policies
DROP POLICY IF EXISTS "Users can manage own check-ins" ON public.safety_check_ins;
CREATE POLICY "Users can manage own check-ins"
  ON public.safety_check_ins FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- 8. CREATE TRIGGERS
-- ============================================

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_safety_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_emergency_contacts_updated_at ON public.emergency_contacts;
CREATE TRIGGER set_emergency_contacts_updated_at
  BEFORE UPDATE ON public.emergency_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_safety_updated_at();

DROP TRIGGER IF EXISTS set_trip_shares_updated_at ON public.trip_shares;
CREATE TRIGGER set_trip_shares_updated_at
  BEFORE UPDATE ON public.trip_shares
  FOR EACH ROW
  EXECUTE FUNCTION update_safety_updated_at();

DROP TRIGGER IF EXISTS set_safety_alerts_updated_at ON public.safety_alerts;
CREATE TRIGGER set_safety_alerts_updated_at
  BEFORE UPDATE ON public.safety_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_safety_updated_at();

DROP TRIGGER IF EXISTS set_safety_check_ins_updated_at ON public.safety_check_ins;
CREATE TRIGGER set_safety_check_ins_updated_at
  BEFORE UPDATE ON public.safety_check_ins
  FOR EACH ROW
  EXECUTE FUNCTION update_safety_updated_at();

-- ============================================
-- 9. ENABLE REALTIME
-- ============================================

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.safety_alerts;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.safety_check_ins;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_shares;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 10. SUCCESS VERIFICATION
-- ============================================

SELECT 'SUCCESS: Emergency contacts table created' as status, COUNT(*) as count FROM public.emergency_contacts;
SELECT 'SUCCESS: Trip shares table created' as status, COUNT(*) as count FROM public.trip_shares;
SELECT 'SUCCESS: Safety alerts table created' as status, COUNT(*) as count FROM public.safety_alerts;
SELECT 'SUCCESS: Verification PINs table created' as status, COUNT(*) as count FROM public.ride_verification_pins;
SELECT 'SUCCESS: Safety check-ins table created' as status, COUNT(*) as count FROM public.safety_check_ins;

SELECT 'SUCCESS: Indexes created' as status, COUNT(*) as index_count
FROM pg_indexes
WHERE tablename IN ('emergency_contacts', 'trip_shares', 'safety_alerts', 'ride_verification_pins', 'safety_check_ins');

SELECT 'SUCCESS: RLS policies created' as status, COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('emergency_contacts', 'trip_shares', 'safety_alerts', 'ride_verification_pins', 'safety_check_ins');

SELECT '✅ Safety Features Setup Complete!' as message;
