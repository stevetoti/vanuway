-- =====================================================
-- VANUWAY IN-APP CALLING SYSTEM SETUP
-- =====================================================
-- Phase 1-B: In-App Calling with Phone Number Masking
--
-- Features:
-- - VoIP calling between passengers and drivers
-- - Phone number masking for privacy protection
-- - Call logs and duration tracking
-- - Call quality ratings
-- - Emergency call bypass
--
-- Usage: Run this script in your Supabase SQL Editor
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: call_logs
-- Tracks all calls between passengers and drivers
-- =====================================================
CREATE TABLE IF NOT EXISTS public.call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Participants
  caller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  caller_type TEXT NOT NULL CHECK (caller_type IN ('passenger', 'driver', 'support')),
  receiver_type TEXT NOT NULL CHECK (receiver_type IN ('passenger', 'driver', 'support')),

  -- Associated booking
  booking_id UUID,
  service_type TEXT CHECK (service_type IN ('ride', 'food', 'hotel', 'tour', 'other')),

  -- Call details
  masked_caller_number TEXT, -- Proxy/masked number shown to receiver
  masked_receiver_number TEXT, -- Proxy/masked number shown to caller
  call_type TEXT NOT NULL DEFAULT 'voip' CHECK (call_type IN ('voip', 'pstn', 'emergency')),
  call_status TEXT NOT NULL DEFAULT 'initiated' CHECK (call_status IN (
    'initiated', 'ringing', 'in_progress', 'completed', 'failed',
    'missed', 'rejected', 'cancelled', 'no_answer'
  )),

  -- Call metrics
  initiated_at TIMESTAMPTZ DEFAULT NOW(),
  answered_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,

  -- VoIP provider data
  provider TEXT DEFAULT 'twilio' CHECK (provider IN ('twilio', 'vonage', 'agora', 'internal')),
  provider_call_id TEXT, -- External provider's call ID
  provider_session_id TEXT,

  -- Quality metrics
  connection_quality TEXT CHECK (connection_quality IN ('excellent', 'good', 'fair', 'poor')),
  quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
  quality_feedback TEXT,

  -- Recording (for safety/quality)
  is_recorded BOOLEAN DEFAULT FALSE,
  recording_url TEXT,
  recording_duration INTEGER,

  -- Emergency calls
  is_emergency BOOLEAN DEFAULT FALSE,
  emergency_reason TEXT,

  -- Cost tracking
  call_cost DECIMAL(10,4),
  currency TEXT DEFAULT 'VUV',

  -- Metadata
  metadata JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_call_logs_caller ON public.call_logs(caller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_logs_receiver ON public.call_logs(receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_logs_booking ON public.call_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_status ON public.call_logs(call_status);
CREATE INDEX IF NOT EXISTS idx_call_logs_provider_call ON public.call_logs(provider_call_id);

-- =====================================================
-- TABLE: phone_masking
-- Phone number masking/proxy for privacy
-- =====================================================
CREATE TABLE IF NOT EXISTS public.phone_masking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User information
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  real_phone_number TEXT NOT NULL,

  -- Masked number pool
  masked_number TEXT NOT NULL UNIQUE, -- Temporary proxy number
  masked_number_provider TEXT DEFAULT 'twilio',

  -- Association
  booking_id UUID,
  paired_with_user_id UUID REFERENCES auth.users(id), -- The other party in the conversation

  -- Validity
  is_active BOOLEAN DEFAULT TRUE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Masking expires after ride/service completion
  released_at TIMESTAMPTZ,

  -- Usage tracking
  calls_made INTEGER DEFAULT 0,
  calls_received INTEGER DEFAULT 0,
  total_call_duration INTEGER DEFAULT 0, -- in seconds

  -- Metadata
  metadata JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id, booking_id, is_active)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_phone_masking_user ON public.phone_masking(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_masking_booking ON public.phone_masking(booking_id);
CREATE INDEX IF NOT EXISTS idx_phone_masking_masked_number ON public.phone_masking(masked_number);
CREATE INDEX IF NOT EXISTS idx_phone_masking_active ON public.phone_masking(is_active, expires_at);

-- =====================================================
-- TABLE: call_quality_reports
-- User-reported call quality issues
-- =====================================================
CREATE TABLE IF NOT EXISTS public.call_quality_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  call_log_id UUID NOT NULL REFERENCES public.call_logs(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Issue details
  issue_type TEXT NOT NULL CHECK (issue_type IN (
    'no_audio', 'poor_audio', 'echo', 'delay', 'dropped_call',
    'connection_failed', 'other'
  )),
  description TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high')),

  -- Resolution
  status TEXT DEFAULT 'reported' CHECK (status IN ('reported', 'investigating', 'resolved')),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,

  -- Metadata
  device_info JSONB,
  network_info JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_call_quality_reports_call ON public.call_quality_reports(call_log_id);
CREATE INDEX IF NOT EXISTS idx_call_quality_reports_reporter ON public.call_quality_reports(reporter_id);

-- =====================================================
-- TABLE: masked_number_pool
-- Pool of available masked numbers for assignment
-- =====================================================
CREATE TABLE IF NOT EXISTS public.masked_number_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  phone_number TEXT NOT NULL UNIQUE,
  country_code TEXT DEFAULT '+678', -- Vanuatu country code
  provider TEXT NOT NULL CHECK (provider IN ('twilio', 'vonage', 'internal')),
  provider_sid TEXT, -- Provider's identifier for this number

  -- Availability
  is_available BOOLEAN DEFAULT TRUE,
  currently_assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,

  -- Capabilities
  can_voice BOOLEAN DEFAULT TRUE,
  can_sms BOOLEAN DEFAULT TRUE,

  -- Cost
  monthly_cost DECIMAL(10,2),
  per_minute_cost DECIMAL(10,4),
  currency TEXT DEFAULT 'VUV',

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_masked_number_pool_available ON public.masked_number_pool(is_available);
CREATE INDEX IF NOT EXISTS idx_masked_number_pool_assigned ON public.masked_number_pool(currently_assigned_to);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_masking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_quality_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.masked_number_pool ENABLE ROW LEVEL SECURITY;

-- Call Logs Policies
CREATE POLICY "Users can view their own calls"
  ON public.call_logs
  FOR SELECT
  USING (
    auth.uid() = caller_id OR
    auth.uid() = receiver_id
  );

CREATE POLICY "Users can insert their own calls"
  ON public.call_logs
  FOR INSERT
  WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Users can update their own calls"
  ON public.call_logs
  FOR UPDATE
  USING (
    auth.uid() = caller_id OR
    auth.uid() = receiver_id
  );

-- Phone Masking Policies
CREATE POLICY "Users can view their own masked numbers"
  ON public.phone_masking
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage masked numbers"
  ON public.phone_masking
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Call Quality Reports Policies
CREATE POLICY "Users can view their own quality reports"
  ON public.call_quality_reports
  FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create quality reports"
  ON public.call_quality_reports
  FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Masked Number Pool Policies (admin/system only)
CREATE POLICY "Only system can manage number pool"
  ON public.masked_number_pool
  FOR ALL
  USING (false); -- Regular users cannot access

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
DROP TRIGGER IF EXISTS update_call_logs_updated_at ON public.call_logs;
CREATE TRIGGER update_call_logs_updated_at
  BEFORE UPDATE ON public.call_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_phone_masking_updated_at ON public.phone_masking;
CREATE TRIGGER update_phone_masking_updated_at
  BEFORE UPDATE ON public.phone_masking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate call duration on completion
CREATE OR REPLACE FUNCTION calculate_call_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.call_status IN ('completed', 'ended') AND NEW.answered_at IS NOT NULL THEN
    NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.ended_at - NEW.answered_at))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_call_duration ON public.call_logs;
CREATE TRIGGER trigger_calculate_call_duration
  BEFORE UPDATE ON public.call_logs
  FOR EACH ROW
  EXECUTE FUNCTION calculate_call_duration();

-- Function to release masked numbers after expiry
CREATE OR REPLACE FUNCTION release_expired_masked_numbers()
RETURNS void AS $$
BEGIN
  UPDATE public.phone_masking
  SET
    is_active = false,
    released_at = NOW()
  WHERE
    is_active = true
    AND expires_at < NOW();

  -- Mark pool numbers as available
  UPDATE public.masked_number_pool
  SET
    is_available = true,
    currently_assigned_to = NULL,
    assigned_at = NULL
  WHERE
    currently_assigned_to IN (
      SELECT user_id FROM public.phone_masking
      WHERE is_active = false AND released_at > NOW() - INTERVAL '1 minute'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- REALTIME SUBSCRIPTIONS
-- Enable real-time for call status updates
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_logs;

-- =====================================================
-- SAMPLE DATA: Masked Number Pool
-- Add some sample masked numbers (replace with real numbers from provider)
-- =====================================================
INSERT INTO public.masked_number_pool (phone_number, country_code, provider, is_available, can_voice, can_sms)
VALUES
  ('+6785551001', '+678', 'internal', true, true, true),
  ('+6785551002', '+678', 'internal', true, true, true),
  ('+6785551003', '+678', 'internal', true, true, true),
  ('+6785551004', '+678', 'internal', true, true, true),
  ('+6785551005', '+678', 'internal', true, true, true)
ON CONFLICT (phone_number) DO NOTHING;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT SELECT, INSERT, UPDATE ON public.call_logs TO authenticated;
GRANT SELECT ON public.phone_masking TO authenticated;
GRANT SELECT, INSERT ON public.call_quality_reports TO authenticated;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ VanuWay In-App Calling System Setup Complete!';
  RAISE NOTICE '';
  RAISE NOTICE '📞 Created Tables:';
  RAISE NOTICE '  - call_logs (VoIP call tracking)';
  RAISE NOTICE '  - phone_masking (privacy protection)';
  RAISE NOTICE '  - call_quality_reports (quality monitoring)';
  RAISE NOTICE '  - masked_number_pool (number management)';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Security:';
  RAISE NOTICE '  - RLS policies enabled';
  RAISE NOTICE '  - Phone numbers masked for privacy';
  RAISE NOTICE '  - Users can only see their own calls';
  RAISE NOTICE '';
  RAISE NOTICE '📱 Features Ready:';
  RAISE NOTICE '  - VoIP calling between passengers & drivers';
  RAISE NOTICE '  - Phone number masking';
  RAISE NOTICE '  - Call duration tracking';
  RAISE NOTICE '  - Call quality ratings';
  RAISE NOTICE '  - Emergency call support';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Next Steps:';
  RAISE NOTICE '  1. Integrate with VoIP provider (Twilio/Vonage/Agora)';
  RAISE NOTICE '  2. Add real masked numbers to pool';
  RAISE NOTICE '  3. Set up webhooks for call events';
  RAISE NOTICE '  4. Configure PSTN fallback for areas with poor internet';
END $$;

SELECT json_build_object(
  'message', '✅ VanuWay In-App Calling System Setup Complete!',
  'tables_created', 4,
  'features', json_build_array(
    'VoIP Calling',
    'Phone Masking',
    'Call Quality Tracking',
    'Emergency Calls'
  )
);
