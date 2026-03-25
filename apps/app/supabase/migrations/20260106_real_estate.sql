-- Real Estate Schema for Vanuway
-- Properties for rent or sale in Vanuatu

-- Property Types table
CREATE TABLE IF NOT EXISTS property_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  property_type TEXT NOT NULL,
  listing_type TEXT NOT NULL CHECK (listing_type IN ('rent', 'sale', 'lease')),
  price DECIMAL(12, 2) NOT NULL,
  price_period TEXT CHECK (price_period IN ('per_night', 'per_week', 'per_month', 'per_year', 'total')),
  price_negotiable BOOLEAN DEFAULT false,

  -- Location
  island TEXT NOT NULL,
  area TEXT,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Property details
  bedrooms INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 0,
  land_size DECIMAL(10, 2), -- in square meters
  floor_size DECIMAL(10, 2), -- in square meters
  year_built INTEGER,

  -- Features (stored as JSON array)
  features JSONB DEFAULT '[]'::jsonb,
  amenities JSONB DEFAULT '[]'::jsonb,

  -- Media
  images TEXT[] DEFAULT '{}',
  video_url TEXT,
  virtual_tour_url TEXT,

  -- Contact
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  contact_whatsapp TEXT,
  show_contact BOOLEAN DEFAULT true,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'pending', 'rented', 'sold', 'expired', 'removed')),
  featured BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,

  -- Stats
  view_count INTEGER DEFAULT 0,
  inquiry_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,

  -- Timestamps
  available_from DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days')
);

-- Property inquiries
CREATE TABLE IF NOT EXISTS property_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'replied', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved properties
CREATE TABLE IF NOT EXISTS property_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(property_id, user_id)
);

-- Property views tracking
CREATE TABLE IF NOT EXISTS property_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE property_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_views ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view property types" ON property_types;
DROP POLICY IF EXISTS "Anyone can view active properties" ON properties;
DROP POLICY IF EXISTS "Users can create properties" ON properties;
DROP POLICY IF EXISTS "Users can update own properties" ON properties;
DROP POLICY IF EXISTS "Users can delete own properties" ON properties;
DROP POLICY IF EXISTS "Property owners can view inquiries" ON property_inquiries;
DROP POLICY IF EXISTS "Users can create inquiries" ON property_inquiries;
DROP POLICY IF EXISTS "Property owners can update inquiries" ON property_inquiries;
DROP POLICY IF EXISTS "Users can view own saves" ON property_saves;
DROP POLICY IF EXISTS "Users can save properties" ON property_saves;
DROP POLICY IF EXISTS "Users can unsave properties" ON property_saves;
DROP POLICY IF EXISTS "Anyone can record property views" ON property_views;

-- RLS Policies for property_types
CREATE POLICY "Anyone can view property types"
  ON property_types FOR SELECT
  USING (true);

-- RLS Policies for properties
CREATE POLICY "Anyone can view active properties"
  ON properties FOR SELECT
  USING (status = 'active' OR user_id = auth.uid());

CREATE POLICY "Users can create properties"
  ON properties FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own properties"
  ON properties FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own properties"
  ON properties FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for property_inquiries
CREATE POLICY "Property owners can view inquiries"
  ON property_inquiries FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM properties WHERE id = property_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create inquiries"
  ON property_inquiries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Property owners can update inquiries"
  ON property_inquiries FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM properties WHERE id = property_id AND user_id = auth.uid())
  );

-- RLS Policies for property_saves
CREATE POLICY "Users can view own saves"
  ON property_saves FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save properties"
  ON property_saves FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave properties"
  ON property_saves FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for property_views
CREATE POLICY "Anyone can record property views"
  ON property_views FOR INSERT
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON properties(listing_type);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_island ON properties(island);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_bedrooms ON properties(bedrooms);
CREATE INDEX IF NOT EXISTS idx_property_inquiries_property_id ON property_inquiries(property_id);
CREATE INDEX IF NOT EXISTS idx_property_saves_user_id ON property_saves(user_id);

-- Function to update property save count
CREATE OR REPLACE FUNCTION update_property_save_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE properties SET save_count = save_count + 1 WHERE id = NEW.property_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE properties SET save_count = save_count - 1 WHERE id = OLD.property_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_update_property_save_count ON property_saves;

-- Trigger for save count
CREATE TRIGGER trigger_update_property_save_count
AFTER INSERT OR DELETE ON property_saves
FOR EACH ROW EXECUTE FUNCTION update_property_save_count();

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_property_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE properties SET view_count = view_count + 1 WHERE id = NEW.property_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_increment_property_view_count ON property_views;

-- Trigger for view count
CREATE TRIGGER trigger_increment_property_view_count
AFTER INSERT ON property_views
FOR EACH ROW EXECUTE FUNCTION increment_property_view_count();

-- Seed property types
INSERT INTO property_types (name, icon, description) VALUES
  ('House', '🏠', 'Standalone residential house'),
  ('Apartment', '🏢', 'Unit in an apartment building'),
  ('Villa', '🏡', 'Luxury villa with grounds'),
  ('Bungalow', '🛖', 'Single-story traditional home'),
  ('Land', '🌴', 'Vacant land or plot'),
  ('Commercial', '🏪', 'Shop, office, or business space'),
  ('Warehouse', '🏭', 'Industrial or storage space'),
  ('Hotel', '🏨', 'Hotel or resort property'),
  ('Farm', '🌾', 'Agricultural land with facilities'),
  ('Beach House', '🏖️', 'Beachfront property')
ON CONFLICT (name) DO NOTHING;

-- Seed sample properties
INSERT INTO properties (
  user_id, title, description, property_type, listing_type, price, price_period,
  island, area, bedrooms, bathrooms, land_size, floor_size,
  features, amenities, images, status, featured
) VALUES
  (
    (SELECT id FROM auth.users LIMIT 1),
    'Modern Family Home in Port Vila',
    'Beautiful 3-bedroom family home with ocean views. Modern kitchen, spacious living areas, and a lovely garden. Perfect for families looking for comfort and convenience in the capital.',
    'House',
    'rent',
    85000,
    'per_month',
    'Efate',
    'Nambatu',
    3,
    2,
    800,
    180,
    '["Ocean Views", "Garden", "Parking", "Security"]'::jsonb,
    '["Air Conditioning", "WiFi", "Hot Water", "Generator Backup"]'::jsonb,
    ARRAY['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'],
    'active',
    true
  ),
  (
    (SELECT id FROM auth.users LIMIT 1),
    'Beachfront Land - Santo',
    'Prime beachfront land in Luganville. 2000 sqm of flat land with direct beach access. Perfect for resort development or dream home. Clear title, ready for development.',
    'Land',
    'sale',
    25000000,
    'total',
    'Espiritu Santo',
    'Luganville',
    0,
    0,
    2000,
    NULL,
    '["Beachfront", "Flat Land", "Clear Title", "Road Access"]'::jsonb,
    '[]'::jsonb,
    ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'],
    'active',
    true
  ),
  (
    (SELECT id FROM auth.users LIMIT 1),
    'Luxury Villa with Pool',
    'Stunning 4-bedroom villa with private pool and tropical gardens. High-end finishes throughout, spacious entertainment areas, and breathtaking sunset views. Staff quarters included.',
    'Villa',
    'sale',
    95000000,
    'total',
    'Efate',
    'Pango',
    4,
    3,
    1500,
    350,
    '["Swimming Pool", "Ocean Views", "Staff Quarters", "Gated"]'::jsonb,
    '["Air Conditioning", "WiFi", "Generator", "Solar Power", "Water Tank"]'::jsonb,
    ARRAY['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800'],
    'active',
    true
  ),
  (
    (SELECT id FROM auth.users LIMIT 1),
    'City Center Apartment',
    'Modern 2-bedroom apartment in the heart of Port Vila. Walking distance to shops, restaurants, and waterfront. Secure building with parking. Ideal for professionals.',
    'Apartment',
    'rent',
    65000,
    'per_month',
    'Efate',
    'Port Vila CBD',
    2,
    1,
    NULL,
    85,
    '["City Views", "Balcony", "Secure Parking"]'::jsonb,
    '["Air Conditioning", "WiFi", "Elevator", "Gym Access"]'::jsonb,
    ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'],
    'active',
    false
  ),
  (
    (SELECT id FROM auth.users LIMIT 1),
    'Commercial Space - Main Street',
    'Prime retail space on Port Vila main street. High foot traffic location, 120 sqm ground floor with storage. Suitable for retail, restaurant, or office.',
    'Commercial',
    'lease',
    150000,
    'per_month',
    'Efate',
    'Port Vila CBD',
    0,
    1,
    NULL,
    120,
    '["Street Frontage", "Storage", "High Traffic"]'::jsonb,
    '["Air Conditioning", "Security Shutters"]'::jsonb,
    ARRAY['https://images.unsplash.com/photo-1497366216548-37526070297c?w=800'],
    'active',
    false
  ),
  (
    (SELECT id FROM auth.users LIMIT 1),
    'Traditional Bungalow - Tanna',
    'Authentic Vanuatu bungalow near Mount Yasur. Experience island life with modern comforts. 2 bedrooms, outdoor kitchen, and stunning volcano views.',
    'Bungalow',
    'rent',
    35000,
    'per_month',
    'Tanna',
    'Lenakel',
    2,
    1,
    500,
    60,
    '["Volcano Views", "Traditional Design", "Outdoor Kitchen"]'::jsonb,
    '["Solar Power", "Water Tank", "Outdoor Shower"]'::jsonb,
    ARRAY['https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800'],
    'active',
    false
  ),
  (
    (SELECT id FROM auth.users LIMIT 1),
    'Farm Land with House',
    'Productive 5-hectare farm with established fruit trees and vegetable gardens. Includes 3-bedroom farmhouse and worker housing. Water spring on property.',
    'Farm',
    'sale',
    45000000,
    'total',
    'Efate',
    'Mele',
    3,
    2,
    50000,
    120,
    '["Fruit Trees", "Water Spring", "Worker Housing", "Road Access"]'::jsonb,
    '["Solar Power", "Water Pump", "Storage Sheds"]'::jsonb,
    ARRAY['https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800'],
    'active',
    false
  ),
  (
    (SELECT id FROM auth.users LIMIT 1),
    'Beach House - Hideaway Island',
    'Charming beach house with direct lagoon access. 2 bedrooms with ensuite, open plan living, and large deck for entertaining. Kayaks and snorkeling gear included.',
    'Beach House',
    'rent',
    120000,
    'per_month',
    'Efate',
    'Mele Bay',
    2,
    2,
    600,
    95,
    '["Beachfront", "Lagoon Access", "Large Deck", "Water Sports"]'::jsonb,
    '["Air Conditioning", "WiFi", "Generator", "Kayaks", "Snorkel Gear"]'::jsonb,
    ARRAY['https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800'],
    'active',
    true
  );
