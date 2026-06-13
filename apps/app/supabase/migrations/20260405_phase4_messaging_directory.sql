-- ============================================================================
-- PHASE 4: Booking Messages, Directory Enhancements
-- ============================================================================

-- Booking messages (for advance bookings communication)
CREATE TABLE IF NOT EXISTS booking_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES advance_bookings(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE booking_messages ENABLE ROW LEVEL SECURITY;

-- Users can read messages for their own bookings
CREATE POLICY "Users read own booking messages" ON booking_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM advance_bookings ab
      WHERE ab.id = booking_messages.booking_id
      AND (ab.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM drivers d WHERE d.id = ab.driver_id AND d.user_id = auth.uid()
      ))
    )
  );

-- Users can send messages on their own bookings
CREATE POLICY "Users send booking messages" ON booking_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM advance_bookings ab
      WHERE ab.id = booking_messages.booking_id
      AND (ab.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM drivers d WHERE d.id = ab.driver_id AND d.user_id = auth.uid()
      ))
    )
  );

-- Users can mark messages as read
CREATE POLICY "Users update booking messages read status" ON booking_messages FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM advance_bookings ab
      WHERE ab.id = booking_messages.booking_id
      AND (ab.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM drivers d WHERE d.id = ab.driver_id AND d.user_id = auth.uid()
      ))
    )
  );

-- Admins manage all
CREATE POLICY "Admins manage booking messages" ON booking_messages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_booking_messages_booking ON booking_messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_messages_sender ON booking_messages(sender_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE booking_messages;
