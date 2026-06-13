-- ============================================================================
-- Flight Sync Enhancements — Multi-airport + new airlines
-- ============================================================================

-- Add missing airlines discovered from AeroDataBox
INSERT INTO airlines (name, code, country) VALUES
('Virgin Australia', 'VA', 'Australia'),
('Jetstar', 'JQ', 'Australia')
ON CONFLICT (code) DO NOTHING;

-- Add data_source to flights if not already present (Phase 1 already has it)
-- Just ensure it exists
ALTER TABLE flights ADD COLUMN IF NOT EXISTS data_source text;

-- Remove the default on destination_airport_code so we can store SON too
-- (Phase 1 defaulted to 'VLI')
ALTER TABLE flights ALTER COLUMN destination_airport_code DROP DEFAULT;

-- Add index for faster sync lookups
CREATE INDEX IF NOT EXISTS idx_flights_number_date ON flights(flight_number, scheduled_arrival);
CREATE INDEX IF NOT EXISTS idx_flights_destination ON flights(destination_airport_code);

-- Delete old seed data (will be replaced by real API data)
DELETE FROM flights WHERE data_source IS NULL;
