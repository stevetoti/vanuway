-- ============================================
-- RIDE MESSAGING SYSTEM SETUP
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. CREATE RIDE_MESSAGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.ride_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.ride_bookings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('driver', 'passenger')),
  message TEXT NOT NULL,
  is_template BOOLEAN DEFAULT FALSE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_ride_messages_ride_id ON public.ride_messages(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_messages_sender_id ON public.ride_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_ride_messages_created_at ON public.ride_messages(created_at DESC);

-- ============================================
-- 3. SETUP ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.ride_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view messages for their rides" ON public.ride_messages;
DROP POLICY IF EXISTS "Users can send messages for their rides" ON public.ride_messages;

-- Users can view messages for rides they're involved in (as driver or passenger)
CREATE POLICY "Users can view messages for their rides"
  ON public.ride_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ride_bookings rb
      WHERE rb.id = ride_id
      AND (
        rb.user_id = auth.uid() -- Passenger
        OR EXISTS (
          SELECT 1 FROM public.drivers d
          WHERE d.user_id = auth.uid()
          AND d.id = rb.driver_id -- Driver
        )
      )
    )
  );

-- Users can send messages for rides they're involved in
CREATE POLICY "Users can send messages for their rides"
  ON public.ride_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.ride_bookings rb
      WHERE rb.id = ride_id
      AND (
        rb.user_id = auth.uid() -- Passenger
        OR EXISTS (
          SELECT 1 FROM public.drivers d
          WHERE d.user_id = auth.uid()
          AND d.id = rb.driver_id -- Driver
        )
      )
    )
  );

-- ============================================
-- 4. ENABLE REALTIME
-- ============================================

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_messages;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Table already added
END $$;

-- ============================================
-- 5. SUCCESS VERIFICATION
-- ============================================

SELECT
  'SUCCESS: Ride messages table created' as status,
  COUNT(*) as message_count
FROM public.ride_messages;

SELECT
  'SUCCESS: Indexes created' as status,
  COUNT(*) as index_count
FROM pg_indexes
WHERE tablename = 'ride_messages';

SELECT
  'SUCCESS: RLS policies created' as status,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'ride_messages';

SELECT '✅ Ride Messaging System Setup Complete!' as message;
