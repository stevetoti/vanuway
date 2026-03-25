-- Add provider_id to tours table if not exists
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES public.tour_providers(id);

-- Add provider_id column to tour_bookings
ALTER TABLE public.tour_bookings ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES public.tour_providers(id);

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Providers can view their tour bookings" ON public.tour_bookings;
DROP POLICY IF EXISTS "Providers can update their tour bookings" ON public.tour_bookings;

-- Providers can view bookings for their tours
CREATE POLICY "Providers can view their tour bookings"
  ON public.tour_bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tour_providers tp
      WHERE tp.id = tour_bookings.provider_id AND tp.user_id = auth.uid()
    )
  );

-- Providers can update bookings for their tours
CREATE POLICY "Providers can update their tour bookings"
  ON public.tour_bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tour_providers tp
      WHERE tp.id = tour_bookings.provider_id AND tp.user_id = auth.uid()
    )
  );

-- Allow providers to view their own tours
DROP POLICY IF EXISTS "Providers can view their own tours" ON public.tours;
CREATE POLICY "Providers can view their own tours"
  ON public.tours FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tour_providers tp
      WHERE tp.id = tours.provider_id AND tp.user_id = auth.uid()
    )
  );

-- Allow providers to insert their own tours
DROP POLICY IF EXISTS "Providers can insert their own tours" ON public.tours;
CREATE POLICY "Providers can insert their own tours"
  ON public.tours FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tour_providers tp
      WHERE tp.id = provider_id AND tp.user_id = auth.uid()
    )
  );

-- Allow providers to update their own tours
DROP POLICY IF EXISTS "Providers can update their own tours" ON public.tours;
CREATE POLICY "Providers can update their own tours"
  ON public.tours FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tour_providers tp
      WHERE tp.id = tours.provider_id AND tp.user_id = auth.uid()
    )
  );