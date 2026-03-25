-- Create Tour Providers Table
CREATE TABLE public.tour_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT NOT NULL,
  business_registration_number TEXT,
  tax_id TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_account_name TEXT,
  description TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  is_active BOOLEAN DEFAULT true,
  total_tours INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  average_rating NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tour_providers ENABLE ROW LEVEL SECURITY;

-- Policies for tour_providers
CREATE POLICY "Users can view their own tour provider profile"
  ON public.tour_providers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tour provider profile"
  ON public.tour_providers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tour provider profile"
  ON public.tour_providers FOR UPDATE
  USING (auth.uid() = user_id);

-- Admin can view all tour providers
CREATE POLICY "Admins can view all tour providers"
  ON public.tour_providers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Admin can update all tour providers
CREATE POLICY "Admins can update all tour providers"
  ON public.tour_providers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Create updated_at trigger for tour_providers
CREATE OR REPLACE FUNCTION update_tour_providers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tour_providers_updated_at
  BEFORE UPDATE ON public.tour_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_tour_providers_updated_at();