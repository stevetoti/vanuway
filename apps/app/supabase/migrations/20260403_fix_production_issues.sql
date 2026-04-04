-- Migration: Create ride_messages table
-- Date: 2026-04-03
-- Description: Only the ride_messages table is needed — all RPC functions already exist in the database.

BEGIN;

-- ============================================================================
-- ride_messages table
-- ============================================================================

CREATE TABLE IF NOT EXISTS ride_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid NOT NULL REFERENCES ride_bookings(id),
  sender_id uuid NOT NULL REFERENCES auth.users(id),
  sender_type text NOT NULL CHECK (sender_type IN ('driver', 'passenger')),
  message text NOT NULL,
  is_template boolean DEFAULT false,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ride_messages_ride_id ON ride_messages(ride_id);

ALTER TABLE ride_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages for their rides" ON ride_messages;
CREATE POLICY "Users can view messages for their rides" ON ride_messages
  FOR SELECT
  USING (
    sender_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM ride_bookings rb
      WHERE rb.id = ride_messages.ride_id
        AND (rb.user_id = auth.uid() OR rb.driver_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can send messages for their rides" ON ride_messages;
CREATE POLICY "Users can send messages for their rides" ON ride_messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM ride_bookings rb
      WHERE rb.id = ride_messages.ride_id
        AND (rb.user_id = auth.uid() OR rb.driver_id = auth.uid())
    )
  );

COMMIT;
