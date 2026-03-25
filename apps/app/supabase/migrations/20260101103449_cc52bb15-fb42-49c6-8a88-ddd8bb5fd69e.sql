-- Platform Settings Table for configurable rates
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view/modify settings
CREATE POLICY "Admins can view platform settings" 
ON public.platform_settings FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Admins can update platform settings" 
ON public.platform_settings FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Public can read commission rates (needed for price display)
CREATE POLICY "Public can read commission rates" 
ON public.platform_settings FOR SELECT 
USING (id IN ('commission_rates', 'delivery_handling_fee_range'));

-- Insert default settings
INSERT INTO public.platform_settings (id, value, description) VALUES 
('commission_rates', '{"vanucar": 0.18, "vanuride": 0.18, "delivery": 0.15}', 'Platform commission rates by service type'),
('delivery_handling_fee_range', '{"min": 100, "max": 1000, "default": 200, "currency": "VUV"}', 'Driver handling fee range for deliveries'),
('payout_schedule', '{"day": "monday", "frequency": "weekly", "min_amount": 500}', 'Driver payout schedule settings')
ON CONFLICT (id) DO NOTHING;

-- Add delivery-related columns to ride_bookings
ALTER TABLE public.ride_bookings 
ADD COLUMN IF NOT EXISTS is_delivery BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS delivery_handling_fee NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS package_description TEXT,
ADD COLUMN IF NOT EXISTS recipient_name TEXT,
ADD COLUMN IF NOT EXISTS recipient_phone TEXT,
ADD COLUMN IF NOT EXISTS commission_rate NUMERIC,
ADD COLUMN IF NOT EXISTS commission_amount NUMERIC,
ADD COLUMN IF NOT EXISTS driver_earnings NUMERIC;

-- Add handling_fee column to drivers table for delivery drivers
ALTER TABLE public.drivers
ADD COLUMN IF NOT EXISTS delivery_handling_fee NUMERIC DEFAULT 200,
ADD COLUMN IF NOT EXISTS accepts_deliveries BOOLEAN DEFAULT false;

-- Create trigger to auto-calculate commission on ride completion
CREATE OR REPLACE FUNCTION public.calculate_ride_commission()
RETURNS TRIGGER AS $$
DECLARE
  commission_config JSONB;
  rate NUMERIC;
  service TEXT;
BEGIN
  -- Only calculate on status change to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Get commission rates from platform settings
    SELECT value INTO commission_config 
    FROM platform_settings 
    WHERE id = 'commission_rates';
    
    -- Determine service type
    service := COALESCE(NEW.service_type, 'vanucar');
    IF NEW.is_delivery THEN
      service := 'delivery';
    END IF;
    
    -- Get rate for service type (default 18%)
    rate := COALESCE((commission_config ->> service)::NUMERIC, 0.18);
    
    -- Calculate commission and driver earnings
    NEW.commission_rate := rate;
    NEW.commission_amount := ROUND(NEW.price * rate);
    NEW.driver_earnings := NEW.price - NEW.commission_amount + COALESCE(NEW.delivery_handling_fee, 0);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_calculate_ride_commission ON public.ride_bookings;

-- Create trigger
CREATE TRIGGER trigger_calculate_ride_commission
BEFORE UPDATE ON public.ride_bookings
FOR EACH ROW
EXECUTE FUNCTION public.calculate_ride_commission();

-- Add index for delivery queries
CREATE INDEX IF NOT EXISTS idx_ride_bookings_is_delivery ON public.ride_bookings(is_delivery) WHERE is_delivery = true;

-- Add realtime for platform_settings
ALTER PUBLICATION supabase_realtime ADD TABLE platform_settings;