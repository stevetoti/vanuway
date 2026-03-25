-- Community Events System for Vanuatu
-- Local events, festivals, cultural gatherings, and activities

-- ============================================
-- EVENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.community_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,

  -- Event Type
  category TEXT NOT NULL CHECK (category IN ('cultural', 'music', 'sports', 'food', 'market', 'festival', 'religious', 'community', 'business', 'educational', 'tourism', 'other')),

  -- Date & Time
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  is_all_day BOOLEAN DEFAULT false,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT, -- weekly, monthly, etc.

  -- Location
  venue_name TEXT NOT NULL,
  address TEXT,
  island TEXT NOT NULL DEFAULT 'Efate',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_online BOOLEAN DEFAULT false,
  online_link TEXT,

  -- Pricing
  is_free BOOLEAN DEFAULT true,
  price_adult DECIMAL(10,2),
  price_child DECIMAL(10,2),
  currency TEXT DEFAULT 'VUV',

  -- Media
  image_url TEXT,
  gallery_urls TEXT[],

  -- Organizer
  organizer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organizer_name TEXT NOT NULL,
  organizer_email TEXT,
  organizer_phone TEXT,

  -- Capacity
  max_attendees INTEGER,
  requires_registration BOOLEAN DEFAULT false,
  registration_deadline TIMESTAMPTZ,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'approved', 'cancelled', 'completed')),
  is_featured BOOLEAN DEFAULT false,

  -- Social
  attendee_count INTEGER DEFAULT 0,
  interested_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EVENT REGISTRATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.community_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('interested', 'registered', 'attended', 'cancelled')),
  tickets INTEGER DEFAULT 1,

  -- Contact info
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(event_id, user_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_events_category ON public.community_events(category);
CREATE INDEX IF NOT EXISTS idx_events_island ON public.community_events(island);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON public.community_events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.community_events(status);
CREATE INDEX IF NOT EXISTS idx_events_featured ON public.community_events(is_featured);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON public.event_registrations(user_id);

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Anyone can view approved events
DROP POLICY IF EXISTS "Anyone can view approved events" ON public.community_events;
CREATE POLICY "Anyone can view approved events"
  ON public.community_events FOR SELECT
  USING (status = 'approved');

-- Organizers can view their own events (any status)
DROP POLICY IF EXISTS "Organizers can view own events" ON public.community_events;
CREATE POLICY "Organizers can view own events"
  ON public.community_events FOR SELECT
  USING (organizer_id = auth.uid());

-- Users can create events (pending approval)
DROP POLICY IF EXISTS "Users can create events" ON public.community_events;
CREATE POLICY "Users can create events"
  ON public.community_events FOR INSERT
  WITH CHECK (organizer_id = auth.uid());

-- Organizers can update their pending events
DROP POLICY IF EXISTS "Organizers can update own events" ON public.community_events;
CREATE POLICY "Organizers can update own events"
  ON public.community_events FOR UPDATE
  USING (organizer_id = auth.uid() AND status IN ('draft', 'pending'));

-- Admins can manage all events
DROP POLICY IF EXISTS "Admins can manage all events" ON public.community_events;
CREATE POLICY "Admins can manage all events"
  ON public.community_events FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Registration policies
DROP POLICY IF EXISTS "Users can view own registrations" ON public.event_registrations;
CREATE POLICY "Users can view own registrations"
  ON public.event_registrations FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can register for events" ON public.event_registrations;
CREATE POLICY "Users can register for events"
  ON public.event_registrations FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own registrations" ON public.event_registrations;
CREATE POLICY "Users can update own registrations"
  ON public.event_registrations FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can cancel registrations" ON public.event_registrations;
CREATE POLICY "Users can cancel registrations"
  ON public.event_registrations FOR DELETE
  USING (user_id = auth.uid());

-- Organizers can view registrations for their events
DROP POLICY IF EXISTS "Organizers can view event registrations" ON public.event_registrations;
CREATE POLICY "Organizers can view event registrations"
  ON public.event_registrations FOR SELECT
  USING (
    event_id IN (SELECT id FROM public.community_events WHERE organizer_id = auth.uid())
  );

-- ============================================
-- FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION update_event_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.community_events
    SET
      attendee_count = (SELECT COUNT(*) FROM public.event_registrations WHERE event_id = NEW.event_id AND status = 'registered'),
      interested_count = (SELECT COUNT(*) FROM public.event_registrations WHERE event_id = NEW.event_id AND status = 'interested')
    WHERE id = NEW.event_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_events
    SET
      attendee_count = (SELECT COUNT(*) FROM public.event_registrations WHERE event_id = OLD.event_id AND status = 'registered'),
      interested_count = (SELECT COUNT(*) FROM public.event_registrations WHERE event_id = OLD.event_id AND status = 'interested')
    WHERE id = OLD.event_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_event_counts_trigger ON public.event_registrations;
CREATE TRIGGER update_event_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_event_counts();

-- ============================================
-- SEED DATA
-- ============================================

INSERT INTO public.community_events (
  title, description, short_description, category, start_date, end_date, start_time,
  venue_name, address, island, is_free, organizer_name, status, is_featured
) VALUES
(
  'Independence Day Celebrations',
  'Join us for Vanuatu''s Independence Day celebrations featuring traditional dancing, cultural performances, parades, and fireworks. A celebration of our nation''s rich heritage and independence.',
  'Annual Independence Day festivities with cultural performances',
  'festival',
  '2026-07-30',
  '2026-07-30',
  '09:00',
  'Independence Park',
  'Port Vila',
  'Efate',
  true,
  'Government of Vanuatu',
  'approved',
  true
),
(
  'Port Vila Saturday Market',
  'The famous Port Vila market with fresh produce, local handicrafts, and delicious food. A weekly gathering where locals and visitors meet to shop and socialize.',
  'Weekly market with fresh produce and crafts',
  'market',
  '2026-01-11',
  NULL,
  '06:00',
  'Port Vila Market House',
  'Rue Carnot, Port Vila',
  'Efate',
  true,
  'Port Vila Municipality',
  'approved',
  true
),
(
  'Tok Tok Music Festival',
  'Vanuatu''s biggest music festival featuring local and Pacific Island artists. Three days of live music, cultural performances, and celebration of Pacific sounds.',
  'Pacific Island music festival',
  'music',
  '2026-04-10',
  '2026-04-12',
  '16:00',
  'Saralana Park',
  'Port Vila',
  'Efate',
  false,
  'Tok Tok Productions',
  'approved',
  true
),
(
  'Naghol Land Diving',
  'Witness the legendary land diving ceremony on Pentecost Island. Men dive from tall towers with vines tied to their ankles in this ancient ritual.',
  'Traditional land diving ceremony',
  'cultural',
  '2026-04-04',
  '2026-06-30',
  '10:00',
  'Various Villages',
  'Pentecost Island',
  'Pentecost',
  false,
  'Pentecost Tourism Office',
  'approved',
  true
),
(
  'Vanuatu Open Golf Tournament',
  'Annual golf tournament at Port Vila Golf Club. Open to all skill levels with prizes for winners and fun for everyone.',
  'Annual golf tournament open to all',
  'sports',
  '2026-03-15',
  '2026-03-16',
  '08:00',
  'Port Vila Golf Club',
  'Mele Road, Port Vila',
  'Efate',
  false,
  'Port Vila Golf Club',
  'approved',
  false
),
(
  'Feast of the Assumption',
  'Religious celebration in predominantly Catholic communities across Vanuatu with church services and community gatherings.',
  'Catholic religious celebration',
  'religious',
  '2026-08-15',
  '2026-08-15',
  '09:00',
  'Sacred Heart Cathedral',
  'Port Vila',
  'Efate',
  true,
  'Catholic Diocese of Port Vila',
  'approved',
  false
),
(
  'Vanuatu Food Festival',
  'Celebrate Vanuatu''s culinary heritage with traditional dishes, cooking demonstrations, and food competitions. Taste lap lap, tuluk, and other local delicacies.',
  'Celebration of local cuisine',
  'food',
  '2026-05-20',
  '2026-05-22',
  '10:00',
  'Seafront Area',
  'Port Vila Waterfront',
  'Efate',
  true,
  'Vanuatu Tourism Office',
  'approved',
  true
),
(
  'Business Networking Evening',
  'Monthly networking event for business professionals in Port Vila. Connect with local entrepreneurs and international business people.',
  'Monthly business networking',
  'business',
  '2026-02-05',
  NULL,
  '18:00',
  'Grand Hotel & Casino',
  'Port Vila',
  'Efate',
  false,
  'Vanuatu Chamber of Commerce',
  'approved',
  false
),
(
  'Traditional Kastom Village Day',
  'Experience authentic village life with demonstrations of traditional crafts, cooking, dancing, and customs at Ekasup Village.',
  'Cultural immersion experience',
  'cultural',
  '2026-02-14',
  NULL,
  '09:30',
  'Ekasup Village',
  'Near Port Vila',
  'Efate',
  false,
  'Ekasup Cultural Village',
  'approved',
  false
),
(
  'Santo Agricultural Show',
  'Annual agricultural show showcasing Vanuatu''s farming produce, livestock, and agricultural innovations.',
  'Annual farming and livestock show',
  'community',
  '2026-09-05',
  '2026-09-06',
  '08:00',
  'Luganville Showgrounds',
  'Luganville',
  'Espiritu Santo',
  true,
  'Santo Farmers Association',
  'approved',
  false
)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.community_events IS 'Community events, festivals, and activities in Vanuatu';
COMMENT ON TABLE public.event_registrations IS 'User registrations and interest in events';
