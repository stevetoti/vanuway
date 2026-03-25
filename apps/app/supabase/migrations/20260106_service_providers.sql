-- Service Providers Marketplace for Vanuatu
-- Connect with local professionals: plumbers, electricians, carpenters, etc.

-- ============================================
-- SERVICE CATEGORIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT, -- Icon name for UI
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SERVICE PROVIDERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.service_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic Info
  business_name TEXT NOT NULL,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('individual', 'company')),
  description TEXT,
  profile_photo_url TEXT,
  cover_photo_url TEXT,

  -- Contact
  contact_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  alternate_phone TEXT,
  email TEXT,
  whatsapp_number TEXT,

  -- Location
  address TEXT,
  island TEXT NOT NULL,
  area TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  service_radius_km INTEGER DEFAULT 25,

  -- Services
  categories TEXT[] DEFAULT ARRAY[]::TEXT[], -- Array of category slugs
  specializations TEXT[],
  languages_spoken TEXT[] DEFAULT ARRAY['Bislama', 'English'],

  -- Availability
  is_available BOOLEAN DEFAULT true,
  availability_hours JSONB DEFAULT '{"monday": {"start": "08:00", "end": "17:00"}, "tuesday": {"start": "08:00", "end": "17:00"}, "wednesday": {"start": "08:00", "end": "17:00"}, "thursday": {"start": "08:00", "end": "17:00"}, "friday": {"start": "08:00", "end": "17:00"}}'::jsonb,
  accepts_emergency BOOLEAN DEFAULT false,
  emergency_fee_percentage INTEGER DEFAULT 50,

  -- Pricing
  hourly_rate DECIMAL(10,2),
  min_charge DECIMAL(10,2),
  accepts_negotiation BOOLEAN DEFAULT true,

  -- Experience & Credentials
  years_experience INTEGER DEFAULT 0,
  certifications TEXT[],
  portfolio_urls TEXT[],

  -- Status
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended')),
  is_active BOOLEAN DEFAULT true,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),

  -- Stats
  average_rating DECIMAL(2,1) DEFAULT 5.0,
  total_reviews INTEGER DEFAULT 0,
  total_jobs INTEGER DEFAULT 0,
  response_rate INTEGER DEFAULT 100,
  response_time_hours INTEGER DEFAULT 2,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- ============================================
-- SERVICE REQUESTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.service_providers(id) ON DELETE SET NULL,

  -- Request Details
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Location
  address TEXT NOT NULL,
  island TEXT NOT NULL,
  area TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),

  -- Timing
  urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('normal', 'urgent', 'emergency')),
  preferred_date DATE,
  preferred_time_start TIME,
  preferred_time_end TIME,
  is_flexible BOOLEAN DEFAULT true,

  -- Budget
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  currency TEXT DEFAULT 'VUV',

  -- Media
  photo_urls TEXT[],

  -- Contact
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT,

  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'completed', 'cancelled')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

-- ============================================
-- SERVICE QUOTES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.service_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,

  -- Quote Details
  message TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  price_type TEXT DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'hourly', 'estimate')),
  estimated_hours DECIMAL(5,2),
  includes_materials BOOLEAN DEFAULT false,
  materials_cost DECIMAL(10,2),
  valid_until DATE,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'withdrawn')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- ============================================
-- SERVICE REVIEWS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.service_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id UUID REFERENCES public.service_requests(id) ON DELETE SET NULL,

  -- Review Content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  review TEXT,

  -- Specific Ratings
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),

  -- Response from provider
  provider_response TEXT,
  response_date TIMESTAMPTZ,

  -- Status
  is_verified BOOLEAN DEFAULT false, -- Verified job completion
  is_hidden BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(provider_id, user_id, request_id)
);

-- ============================================
-- SAVED PROVIDERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.saved_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_service_providers_user ON public.service_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_service_providers_island ON public.service_providers(island);
CREATE INDEX IF NOT EXISTS idx_service_providers_categories ON public.service_providers USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_service_providers_status ON public.service_providers(verification_status);
CREATE INDEX IF NOT EXISTS idx_service_providers_active ON public.service_providers(is_active);
CREATE INDEX IF NOT EXISTS idx_service_providers_rating ON public.service_providers(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_service_requests_user ON public.service_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_provider ON public.service_requests(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON public.service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_category ON public.service_requests(category);
CREATE INDEX IF NOT EXISTS idx_service_quotes_request ON public.service_quotes(request_id);
CREATE INDEX IF NOT EXISTS idx_service_quotes_provider ON public.service_quotes(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_reviews_provider ON public.service_reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_reviews_user ON public.service_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_providers_user ON public.saved_providers(user_id);

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_providers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Categories: Public read
DROP POLICY IF EXISTS "Public can view active categories" ON public.service_categories;
CREATE POLICY "Public can view active categories"
  ON public.service_categories FOR SELECT
  USING (is_active = true);

-- Providers: Public read for verified, own profile management
DROP POLICY IF EXISTS "Public can view verified providers" ON public.service_providers;
CREATE POLICY "Public can view verified providers"
  ON public.service_providers FOR SELECT
  USING (verification_status = 'verified' AND is_active = true);

DROP POLICY IF EXISTS "Users can view own provider profile" ON public.service_providers;
CREATE POLICY "Users can view own provider profile"
  ON public.service_providers FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create provider profile" ON public.service_providers;
CREATE POLICY "Users can create provider profile"
  ON public.service_providers FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own provider profile" ON public.service_providers;
CREATE POLICY "Users can update own provider profile"
  ON public.service_providers FOR UPDATE
  USING (user_id = auth.uid());

-- Service Requests
DROP POLICY IF EXISTS "Users can view own requests" ON public.service_requests;
CREATE POLICY "Users can view own requests"
  ON public.service_requests FOR SELECT
  USING (user_id = auth.uid() OR provider_id IN (SELECT id FROM public.service_providers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Providers can view open requests" ON public.service_requests;
CREATE POLICY "Providers can view open requests"
  ON public.service_requests FOR SELECT
  USING (
    status = 'open' AND
    EXISTS (SELECT 1 FROM public.service_providers WHERE user_id = auth.uid() AND verification_status = 'verified')
  );

DROP POLICY IF EXISTS "Users can create requests" ON public.service_requests;
CREATE POLICY "Users can create requests"
  ON public.service_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own requests" ON public.service_requests;
CREATE POLICY "Users can update own requests"
  ON public.service_requests FOR UPDATE
  USING (user_id = auth.uid() OR provider_id IN (SELECT id FROM public.service_providers WHERE user_id = auth.uid()));

-- Quotes
DROP POLICY IF EXISTS "Users can view quotes on their requests" ON public.service_quotes;
CREATE POLICY "Users can view quotes on their requests"
  ON public.service_quotes FOR SELECT
  USING (
    request_id IN (SELECT id FROM public.service_requests WHERE user_id = auth.uid()) OR
    provider_id IN (SELECT id FROM public.service_providers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Providers can create quotes" ON public.service_quotes;
CREATE POLICY "Providers can create quotes"
  ON public.service_quotes FOR INSERT
  WITH CHECK (provider_id IN (SELECT id FROM public.service_providers WHERE user_id = auth.uid() AND verification_status = 'verified'));

DROP POLICY IF EXISTS "Providers can update own quotes" ON public.service_quotes;
CREATE POLICY "Providers can update own quotes"
  ON public.service_quotes FOR UPDATE
  USING (provider_id IN (SELECT id FROM public.service_providers WHERE user_id = auth.uid()));

-- Reviews
DROP POLICY IF EXISTS "Public can view reviews" ON public.service_reviews;
CREATE POLICY "Public can view reviews"
  ON public.service_reviews FOR SELECT
  USING (is_hidden = false);

DROP POLICY IF EXISTS "Users can create reviews" ON public.service_reviews;
CREATE POLICY "Users can create reviews"
  ON public.service_reviews FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own reviews" ON public.service_reviews;
CREATE POLICY "Users can update own reviews"
  ON public.service_reviews FOR UPDATE
  USING (user_id = auth.uid() OR provider_id IN (SELECT id FROM public.service_providers WHERE user_id = auth.uid()));

-- Saved Providers
DROP POLICY IF EXISTS "Users can manage saved providers" ON public.saved_providers;
CREATE POLICY "Users can manage saved providers"
  ON public.saved_providers FOR ALL
  USING (user_id = auth.uid());

-- Admin policies
DROP POLICY IF EXISTS "Admins can manage all providers" ON public.service_providers;
CREATE POLICY "Admins can manage all providers"
  ON public.service_providers FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can manage all requests" ON public.service_requests;
CREATE POLICY "Admins can manage all requests"
  ON public.service_requests FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can manage categories" ON public.service_categories;
CREATE POLICY "Admins can manage categories"
  ON public.service_categories FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ============================================
-- FUNCTIONS
-- ============================================

-- Update provider rating
CREATE OR REPLACE FUNCTION update_service_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.service_providers
  SET
    average_rating = (
      SELECT COALESCE(AVG(rating), 5.0)
      FROM public.service_reviews
      WHERE provider_id = NEW.provider_id AND is_hidden = false
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM public.service_reviews
      WHERE provider_id = NEW.provider_id AND is_hidden = false
    )
  WHERE id = NEW.provider_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_provider_rating_trigger ON public.service_reviews;
CREATE TRIGGER update_provider_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.service_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_service_provider_rating();

-- ============================================
-- SEED DATA
-- ============================================

-- Insert Service Categories
INSERT INTO public.service_categories (name, slug, description, icon, display_order) VALUES
('Plumbing', 'plumbing', 'Plumbers for repairs, installations, and maintenance', 'Wrench', 1),
('Electrical', 'electrical', 'Electricians for wiring, repairs, and installations', 'Zap', 2),
('Carpentry', 'carpentry', 'Carpenters for woodwork, furniture, and construction', 'Hammer', 3),
('Painting', 'painting', 'Painters for interior and exterior painting', 'Paintbrush', 4),
('Cleaning', 'cleaning', 'Professional cleaning services', 'Sparkles', 5),
('Landscaping', 'landscaping', 'Garden and yard maintenance', 'TreePine', 6),
('Air Conditioning', 'ac-repair', 'AC installation, repair, and maintenance', 'Wind', 7),
('Appliance Repair', 'appliance', 'Repair for home appliances', 'Refrigerator', 8),
('Moving', 'moving', 'Moving and transport services', 'Truck', 9),
('Security', 'security', 'Security system installation and monitoring', 'Shield', 10),
('Pest Control', 'pest-control', 'Pest extermination and prevention', 'Bug', 11),
('Roofing', 'roofing', 'Roof repair and installation', 'Home', 12),
('Welding', 'welding', 'Metal fabrication and welding services', 'Flame', 13),
('Auto Repair', 'auto-repair', 'Vehicle repair and maintenance', 'Car', 14),
('Photography', 'photography', 'Professional photography and videography', 'Camera', 15),
('Catering', 'catering', 'Event catering services', 'ChefHat', 16),
('Event Planning', 'events', 'Event planning and coordination', 'PartyPopper', 17),
('IT Services', 'it-services', 'Computer repair and IT support', 'Laptop', 18),
('Tutoring', 'tutoring', 'Private tutoring and lessons', 'GraduationCap', 19),
('Beauty & Wellness', 'beauty', 'Hair, makeup, and wellness services', 'Scissors', 20)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.service_categories IS 'Categories of services offered by providers';
COMMENT ON TABLE public.service_providers IS 'Service providers/professionals offering services';
COMMENT ON TABLE public.service_requests IS 'Service requests from users looking for help';
COMMENT ON TABLE public.service_quotes IS 'Quotes from providers responding to requests';
COMMENT ON TABLE public.service_reviews IS 'Reviews and ratings for service providers';
COMMENT ON TABLE public.saved_providers IS 'User saved/favorite providers';
