-- ============================================
-- VANUATU PAYMENT SYSTEM SETUP
-- Supports: Digicel My CASH, Vodafone M-Vatu, Polar Card, COD
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. CREATE PAYMENT_METHODS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method_type TEXT NOT NULL CHECK (method_type IN ('my_cash', 'm_vatu', 'polar_card', 'cod', 'wallet')),

  -- Provider-specific details
  provider_name TEXT, -- 'Digicel My CASH', 'Vodafone M-Vatu', 'Polar'
  account_number TEXT, -- Phone number for mobile money, card number for Polar
  account_name TEXT, -- Account holder name

  -- Card-specific (for Polar)
  card_last_four TEXT,
  card_expiry TEXT,
  card_brand TEXT, -- 'Visa', 'Mastercard'

  -- Status
  is_default BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. CREATE PAYMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL CHECK (service_type IN ('ride', 'food', 'hotel', 'tour', 'mart', 'other')),
  booking_id UUID, -- Reference to ride_bookings, food_orders, etc.

  -- Payment details
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'VUV' CHECK (currency IN ('VUV', 'AUD', 'USD')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('my_cash', 'm_vatu', 'polar_card', 'cod', 'wallet')),
  payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,

  -- Transaction details
  transaction_id TEXT, -- Provider transaction reference
  provider_reference TEXT, -- External payment gateway reference
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),

  -- COD specific
  cod_collected BOOLEAN DEFAULT FALSE,
  cod_collected_at TIMESTAMPTZ,
  cod_collector_id UUID REFERENCES auth.users(id), -- Driver or delivery person who collected

  -- Metadata
  description TEXT,
  metadata JSONB, -- Store additional provider-specific data
  failure_reason TEXT,
  refund_amount DECIMAL(10,2),
  refund_reason TEXT,
  refunded_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. CREATE PAYMENT_CONFIGURATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.payment_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL UNIQUE CHECK (provider IN ('my_cash', 'm_vatu', 'polar', 'system')),

  -- API Configuration
  api_key TEXT,
  api_secret TEXT,
  merchant_id TEXT,
  endpoint_url TEXT,
  sandbox_mode BOOLEAN DEFAULT TRUE,

  -- Settings
  is_enabled BOOLEAN DEFAULT TRUE,
  min_amount DECIMAL(10,2),
  max_amount DECIMAL(10,2),
  supported_currencies TEXT[] DEFAULT ARRAY['VUV'],

  -- Metadata
  config_data JSONB, -- Store provider-specific configuration
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON public.payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_method_type ON public.payment_methods(method_type);
CREATE INDEX IF NOT EXISTS idx_payment_methods_default ON public.payment_methods(user_id, is_default) WHERE is_default = TRUE;

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_service_type ON public.payments(service_type);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON public.payments(transaction_id);

-- ============================================
-- 5. SETUP ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_configurations ENABLE ROW LEVEL SECURITY;

-- Payment Methods Policies
DROP POLICY IF EXISTS "Users can view own payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Users can manage own payment methods" ON public.payment_methods;

CREATE POLICY "Users can view own payment methods"
  ON public.payment_methods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own payment methods"
  ON public.payment_methods FOR ALL
  USING (auth.uid() = user_id);

-- Payments Policies
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can create own payments" ON public.payments;
DROP POLICY IF EXISTS "Service providers can update payments" ON public.payments;

CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (
    auth.uid() = user_id
    OR auth.uid() = cod_collector_id
  );

CREATE POLICY "Users can create own payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service providers can update payments"
  ON public.payments FOR UPDATE
  USING (
    auth.uid() = user_id
    OR auth.uid() = cod_collector_id
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('driver', 'admin')
    )
  );

-- Payment Configurations (Admin only)
DROP POLICY IF EXISTS "Admins can manage payment configs" ON public.payment_configurations;

CREATE POLICY "Admins can manage payment configs"
  ON public.payment_configurations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================
-- 6. CREATE TRIGGERS
-- ============================================

-- Auto-update timestamp trigger function
CREATE OR REPLACE FUNCTION update_payment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS set_payment_methods_updated_at ON public.payment_methods;
CREATE TRIGGER set_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_updated_at();

DROP TRIGGER IF EXISTS set_payments_updated_at ON public.payments;
CREATE TRIGGER set_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_updated_at();

DROP TRIGGER IF EXISTS set_payment_config_updated_at ON public.payment_configurations;
CREATE TRIGGER set_payment_config_updated_at
  BEFORE UPDATE ON public.payment_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_updated_at();

-- ============================================
-- 7. INSERT DEFAULT PAYMENT CONFIGURATIONS
-- ============================================

INSERT INTO public.payment_configurations (provider, is_enabled, supported_currencies, config_data)
VALUES
  (
    'my_cash',
    TRUE,
    ARRAY['VUV'],
    '{"display_name": "Digicel My CASH", "logo": "my_cash_logo.png", "instructions": "Enter your Digicel mobile number"}'::JSONB
  ),
  (
    'm_vatu',
    TRUE,
    ARRAY['VUV'],
    '{"display_name": "Vodafone M-Vatu", "logo": "m_vatu_logo.png", "instructions": "Enter your Vodafone mobile number"}'::JSONB
  ),
  (
    'polar',
    TRUE,
    ARRAY['VUV', 'AUD', 'USD'],
    '{"display_name": "Polar Card", "logo": "polar_logo.png", "supported_cards": ["Visa", "Mastercard"]}'::JSONB
  ),
  (
    'system',
    TRUE,
    ARRAY['VUV', 'AUD', 'USD'],
    '{"cod_enabled": true, "wallet_enabled": true}'::JSONB
  )
ON CONFLICT (provider) DO NOTHING;

-- ============================================
-- 8. ENABLE REALTIME
-- ============================================

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- ============================================
-- 9. SUCCESS VERIFICATION
-- ============================================

SELECT
  'SUCCESS: Payment methods table created' as status,
  COUNT(*) as count
FROM public.payment_methods;

SELECT
  'SUCCESS: Payments table created' as status,
  COUNT(*) as count
FROM public.payments;

SELECT
  'SUCCESS: Payment configurations initialized' as status,
  COUNT(*) as count
FROM public.payment_configurations;

SELECT
  'SUCCESS: Indexes created' as status,
  COUNT(*) as index_count
FROM pg_indexes
WHERE tablename IN ('payment_methods', 'payments');

SELECT
  'SUCCESS: RLS policies created' as status,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('payment_methods', 'payments', 'payment_configurations');

SELECT '✅ Vanuatu Payment System Setup Complete!' as message;
