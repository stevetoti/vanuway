-- =====================================================
-- VANUWAY HOTELS BOOKING SYSTEM
-- =====================================================
-- Priority 4: Hotels with Property Owner Dashboards & Chat
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =====================================================
-- TABLE: hotel_owners
-- =====================================================
CREATE TABLE IF NOT EXISTS public.hotel_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  business_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT NOT NULL,

  business_registration_number TEXT,
  tax_id TEXT,

  bank_name TEXT,
  bank_account_number TEXT,
  bank_account_name TEXT,

  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN (
    'pending', 'verified', 'rejected'
  )),

  is_active BOOLEAN DEFAULT TRUE,
  total_properties INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hotel_owners_user ON public.hotel_owners(user_id);
CREATE INDEX IF NOT EXISTS idx_hotel_owners_status ON public.hotel_owners(verification_status);

-- =====================================================
-- TABLE: hotels
-- =====================================================
CREATE TABLE IF NOT EXISTS public.hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.hotel_owners(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,

  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  province TEXT,
  country TEXT DEFAULT 'Vanuatu',
  postal_code TEXT,

  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,

  phone_number TEXT,
  email TEXT,
  website TEXT,

  star_rating INTEGER CHECK (star_rating BETWEEN 1 AND 5),

  check_in_time TIME DEFAULT '14:00',
  check_out_time TIME DEFAULT '11:00',

  cancellation_policy TEXT,
  house_rules TEXT,

  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'pending_review', 'active', 'inactive', 'suspended'
  )),

  featured BOOLEAN DEFAULT FALSE,

  average_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hotels_owner ON public.hotels(owner_id);
CREATE INDEX IF NOT EXISTS idx_hotels_status ON public.hotels(status);
CREATE INDEX IF NOT EXISTS idx_hotels_location ON public.hotels(city, province);
CREATE INDEX IF NOT EXISTS idx_hotels_rating ON public.hotels(average_rating DESC);

-- =====================================================
-- TABLE: hotel_rooms
-- =====================================================
CREATE TABLE IF NOT EXISTS public.hotel_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  room_type TEXT NOT NULL CHECK (room_type IN (
    'single', 'double', 'twin', 'suite', 'family', 'deluxe', 'presidential'
  )),

  max_occupancy INTEGER NOT NULL,
  number_of_beds INTEGER,
  bed_type TEXT,

  size_sqm DECIMAL(6,2),

  base_price DECIMAL(10,2) NOT NULL,
  weekend_price DECIMAL(10,2),

  total_rooms INTEGER NOT NULL DEFAULT 1,
  available_rooms INTEGER NOT NULL DEFAULT 1,

  amenities TEXT[],

  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hotel_rooms_hotel ON public.hotel_rooms(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_rooms_type ON public.hotel_rooms(room_type);
CREATE INDEX IF NOT EXISTS idx_hotel_rooms_price ON public.hotel_rooms(base_price);

-- =====================================================
-- TABLE: hotel_photos
-- =====================================================
CREATE TABLE IF NOT EXISTS public.hotel_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.hotel_rooms(id) ON DELETE CASCADE,

  photo_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hotel_photos_hotel ON public.hotel_photos(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_photos_room ON public.hotel_photos(room_id);

-- =====================================================
-- TABLE: hotel_amenities
-- =====================================================
CREATE TABLE IF NOT EXISTS public.hotel_amenities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,

  category TEXT NOT NULL CHECK (category IN (
    'general', 'services', 'food_drink', 'internet', 'parking',
    'entertainment', 'safety', 'accessibility'
  )),
  amenity_name TEXT NOT NULL,
  is_free BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hotel_amenities_hotel ON public.hotel_amenities(hotel_id);

-- =====================================================
-- TABLE: hotel_bookings
-- =====================================================
CREATE TABLE IF NOT EXISTS public.hotel_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE RESTRICT,
  room_id UUID NOT NULL REFERENCES public.hotel_rooms(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,

  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  number_of_nights INTEGER NOT NULL,

  number_of_guests INTEGER NOT NULL,
  number_of_rooms INTEGER DEFAULT 1,

  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT NOT NULL,

  special_requests TEXT,

  room_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,

  booking_status TEXT NOT NULL DEFAULT 'pending' CHECK (booking_status IN (
    'pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'
  )),

  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN (
    'pending', 'paid', 'refunded', 'failed'
  )),
  payment_method TEXT,
  payment_reference TEXT,

  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hotel_bookings_hotel ON public.hotel_bookings(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_room ON public.hotel_bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_user ON public.hotel_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_dates ON public.hotel_bookings(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_status ON public.hotel_bookings(booking_status);

-- =====================================================
-- TABLE: hotel_reviews
-- =====================================================
CREATE TABLE IF NOT EXISTS public.hotel_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.hotel_bookings(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  comment TEXT,

  cleanliness_rating INTEGER CHECK (cleanliness_rating BETWEEN 1 AND 5),
  service_rating INTEGER CHECK (service_rating BETWEEN 1 AND 5),
  location_rating INTEGER CHECK (location_rating BETWEEN 1 AND 5),
  value_rating INTEGER CHECK (value_rating BETWEEN 1 AND 5),

  owner_response TEXT,
  owner_response_at TIMESTAMPTZ,

  is_verified BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hotel_reviews_hotel ON public.hotel_reviews(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_reviews_user ON public.hotel_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_hotel_reviews_rating ON public.hotel_reviews(rating DESC);

-- =====================================================
-- TABLE: conversations
-- =====================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  participant1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.hotel_bookings(id) ON DELETE SET NULL,

  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  last_message TEXT,

  participant1_unread INTEGER DEFAULT 0,
  participant2_unread INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(participant1_id, participant2_id, hotel_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_p1 ON public.conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_p2 ON public.conversations(participant2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_hotel ON public.conversations(hotel_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON public.conversations(last_message_at DESC);

-- =====================================================
-- TABLE: messages
-- =====================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,

  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  message_text TEXT NOT NULL,

  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.hotel_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Hotel Owners
CREATE POLICY "Owners can view own profile" ON public.hotel_owners
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Owners can update own profile" ON public.hotel_owners
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can register as hotel owner" ON public.hotel_owners
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Hotels
CREATE POLICY "Owners can manage their hotels" ON public.hotels
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.hotel_owners
      WHERE id = owner_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view active hotels" ON public.hotels
  FOR SELECT USING (status = 'active');

-- Rooms
CREATE POLICY "Owners can manage their rooms" ON public.hotel_rooms
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.hotels h
      JOIN public.hotel_owners o ON o.id = h.owner_id
      WHERE h.id = hotel_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view active rooms" ON public.hotel_rooms
  FOR SELECT USING (
    is_active = true AND EXISTS (
      SELECT 1 FROM public.hotels WHERE id = hotel_id AND status = 'active'
    )
  );

-- Bookings
CREATE POLICY "Users can view own bookings" ON public.hotel_bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings" ON public.hotel_bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can view their hotel bookings" ON public.hotel_bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.hotels h
      JOIN public.hotel_owners o ON o.id = h.owner_id
      WHERE h.id = hotel_id AND o.user_id = auth.uid()
    )
  );

-- Reviews
CREATE POLICY "Users can create reviews" ON public.hotel_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view reviews" ON public.hotel_reviews
  FOR SELECT USING (true);

CREATE POLICY "Owners can respond to reviews" ON public.hotel_reviews
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.hotels h
      JOIN public.hotel_owners o ON o.id = h.owner_id
      WHERE h.id = hotel_id AND o.user_id = auth.uid()
    )
  );

-- Conversations & Messages
CREATE POLICY "Users can view their conversations" ON public.conversations
  FOR SELECT USING (
    auth.uid() = participant1_id OR auth.uid() = participant2_id
  );

CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (
    auth.uid() = participant1_id OR auth.uid() = participant2_id
  );

CREATE POLICY "Users can view conversation messages" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = conversation_id
      AND (participant1_id = auth.uid() OR participant2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- =====================================================
-- TRIGGERS
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hotel_owners_updated_at
  BEFORE UPDATE ON public.hotel_owners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hotels_updated_at
  BEFORE UPDATE ON public.hotels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hotel_rooms_updated_at
  BEFORE UPDATE ON public.hotel_rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hotel_bookings_updated_at
  BEFORE UPDATE ON public.hotel_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update conversation on new message
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET
    last_message_at = NEW.created_at,
    last_message = NEW.message_text,
    participant1_unread = CASE
      WHEN participant1_id != NEW.sender_id THEN participant1_unread + 1
      ELSE participant1_unread
    END,
    participant2_unread = CASE
      WHEN participant2_id != NEW.sender_id THEN participant2_unread + 1
      ELSE participant2_unread
    END
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();

-- =====================================================
-- REALTIME SUBSCRIPTIONS
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hotel_bookings;

-- =====================================================
-- PERMISSIONS
-- =====================================================
GRANT SELECT, INSERT, UPDATE ON public.hotel_owners TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.hotels TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hotel_rooms TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.hotel_photos TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.hotel_amenities TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.hotel_bookings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.hotel_reviews TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT SELECT, INSERT ON public.messages TO authenticated;

-- =====================================================
-- SUCCESS
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ VanuWay Hotels System Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '9 tables created:';
  RAISE NOTICE '  ✓ hotel_owners - Property owner profiles';
  RAISE NOTICE '  ✓ hotels - Hotel properties';
  RAISE NOTICE '  ✓ hotel_rooms - Room types and pricing';
  RAISE NOTICE '  ✓ hotel_photos - Property images';
  RAISE NOTICE '  ✓ hotel_amenities - Facilities offered';
  RAISE NOTICE '  ✓ hotel_bookings - Reservations';
  RAISE NOTICE '  ✓ hotel_reviews - Guest reviews';
  RAISE NOTICE '  ✓ conversations - Chat system';
  RAISE NOTICE '  ✓ messages - Real-time messaging';
  RAISE NOTICE '========================================';
END $$;
