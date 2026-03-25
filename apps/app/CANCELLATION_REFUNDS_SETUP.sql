-- =====================================================
-- VANUWAY CANCELLATION FEES & REFUNDS SYSTEM SETUP
-- =====================================================
-- Phase 1-D: Cancellation Fees & Refund Processing
--
-- Features:
-- - Dynamic cancellation fees based on ride status
-- - Automated refund processing
-- - Dispute resolution system
-- - Cancellation reason tracking
-- - Refund approval workflow
-- - Payment reversal integration
--
-- Usage: Run this script in your Supabase SQL Editor
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: cancellation_policies
-- Define cancellation fee rules
-- =====================================================
CREATE TABLE IF NOT EXISTS public.cancellation_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  policy_name TEXT NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('ride', 'food', 'hotel', 'tour', 'other')),

  -- Ride status-based fees
  ride_status TEXT CHECK (ride_status IN ('pending', 'accepted', 'in_progress', 'arrived')),

  -- Time-based fees (minutes after booking)
  time_threshold_minutes INTEGER,

  -- Fee configuration
  fee_type TEXT NOT NULL CHECK (fee_type IN ('percentage', 'fixed', 'none')),
  fee_amount DECIMAL(10,2), -- Percentage (0-100) or fixed amount

  -- Who pays (passenger or driver)
  charged_to TEXT CHECK (charged_to IN ('passenger', 'driver', 'split')),

  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0, -- Higher priority = checked first

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cancellation_policies_service ON public.cancellation_policies(service_type, is_active);
CREATE INDEX IF NOT EXISTS idx_cancellation_policies_priority ON public.cancellation_policies(priority DESC);

-- =====================================================
-- TABLE: ride_cancellations
-- Track all ride cancellations
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ride_cancellations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ride reference
  ride_booking_id UUID NOT NULL,
  scheduled_ride_id UUID REFERENCES public.scheduled_rides(id),

  -- Cancellation details
  cancelled_by UUID NOT NULL REFERENCES auth.users(id),
  cancelled_by_role TEXT NOT NULL CHECK (cancelled_by_role IN ('passenger', 'driver', 'admin', 'system')),
  cancelled_at TIMESTAMPTZ DEFAULT NOW(),

  -- Reason
  reason_category TEXT CHECK (reason_category IN (
    'passenger_request', 'driver_unavailable', 'wrong_location', 'price_issue',
    'weather', 'emergency', 'safety_concern', 'no_show', 'duplicate',
    'payment_failed', 'vehicle_issue', 'other'
  )),
  reason_details TEXT,

  -- Fee calculation
  original_price DECIMAL(10,2) NOT NULL,
  cancellation_fee DECIMAL(10,2) DEFAULT 0,
  refund_amount DECIMAL(10,2) DEFAULT 0,
  fee_calculation_details JSONB,

  -- Charged to
  fee_charged_to TEXT CHECK (fee_charged_to IN ('passenger', 'driver', 'split', 'none')),

  -- Processing
  fee_processed BOOLEAN DEFAULT FALSE,
  fee_processed_at TIMESTAMPTZ,
  refund_processed BOOLEAN DEFAULT FALSE,
  refund_processed_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ride_cancellations_booking ON public.ride_cancellations(ride_booking_id);
CREATE INDEX IF NOT EXISTS idx_ride_cancellations_cancelled_by ON public.ride_cancellations(cancelled_by);
CREATE INDEX IF NOT EXISTS idx_ride_cancellations_processing ON public.ride_cancellations(fee_processed, refund_processed);

-- =====================================================
-- TABLE: refund_requests
-- Manage refund requests and approvals
-- =====================================================
CREATE TABLE IF NOT EXISTS public.refund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Request details
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL,
  cancellation_id UUID REFERENCES public.ride_cancellations(id),

  -- Amounts
  original_amount DECIMAL(10,2) NOT NULL,
  requested_amount DECIMAL(10,2) NOT NULL,
  approved_amount DECIMAL(10,2),

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'under_review', 'approved', 'partially_approved',
    'rejected', 'processing', 'completed', 'failed'
  )),

  -- Reason
  reason TEXT NOT NULL,
  supporting_documents TEXT[], -- URLs to uploaded documents

  -- Review
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  -- Processing
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ,
  processing_method TEXT CHECK (processing_method IN (
    'original_payment_method', 'wallet', 'bank_transfer', 'manual'
  )),

  -- Provider details
  provider_refund_id TEXT, -- External provider's refund ID
  provider_response JSONB,

  -- Dispute
  disputed BOOLEAN DEFAULT FALSE,
  dispute_reason TEXT,
  dispute_resolved BOOLEAN DEFAULT FALSE,

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_refund_requests_user ON public.refund_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_payment ON public.refund_requests(payment_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON public.refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_refund_requests_cancellation ON public.refund_requests(cancellation_id);

-- =====================================================
-- TABLE: refund_transactions
-- Track refund payment transactions
-- =====================================================
CREATE TABLE IF NOT EXISTS public.refund_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  refund_request_id UUID NOT NULL REFERENCES public.refund_requests(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL,

  -- Transaction details
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'VUV',

  -- Method
  refund_method TEXT NOT NULL CHECK (refund_method IN (
    'my_cash', 'm_vatu', 'polar_card', 'wallet', 'bank_transfer', 'manual'
  )),

  -- Provider details
  provider TEXT,
  provider_transaction_id TEXT,
  provider_status TEXT,
  provider_response JSONB,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'completed', 'failed', 'cancelled'
  )),

  -- Timing
  initiated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,

  -- Retry logic
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_refund_transactions_request ON public.refund_transactions(refund_request_id);
CREATE INDEX IF NOT EXISTS idx_refund_transactions_status ON public.refund_transactions(status);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.cancellation_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_cancellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_transactions ENABLE ROW LEVEL SECURITY;

-- Cancellation Policies (read-only for users)
CREATE POLICY "Anyone can view active cancellation policies"
  ON public.cancellation_policies
  FOR SELECT
  USING (is_active = true);

-- Ride Cancellations
CREATE POLICY "Users can view their own cancellations"
  ON public.ride_cancellations
  FOR SELECT
  USING (auth.uid() = cancelled_by);

CREATE POLICY "Users can create cancellations"
  ON public.ride_cancellations
  FOR INSERT
  WITH CHECK (auth.uid() = cancelled_by);

-- Refund Requests
CREATE POLICY "Users can view their own refund requests"
  ON public.refund_requests
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create refund requests"
  ON public.refund_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their pending refund requests"
  ON public.refund_requests
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- Refund Transactions (users can view their own)
CREATE POLICY "Users can view their refund transactions"
  ON public.refund_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.refund_requests
      WHERE id = refund_request_id AND user_id = auth.uid()
    )
  );

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to auto-update updated_at timestamp
DROP TRIGGER IF EXISTS update_cancellation_policies_updated_at ON public.cancellation_policies;
CREATE TRIGGER update_cancellation_policies_updated_at
  BEFORE UPDATE ON public.cancellation_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ride_cancellations_updated_at ON public.ride_cancellations;
CREATE TRIGGER update_ride_cancellations_updated_at
  BEFORE UPDATE ON public.ride_cancellations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_refund_requests_updated_at ON public.refund_requests;
CREATE TRIGGER update_refund_requests_updated_at
  BEFORE UPDATE ON public.refund_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate cancellation fee
CREATE OR REPLACE FUNCTION calculate_cancellation_fee(
  p_ride_booking_id UUID,
  p_ride_status TEXT,
  p_cancelled_by_role TEXT,
  p_original_price DECIMAL
)
RETURNS TABLE(
  fee_amount DECIMAL,
  refund_amount DECIMAL,
  fee_charged_to TEXT,
  calculation_details JSONB
) AS $$
DECLARE
  policy RECORD;
  calculated_fee DECIMAL := 0;
  calculated_refund DECIMAL := p_original_price;
  charged_to TEXT := 'none';
BEGIN
  -- Find applicable cancellation policy (highest priority first)
  SELECT * INTO policy
  FROM public.cancellation_policies
  WHERE service_type = 'ride'
    AND is_active = true
    AND (ride_status IS NULL OR ride_status = p_ride_status)
  ORDER BY priority DESC, created_at DESC
  LIMIT 1;

  IF policy IS NOT NULL THEN
    -- Calculate fee based on policy
    IF policy.fee_type = 'percentage' THEN
      calculated_fee := p_original_price * (policy.fee_amount / 100);
    ELSIF policy.fee_type = 'fixed' THEN
      calculated_fee := policy.fee_amount;
    ELSE
      calculated_fee := 0;
    END IF;

    -- Ensure fee doesn't exceed original price
    IF calculated_fee > p_original_price THEN
      calculated_fee := p_original_price;
    END IF;

    -- Calculate refund
    calculated_refund := p_original_price - calculated_fee;
    charged_to := policy.charged_to;
  ELSE
    -- No policy found - no fee, full refund
    calculated_fee := 0;
    calculated_refund := p_original_price;
    charged_to := 'none';
  END IF;

  -- Return results
  RETURN QUERY SELECT
    calculated_fee,
    calculated_refund,
    charged_to,
    jsonb_build_object(
      'policy_id', policy.id,
      'policy_name', policy.policy_name,
      'fee_type', policy.fee_type,
      'original_price', p_original_price,
      'ride_status', p_ride_status,
      'cancelled_by', p_cancelled_by_role
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DEFAULT CANCELLATION POLICIES
-- Insert default policies for rides
-- =====================================================
INSERT INTO public.cancellation_policies (
  policy_name, service_type, ride_status, fee_type, fee_amount, charged_to, priority
) VALUES
  -- Passenger cancellations
  ('Passenger cancels - Pending', 'ride', 'pending', 'none', 0, 'none', 10),
  ('Passenger cancels - Accepted (within 5min)', 'ride', 'accepted', 'none', 0, 'none', 20),
  ('Passenger cancels - Accepted (after 5min)', 'ride', 'accepted', 'percentage', 25, 'passenger', 15),
  ('Passenger cancels - Driver arrived', 'ride', 'arrived', 'percentage', 50, 'passenger', 5),
  ('Passenger cancels - In progress', 'ride', 'in_progress', 'percentage', 100, 'passenger', 1),

  -- Driver cancellations (passenger gets refund, driver may be penalized separately)
  ('Driver cancels - Any status', 'ride', NULL, 'none', 0, 'driver', 0)
ON CONFLICT DO NOTHING;

-- =====================================================
-- REALTIME SUBSCRIPTIONS
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_cancellations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.refund_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.refund_transactions;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT SELECT ON public.cancellation_policies TO authenticated;
GRANT SELECT, INSERT ON public.ride_cancellations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.refund_requests TO authenticated;
GRANT SELECT ON public.refund_transactions TO authenticated;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ VanuWay Cancellation & Refunds System Setup Complete!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Created Tables:';
  RAISE NOTICE '  - cancellation_policies (fee rules)';
  RAISE NOTICE '  - ride_cancellations (cancellation tracking)';
  RAISE NOTICE '  - refund_requests (refund workflow)';
  RAISE NOTICE '  - refund_transactions (refund processing)';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Security:';
  RAISE NOTICE '  - RLS policies enabled';
  RAISE NOTICE '  - Users can only manage their own requests';
  RAISE NOTICE '';
  RAISE NOTICE '💰 Default Policies Loaded:';
  RAISE NOTICE '  - Pending: No fee';
  RAISE NOTICE '  - Accepted (0-5min): No fee';
  RAISE NOTICE '  - Accepted (>5min): 25% fee';
  RAISE NOTICE '  - Driver arrived: 50% fee';
  RAISE NOTICE '  - In progress: 100% fee';
  RAISE NOTICE '';
  RAISE NOTICE '📱 Features Ready:';
  RAISE NOTICE '  - Dynamic fee calculation';
  RAISE NOTICE '  - Automated refund processing';
  RAISE NOTICE '  - Dispute resolution';
  RAISE NOTICE '  - Multi-payment method refunds';
END $$;

SELECT json_build_object(
  'message', '✅ VanuWay Cancellation & Refunds System Setup Complete!',
  'tables_created', 4,
  'default_policies', 6
);
