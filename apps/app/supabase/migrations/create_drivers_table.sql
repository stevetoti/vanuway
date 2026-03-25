-- Create drivers table for VanuCar & VanuRide driver management
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('car', 'moto')),
  vehicle_model TEXT NOT NULL,
  vehicle_color TEXT,
  license_plate TEXT NOT NULL UNIQUE,

  -- Driver status
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('available', 'busy', 'offline')),
  is_verified BOOLEAN DEFAULT FALSE,

  -- Current location
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  current_ride_id UUID REFERENCES public.ride_bookings(id) ON DELETE SET NULL,

  -- Stats
  rating DECIMAL(3,2) DEFAULT 5.0,
  total_rides INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0,

  -- Documents
  license_number TEXT,
  license_expiry DATE,
  insurance_number TEXT,
  insurance_expiry DATE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for finding nearby available drivers
CREATE INDEX IF NOT EXISTS idx_drivers_location ON public.drivers(current_lat, current_lng);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON public.drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_vehicle_type ON public.drivers(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON public.drivers(user_id);

-- Enable Row Level Security
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- Policy: Drivers can view their own profile
CREATE POLICY "Drivers can view own profile"
  ON public.drivers FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Drivers can update their own profile
CREATE POLICY "Drivers can update own profile"
  ON public.drivers FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can view active drivers (for finding nearby drivers)
CREATE POLICY "Users can view active drivers"
  ON public.drivers FOR SELECT
  USING (status IN ('available', 'busy'));

-- Policy: Admin can manage all drivers
CREATE POLICY "Admins can manage drivers"
  ON public.drivers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_drivers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER set_drivers_updated_at
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW
  EXECUTE FUNCTION update_drivers_updated_at();

-- Add driver role to user_roles enum if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'app_role' AND e.enumlabel = 'driver'
  ) THEN
    -- Role already exists from the schema
  END IF;
END $$;

COMMENT ON TABLE public.drivers IS 'Driver profiles for VanuCar and VanuRide services';
COMMENT ON COLUMN public.drivers.status IS 'Driver availability status: available, busy, or offline';
COMMENT ON COLUMN public.drivers.vehicle_type IS 'Type of vehicle: car (VanuCar) or moto (VanuRide)';
