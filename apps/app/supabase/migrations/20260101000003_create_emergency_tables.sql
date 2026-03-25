-- Create emergency_contacts table for storing important emergency numbers
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('police', 'fire', 'medical', 'natural_disaster', 'maritime', 'government', 'utility', 'other')),
  phone_number TEXT NOT NULL,
  alternate_phone TEXT,
  address TEXT,
  island TEXT DEFAULT 'Efate',
  description TEXT,
  is_24_hours BOOLEAN DEFAULT true,
  operating_hours TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  priority INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create emergency_alerts table for broadcasting emergency notifications
CREATE TABLE IF NOT EXISTS public.emergency_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('cyclone', 'tsunami', 'earthquake', 'volcanic', 'flood', 'fire', 'health', 'security', 'other')),
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical', 'extreme')),

  -- Affected area
  affected_islands TEXT[],
  affected_areas TEXT[],

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'monitoring', 'resolved', 'expired')),

  -- Timing
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  effective_until TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,

  -- Instructions
  instructions TEXT[],
  evacuation_required BOOLEAN DEFAULT false,
  shelter_locations TEXT[],

  -- Source
  source TEXT,
  official_link TEXT,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_emergency_preferences table
CREATE TABLE IF NOT EXISTS public.user_emergency_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Notification preferences
  push_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT false,

  -- Alert categories to subscribe to
  subscribed_categories TEXT[] DEFAULT ARRAY['cyclone', 'tsunami', 'earthquake', 'volcanic', 'flood', 'fire', 'health', 'security'],

  -- Location preferences
  home_island TEXT DEFAULT 'Efate',
  notify_all_islands BOOLEAN DEFAULT false,

  -- Emergency contacts
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  blood_type TEXT,
  medical_conditions TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create emergency_reports table for user-submitted reports
CREATE TABLE IF NOT EXISTS public.emergency_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Report details
  category TEXT NOT NULL CHECK (category IN ('fire', 'accident', 'crime', 'medical', 'natural_disaster', 'infrastructure', 'other')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Location
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  address TEXT,
  island TEXT DEFAULT 'Efate',

  -- Media
  photo_urls TEXT[],

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'responding', 'resolved', 'false_alarm')),

  -- Response
  responder_notes TEXT,
  resolved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_category ON public.emergency_contacts(category);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_island ON public.emergency_contacts(island);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_status ON public.emergency_alerts(status);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_category ON public.emergency_alerts(category);
CREATE INDEX IF NOT EXISTS idx_emergency_reports_user ON public.emergency_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_reports_status ON public.emergency_reports(status);

-- Enable RLS
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_emergency_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_reports ENABLE ROW LEVEL SECURITY;

-- Emergency contacts policies (public read)
CREATE POLICY "Anyone can view emergency contacts"
  ON public.emergency_contacts FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage emergency contacts"
  ON public.emergency_contacts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Emergency alerts policies (public read)
CREATE POLICY "Anyone can view active alerts"
  ON public.emergency_alerts FOR SELECT
  USING (status IN ('active', 'monitoring'));

CREATE POLICY "Admins can manage alerts"
  ON public.emergency_alerts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- User preferences policies
CREATE POLICY "Users can view own preferences"
  ON public.user_emergency_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own preferences"
  ON public.user_emergency_preferences FOR ALL
  USING (user_id = auth.uid());

-- Emergency reports policies
CREATE POLICY "Users can view own reports"
  ON public.emergency_reports FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create reports"
  ON public.emergency_reports FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pending reports"
  ON public.emergency_reports FOR UPDATE
  USING (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Admins can manage all reports"
  ON public.emergency_reports FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Insert default emergency contacts for Vanuatu
INSERT INTO public.emergency_contacts (name, category, phone_number, description, island, priority) VALUES
  ('Police Emergency', 'police', '111', 'Vanuatu Police Force - Emergency Response', 'All Islands', 1),
  ('Fire Emergency', 'fire', '112', 'Fire and Rescue Services', 'All Islands', 2),
  ('Ambulance Emergency', 'medical', '115', 'Medical Emergency Services', 'All Islands', 3),
  ('Vila Central Hospital', 'medical', '+678 22100', 'Main hospital in Port Vila', 'Efate', 5),
  ('Northern District Hospital', 'medical', '+678 36345', 'Hospital in Luganville, Santo', 'Santo', 5),
  ('Maritime Rescue', 'maritime', '+678 22226', 'Maritime Search and Rescue', 'All Islands', 4),
  ('National Disaster Management Office', 'natural_disaster', '+678 22670', 'NDMO - Disaster preparedness and response', 'Efate', 4),
  ('Vanuatu Red Cross', 'other', '+678 27418', 'Humanitarian assistance and first aid', 'Efate', 6),
  ('Tourism Helpline', 'other', '+678 22515', 'Tourist assistance and information', 'Efate', 8),
  ('Australian Consulate', 'government', '+678 22777', 'Australian citizens emergency assistance', 'Efate', 7),
  ('New Zealand High Commission', 'government', '+678 22933', 'NZ citizens emergency assistance', 'Efate', 7),
  ('UNELCO Power', 'utility', '+678 22211', 'Electricity outages and emergencies', 'Efate', 9),
  ('UNELCO Water', 'utility', '+678 22214', 'Water supply emergencies', 'Efate', 9)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.emergency_contacts IS 'Emergency contact numbers and services in Vanuatu';
COMMENT ON TABLE public.emergency_alerts IS 'Active and historical emergency alerts';
COMMENT ON TABLE public.user_emergency_preferences IS 'User preferences for emergency notifications';
COMMENT ON TABLE public.emergency_reports IS 'User-submitted emergency reports';
