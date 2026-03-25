-- Enable realtime for ride_bookings table
ALTER TABLE ride_bookings REPLICA IDENTITY FULL;

-- Add to realtime publication if not already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'ride_bookings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE ride_bookings;
  END IF;
END $$;