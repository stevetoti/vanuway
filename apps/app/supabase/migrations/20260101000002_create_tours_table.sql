-- Create tours/attractions table for VanuTour service
CREATE TABLE IF NOT EXISTS public.tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,

  -- Location
  location TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  island TEXT DEFAULT 'Efate',

  -- Categorization
  category TEXT NOT NULL CHECK (category IN ('adventure', 'cultural', 'nature', 'historical', 'water_sports', 'island_hopping', 'wildlife', 'culinary')),

  -- Pricing
  price_adult DECIMAL(10,2) NOT NULL,
  price_child DECIMAL(10,2),
  currency TEXT DEFAULT 'VUV',

  -- Tour details
  duration_hours DECIMAL(4,1) NOT NULL,
  difficulty_level TEXT DEFAULT 'easy' CHECK (difficulty_level IN ('easy', 'moderate', 'challenging', 'extreme')),
  max_group_size INTEGER DEFAULT 20,
  min_age INTEGER DEFAULT 0,

  -- Media
  image_url TEXT,
  gallery_urls TEXT[],

  -- Availability
  is_active BOOLEAN DEFAULT true,
  available_days TEXT[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
  start_times TEXT[] DEFAULT ARRAY['09:00', '14:00'],

  -- Features
  includes TEXT[],
  excludes TEXT[],
  what_to_bring TEXT[],
  highlights TEXT[],

  -- Ratings
  rating DECIMAL(2,1) DEFAULT 5.0,
  review_count INTEGER DEFAULT 0,

  -- Host/Provider
  provider_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  provider_name TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tour_bookings table
CREATE TABLE IF NOT EXISTS public.tour_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,

  -- Booking details
  booking_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  adults INTEGER NOT NULL DEFAULT 1,
  children INTEGER DEFAULT 0,

  -- Pricing
  total_price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'VUV',

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),

  -- Contact
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  special_requests TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tour_reviews table
CREATE TABLE IF NOT EXISTS public.tour_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.tour_bookings(id) ON DELETE SET NULL,

  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,

  -- Photos from the tour
  photo_urls TEXT[],

  -- Verification
  is_verified BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, tour_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tours_category ON public.tours(category);
CREATE INDEX IF NOT EXISTS idx_tours_location ON public.tours(location);
CREATE INDEX IF NOT EXISTS idx_tours_island ON public.tours(island);
CREATE INDEX IF NOT EXISTS idx_tours_is_active ON public.tours(is_active);
CREATE INDEX IF NOT EXISTS idx_tour_bookings_user ON public.tour_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_tour_bookings_tour ON public.tour_bookings(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_bookings_date ON public.tour_bookings(booking_date);

-- Enable RLS
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_reviews ENABLE ROW LEVEL SECURITY;

-- Tours policies
CREATE POLICY "Anyone can view active tours"
  ON public.tours FOR SELECT
  USING (is_active = true);

CREATE POLICY "Providers can manage their tours"
  ON public.tours FOR ALL
  USING (provider_id = auth.uid());

CREATE POLICY "Admins can manage all tours"
  ON public.tours FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Tour bookings policies
CREATE POLICY "Users can view their own bookings"
  ON public.tour_bookings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create bookings"
  ON public.tour_bookings FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their pending bookings"
  ON public.tour_bookings FOR UPDATE
  USING (user_id = auth.uid() AND status = 'pending');

-- Tour reviews policies
CREATE POLICY "Anyone can view reviews"
  ON public.tour_reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviews for completed bookings"
  ON public.tour_reviews FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own reviews"
  ON public.tour_reviews FOR UPDATE
  USING (user_id = auth.uid());

-- Function to update tour rating
CREATE OR REPLACE FUNCTION update_tour_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.tours
  SET
    rating = (SELECT COALESCE(AVG(rating), 5.0) FROM public.tour_reviews WHERE tour_id = NEW.tour_id),
    review_count = (SELECT COUNT(*) FROM public.tour_reviews WHERE tour_id = NEW.tour_id)
  WHERE id = NEW.tour_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update rating on review
CREATE TRIGGER update_tour_rating_trigger
  AFTER INSERT OR UPDATE ON public.tour_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_tour_rating();

COMMENT ON TABLE public.tours IS 'Tours and attractions available in Vanuatu';
COMMENT ON TABLE public.tour_bookings IS 'User bookings for tours';
COMMENT ON TABLE public.tour_reviews IS 'User reviews for tours';
