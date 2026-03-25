-- P2P Marketplace for Vanuatu
-- Buy and sell locally

-- ============================================
-- MARKETPLACE CATEGORIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.marketplace_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  parent_id UUID REFERENCES public.marketplace_categories(id),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MARKETPLACE LISTINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Listing Info
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,

  -- Pricing
  price DECIMAL(12,2) NOT NULL,
  price_negotiable BOOLEAN DEFAULT true,
  currency TEXT DEFAULT 'VUV',

  -- Condition (for items)
  condition TEXT CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'for_parts')),

  -- Media
  images TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Location
  island TEXT NOT NULL,
  area TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),

  -- Contact
  contact_phone TEXT NOT NULL,
  contact_whatsapp TEXT,
  contact_email TEXT,
  show_phone BOOLEAN DEFAULT true,

  -- Listing Type
  listing_type TEXT DEFAULT 'sale' CHECK (listing_type IN ('sale', 'wanted', 'free', 'trade')),

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'sold', 'expired', 'removed')),

  -- Moderation
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  is_verified BOOLEAN DEFAULT false,

  -- Stats
  view_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  message_count INTEGER DEFAULT 0,

  -- Timestamps
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  sold_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SAVED LISTINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.marketplace_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

-- ============================================
-- MARKETPLACE MESSAGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.marketplace_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Message
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MARKETPLACE REPORTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.marketplace_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'prohibited', 'scam', 'duplicate', 'wrong_category', 'inappropriate', 'other')),
  details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'action_taken', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_user ON public.marketplace_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_category ON public.marketplace_listings(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_island ON public.marketplace_listings(island);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON public.marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_type ON public.marketplace_listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_price ON public.marketplace_listings(price);
CREATE INDEX IF NOT EXISTS idx_marketplace_saves_user ON public.marketplace_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_saves_listing ON public.marketplace_saves(listing_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_messages_listing ON public.marketplace_messages(listing_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_messages_sender ON public.marketplace_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_messages_recipient ON public.marketplace_messages(recipient_id);

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE public.marketplace_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_reports ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Categories
DROP POLICY IF EXISTS "Public can view marketplace categories" ON public.marketplace_categories;
CREATE POLICY "Public can view marketplace categories"
  ON public.marketplace_categories FOR SELECT
  USING (is_active = true);

-- Listings
DROP POLICY IF EXISTS "Public can view active listings" ON public.marketplace_listings;
CREATE POLICY "Public can view active listings"
  ON public.marketplace_listings FOR SELECT
  USING (status = 'active' OR user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create listings" ON public.marketplace_listings;
CREATE POLICY "Users can create listings"
  ON public.marketplace_listings FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own listings" ON public.marketplace_listings;
CREATE POLICY "Users can update own listings"
  ON public.marketplace_listings FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own listings" ON public.marketplace_listings;
CREATE POLICY "Users can delete own listings"
  ON public.marketplace_listings FOR DELETE
  USING (user_id = auth.uid());

-- Saves
DROP POLICY IF EXISTS "Users can manage their saves" ON public.marketplace_saves;
CREATE POLICY "Users can manage their saves"
  ON public.marketplace_saves FOR ALL
  USING (user_id = auth.uid());

-- Messages
DROP POLICY IF EXISTS "Users can view their messages" ON public.marketplace_messages;
CREATE POLICY "Users can view their messages"
  ON public.marketplace_messages FOR SELECT
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

DROP POLICY IF EXISTS "Users can send messages" ON public.marketplace_messages;
CREATE POLICY "Users can send messages"
  ON public.marketplace_messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "Users can update read status" ON public.marketplace_messages;
CREATE POLICY "Users can update read status"
  ON public.marketplace_messages FOR UPDATE
  USING (recipient_id = auth.uid());

-- Reports
DROP POLICY IF EXISTS "Users can create reports" ON public.marketplace_reports;
CREATE POLICY "Users can create reports"
  ON public.marketplace_reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own reports" ON public.marketplace_reports;
CREATE POLICY "Users can view own reports"
  ON public.marketplace_reports FOR SELECT
  USING (reporter_id = auth.uid());

-- Admin policies
DROP POLICY IF EXISTS "Admins can manage all listings" ON public.marketplace_listings;
CREATE POLICY "Admins can manage all listings"
  ON public.marketplace_listings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can manage categories" ON public.marketplace_categories;
CREATE POLICY "Admins can manage categories"
  ON public.marketplace_categories FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can manage reports" ON public.marketplace_reports;
CREATE POLICY "Admins can manage reports"
  ON public.marketplace_reports FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ============================================
-- FUNCTIONS
-- ============================================

-- Increment view count
CREATE OR REPLACE FUNCTION increment_listing_views(listing_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.marketplace_listings
  SET view_count = view_count + 1
  WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql;

-- Update save count trigger
CREATE OR REPLACE FUNCTION update_listing_save_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.marketplace_listings
    SET save_count = save_count + 1
    WHERE id = NEW.listing_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.marketplace_listings
    SET save_count = save_count - 1
    WHERE id = OLD.listing_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_save_count_trigger ON public.marketplace_saves;
CREATE TRIGGER update_save_count_trigger
  AFTER INSERT OR DELETE ON public.marketplace_saves
  FOR EACH ROW
  EXECUTE FUNCTION update_listing_save_count();

-- ============================================
-- SEED DATA
-- ============================================

INSERT INTO public.marketplace_categories (name, slug, description, icon, display_order) VALUES
('Vehicles', 'vehicles', 'Cars, trucks, motorcycles, boats', 'Car', 1),
('Property', 'property', 'Houses, land, rentals', 'Home', 2),
('Electronics', 'electronics', 'Phones, computers, TVs, appliances', 'Smartphone', 3),
('Furniture', 'furniture', 'Home and office furniture', 'Sofa', 4),
('Clothing', 'clothing', 'Clothing, shoes, accessories', 'Shirt', 5),
('Sports & Outdoors', 'sports', 'Sports equipment, camping, fishing', 'Dumbbell', 6),
('Home & Garden', 'home-garden', 'Garden tools, plants, home decor', 'TreePine', 7),
('Baby & Kids', 'baby-kids', 'Toys, clothing, baby gear', 'Baby', 8),
('Jobs', 'jobs', 'Job listings and employment', 'Briefcase', 9),
('Services', 'services', 'Local services offered', 'Wrench', 10),
('Food & Agriculture', 'food-agriculture', 'Fresh produce, livestock, farming', 'Leaf', 11),
('Art & Crafts', 'art-crafts', 'Local art, handicrafts, souvenirs', 'Palette', 12),
('Musical Instruments', 'music', 'Instruments and music equipment', 'Music', 13),
('Books & Education', 'books', 'Books, courses, tutoring', 'BookOpen', 14),
('Free Items', 'free', 'Items being given away', 'Gift', 15),
('Other', 'other', 'Everything else', 'MoreHorizontal', 16)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.marketplace_categories IS 'Categories for marketplace listings';
COMMENT ON TABLE public.marketplace_listings IS 'User listings for items to buy/sell';
COMMENT ON TABLE public.marketplace_saves IS 'User saved/favorite listings';
COMMENT ON TABLE public.marketplace_messages IS 'Messages between buyers and sellers';
COMMENT ON TABLE public.marketplace_reports IS 'Reports of problematic listings';
