-- Create wallets table
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_vvu NUMERIC NOT NULL DEFAULT 0,
  balance_aud NUMERIC NOT NULL DEFAULT 0,
  balance_usd NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on wallets
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- RLS policies for wallets
CREATE POLICY "Users can view their own wallet"
  ON public.wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet"
  ON public.wallets FOR UPDATE
  USING (auth.uid() = user_id);

-- Create drivers table
CREATE TABLE public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  avatar_url TEXT,
  rating NUMERIC NOT NULL DEFAULT 5.0,
  vehicle_type TEXT NOT NULL,
  vehicle_number TEXT,
  license_number TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on drivers
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- RLS policies for drivers
CREATE POLICY "Anyone can view active drivers"
  ON public.drivers FOR SELECT
  USING (is_active = true);

CREATE POLICY "Drivers can update their own profile"
  ON public.drivers FOR UPDATE
  USING (auth.uid() = user_id);

-- Create order_ratings table
CREATE TABLE public.order_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.food_orders(id) ON DELETE CASCADE,
  restaurant_rating INTEGER CHECK (restaurant_rating >= 1 AND restaurant_rating <= 5),
  driver_rating INTEGER CHECK (driver_rating >= 1 AND driver_rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, order_id)
);

-- Enable RLS on order_ratings
ALTER TABLE public.order_ratings ENABLE ROW LEVEL SECURITY;

-- RLS policies for order_ratings
CREATE POLICY "Users can create their own ratings"
  ON public.order_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own ratings"
  ON public.order_ratings FOR SELECT
  USING (auth.uid() = user_id);

-- Create language_preferences table
CREATE TABLE public.language_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  language TEXT NOT NULL CHECK (language IN ('en', 'bi', 'fr')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on language_preferences
ALTER TABLE public.language_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for language_preferences
CREATE POLICY "Users can manage their own language preferences"
  ON public.language_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Update transactions table
ALTER TABLE public.transactions 
  ADD COLUMN category TEXT,
  ADD COLUMN currency TEXT NOT NULL DEFAULT 'VUV',
  ADD COLUMN status TEXT NOT NULL DEFAULT 'completed',
  ADD COLUMN payment_method TEXT,
  ADD COLUMN reference_id TEXT,
  ADD COLUMN related_booking_id UUID,
  ADD COLUMN metadata JSONB,
  ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Update food_orders table
ALTER TABLE public.food_orders
  ADD COLUMN driver_id UUID REFERENCES public.drivers(id),
  ADD COLUMN estimated_delivery_time TIMESTAMP WITH TIME ZONE;

-- Add triggers for updated_at columns
CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_language_preferences_updated_at
  BEFORE UPDATE ON public.language_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update handle_new_user function to create wallet
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Create wallet with zero balance
  INSERT INTO public.wallets (user_id, balance_vvu, balance_aud, balance_usd)
  VALUES (NEW.id, 0, 0, 0);
  
  RETURN NEW;
END;
$$;

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_ratings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.language_preferences;