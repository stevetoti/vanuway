-- Tour Operators Management System
-- Similar to driver registration with application and approval workflow

-- ============================================
-- TOUR OPERATORS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.tour_operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Business Information
  business_name TEXT NOT NULL,
  business_type TEXT NOT NULL CHECK (business_type IN ('individual', 'company', 'cooperative', 'community')),
  business_registration_number TEXT,
  tax_identification_number TEXT,

  -- Contact Information
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  whatsapp_number TEXT,
  website TEXT,

  -- Address
  address TEXT NOT NULL,
  island TEXT NOT NULL,
  province TEXT,

  -- Business Details
  description TEXT,
  years_in_operation INTEGER DEFAULT 0,
  number_of_employees INTEGER DEFAULT 1,
  languages_spoken TEXT[] DEFAULT ARRAY['Bislama', 'English'],

  -- Certifications & Licenses
  tourism_license_number TEXT,
  tourism_license_expiry DATE,
  insurance_provider TEXT,
  insurance_policy_number TEXT,
  insurance_expiry DATE,
  certifications TEXT[],

  -- Documents (URLs)
  business_license_url TEXT,
  insurance_certificate_url TEXT,
  tourism_license_url TEXT,
  id_document_url TEXT,
  profile_photo_url TEXT,

  -- Categories they operate in
  tour_categories TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Bank Details for Payments
  bank_name TEXT,
  bank_account_name TEXT,
  bank_account_number TEXT,
  bank_branch TEXT,

  -- Status
  application_status TEXT DEFAULT 'pending' CHECK (application_status IN ('pending', 'submitted', 'under_review', 'approved', 'rejected', 'suspended')),
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'failed')),
  is_active BOOLEAN DEFAULT false,

  -- Admin Notes
  admin_notes TEXT,
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,

  -- Ratings
  average_rating DECIMAL(2,1) DEFAULT 5.0,
  total_reviews INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id),
  UNIQUE(email)
);

-- ============================================
-- TOUR OPERATOR APPLICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.tour_operator_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES public.tour_operators(id) ON DELETE CASCADE,

  -- Application Progress
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'under_review', 'approved', 'rejected', 'withdrawn')),

  -- Step Data (JSON for flexibility)
  step_1_data JSONB DEFAULT '{}'::jsonb, -- Basic Info
  step_2_data JSONB DEFAULT '{}'::jsonb, -- Business Details
  step_3_data JSONB DEFAULT '{}'::jsonb, -- Documents
  step_4_data JSONB DEFAULT '{}'::jsonb, -- Bank Details
  step_5_data JSONB DEFAULT '{}'::jsonb, -- Review & Submit

  -- Timestamps
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- UPDATE TOURS TABLE
-- ============================================

-- Add operator_id column if it doesn't exist (links to tour_operators)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tours' AND column_name = 'operator_id'
  ) THEN
    ALTER TABLE public.tours ADD COLUMN operator_id UUID REFERENCES public.tour_operators(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add approval status for tours
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tours' AND column_name = 'approval_status'
  ) THEN
    ALTER TABLE public.tours ADD COLUMN approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tour_operators_user_id ON public.tour_operators(user_id);
CREATE INDEX IF NOT EXISTS idx_tour_operators_status ON public.tour_operators(application_status);
CREATE INDEX IF NOT EXISTS idx_tour_operators_island ON public.tour_operators(island);
CREATE INDEX IF NOT EXISTS idx_tour_operators_active ON public.tour_operators(is_active);
CREATE INDEX IF NOT EXISTS idx_tour_operator_apps_operator ON public.tour_operator_applications(operator_id);
CREATE INDEX IF NOT EXISTS idx_tour_operator_apps_status ON public.tour_operator_applications(status);
CREATE INDEX IF NOT EXISTS idx_tours_operator_id ON public.tours(operator_id);
CREATE INDEX IF NOT EXISTS idx_tours_approval_status ON public.tours(approval_status);

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE public.tour_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_operator_applications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES FOR TOUR OPERATORS
-- ============================================

-- Operators can view their own profile
CREATE POLICY "Users can view their own operator profile"
  ON public.tour_operators FOR SELECT
  USING (user_id = auth.uid());

-- Users can create their operator profile
CREATE POLICY "Users can create their operator profile"
  ON public.tour_operators FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update their operator profile"
  ON public.tour_operators FOR UPDATE
  USING (user_id = auth.uid());

-- Admins can view all operators
CREATE POLICY "Admins can view all operators"
  ON public.tour_operators FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Admins can manage all operators
CREATE POLICY "Admins can manage all operators"
  ON public.tour_operators FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Public can view approved and active operators
CREATE POLICY "Public can view approved operators"
  ON public.tour_operators FOR SELECT
  USING (application_status = 'approved' AND is_active = true);

-- ============================================
-- RLS POLICIES FOR APPLICATIONS
-- ============================================

-- Users can view their own applications
CREATE POLICY "Users can view own applications"
  ON public.tour_operator_applications FOR SELECT
  USING (
    operator_id IN (SELECT id FROM public.tour_operators WHERE user_id = auth.uid())
  );

-- Users can create applications for their operator profile
CREATE POLICY "Users can create applications"
  ON public.tour_operator_applications FOR INSERT
  WITH CHECK (
    operator_id IN (SELECT id FROM public.tour_operators WHERE user_id = auth.uid())
  );

-- Users can update their pending applications
CREATE POLICY "Users can update pending applications"
  ON public.tour_operator_applications FOR UPDATE
  USING (
    operator_id IN (SELECT id FROM public.tour_operators WHERE user_id = auth.uid())
    AND status IN ('in_progress', 'submitted')
  );

-- Admins can view all applications
CREATE POLICY "Admins can view all applications"
  ON public.tour_operator_applications FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Admins can manage all applications
CREATE POLICY "Admins can manage all applications"
  ON public.tour_operator_applications FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ============================================
-- UPDATE TOURS POLICIES
-- ============================================

-- Drop existing provider policy if exists and create new one
DROP POLICY IF EXISTS "Providers can manage their tours" ON public.tours;

-- Operators can view their own tours (any status)
CREATE POLICY "Operators can view their tours"
  ON public.tours FOR SELECT
  USING (
    operator_id IN (SELECT id FROM public.tour_operators WHERE user_id = auth.uid())
    OR provider_id = auth.uid()
  );

-- Operators can create tours (pending approval)
CREATE POLICY "Operators can create tours"
  ON public.tours FOR INSERT
  WITH CHECK (
    operator_id IN (SELECT id FROM public.tour_operators WHERE user_id = auth.uid() AND application_status = 'approved')
    OR provider_id = auth.uid()
  );

-- Operators can update their own tours
CREATE POLICY "Operators can update their tours"
  ON public.tours FOR UPDATE
  USING (
    operator_id IN (SELECT id FROM public.tour_operators WHERE user_id = auth.uid())
    OR provider_id = auth.uid()
  );

-- Operators can delete their own pending tours
CREATE POLICY "Operators can delete pending tours"
  ON public.tours FOR DELETE
  USING (
    (operator_id IN (SELECT id FROM public.tour_operators WHERE user_id = auth.uid()) AND approval_status = 'pending')
    OR (provider_id = auth.uid() AND approval_status = 'pending')
  );

-- Update public view policy to only show approved tours
DROP POLICY IF EXISTS "Anyone can view active tours" ON public.tours;
CREATE POLICY "Anyone can view approved active tours"
  ON public.tours FOR SELECT
  USING (is_active = true AND (approval_status = 'approved' OR approval_status IS NULL));

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update operator rating based on tour reviews
CREATE OR REPLACE FUNCTION update_operator_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_operator_id UUID;
BEGIN
  -- Get the operator_id from the tour
  SELECT operator_id INTO v_operator_id FROM public.tours WHERE id = NEW.tour_id;

  IF v_operator_id IS NOT NULL THEN
    UPDATE public.tour_operators
    SET
      average_rating = (
        SELECT COALESCE(AVG(tr.rating), 5.0)
        FROM public.tour_reviews tr
        JOIN public.tours t ON tr.tour_id = t.id
        WHERE t.operator_id = v_operator_id
      ),
      total_reviews = (
        SELECT COUNT(*)
        FROM public.tour_reviews tr
        JOIN public.tours t ON tr.tour_id = t.id
        WHERE t.operator_id = v_operator_id
      )
    WHERE id = v_operator_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for operator rating update
DROP TRIGGER IF EXISTS update_operator_rating_trigger ON public.tour_reviews;
CREATE TRIGGER update_operator_rating_trigger
  AFTER INSERT OR UPDATE ON public.tour_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_operator_rating();

-- Function to increment booking count
CREATE OR REPLACE FUNCTION update_operator_bookings()
RETURNS TRIGGER AS $$
DECLARE
  v_operator_id UUID;
BEGIN
  -- Get the operator_id from the tour
  SELECT operator_id INTO v_operator_id FROM public.tours WHERE id = NEW.tour_id;

  IF v_operator_id IS NOT NULL AND NEW.status = 'confirmed' THEN
    UPDATE public.tour_operators
    SET total_bookings = total_bookings + 1
    WHERE id = v_operator_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for booking count update
DROP TRIGGER IF EXISTS update_operator_bookings_trigger ON public.tour_bookings;
CREATE TRIGGER update_operator_bookings_trigger
  AFTER INSERT OR UPDATE ON public.tour_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_operator_bookings();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.tour_operators IS 'Tour operators/providers who can list tours on the platform';
COMMENT ON TABLE public.tour_operator_applications IS 'Applications for tour operator registration';
COMMENT ON COLUMN public.tours.operator_id IS 'Reference to the tour operator who owns this tour';
COMMENT ON COLUMN public.tours.approval_status IS 'Admin approval status for the tour listing';
