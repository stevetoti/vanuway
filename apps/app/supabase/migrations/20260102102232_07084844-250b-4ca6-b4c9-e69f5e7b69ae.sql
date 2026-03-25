-- Create restaurant_owners table
CREATE TABLE public.restaurant_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT NOT NULL,
  business_registration_number TEXT,
  tax_id TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_account_name TEXT,
  verification_status TEXT DEFAULT 'pending',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.restaurant_owners ENABLE ROW LEVEL SECURITY;

-- Users can view their own restaurant owner profile
CREATE POLICY "Users can view their own restaurant owner profile"
  ON public.restaurant_owners FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own restaurant owner profile
CREATE POLICY "Users can insert their own restaurant owner profile"
  ON public.restaurant_owners FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own restaurant owner profile
CREATE POLICY "Users can update their own restaurant owner profile"
  ON public.restaurant_owners FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all restaurant owners
CREATE POLICY "Admins can view all restaurant owners"
  ON public.restaurant_owners FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update restaurant owners
CREATE POLICY "Admins can update restaurant owners"
  ON public.restaurant_owners FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_restaurant_owners_updated_at
  BEFORE UPDATE ON public.restaurant_owners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();