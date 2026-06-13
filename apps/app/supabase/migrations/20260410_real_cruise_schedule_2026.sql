-- ============================================================================
-- Real 2026 Port Vila Cruise Schedule
-- Source: CruiseMapper + CruiseTimetables (scraped April 10, 2026)
-- ============================================================================

-- Step 1: Clear old seed data for cruise schedules (keep cruise_lines and ships)
DELETE FROM cruise_schedules WHERE arrival_date >= '2026-04-01';

-- Step 2: Ensure cruise lines exist
INSERT INTO cruise_lines (name, website_url) VALUES
  ('Royal Caribbean', 'https://www.royalcaribbean.com')
ON CONFLICT (name) DO NOTHING;

INSERT INTO cruise_lines (name, website_url) VALUES
  ('Carnival Cruise Line', 'https://www.carnival.com')
ON CONFLICT (name) DO NOTHING;

INSERT INTO cruise_lines (name, website_url) VALUES
  ('Celebrity Cruises', 'https://www.celebritycruises.com')
ON CONFLICT (name) DO NOTHING;

INSERT INTO cruise_lines (name, website_url) VALUES
  ('Norwegian Cruise Line', 'https://www.ncl.com')
ON CONFLICT (name) DO NOTHING;

INSERT INTO cruise_lines (name, website_url) VALUES
  ('Princess Cruises', 'https://www.princess.com')
ON CONFLICT (name) DO NOTHING;

INSERT INTO cruise_lines (name, website_url) VALUES
  ('Oceania Cruises', 'https://www.oceaniacruises.com')
ON CONFLICT (name) DO NOTHING;

INSERT INTO cruise_lines (name, website_url) VALUES
  ('AIDA Cruises', 'https://www.aida.de')
ON CONFLICT (name) DO NOTHING;

-- Step 3: Ensure ships exist
-- Royal Caribbean ships
INSERT INTO cruise_ships (cruise_line_id, name, passenger_capacity)
SELECT cl.id, 'Voyager of the Seas', 3114
FROM cruise_lines cl WHERE cl.name = 'Royal Caribbean'
AND NOT EXISTS (SELECT 1 FROM cruise_ships WHERE name = 'Voyager of the Seas');

INSERT INTO cruise_ships (cruise_line_id, name, passenger_capacity)
SELECT cl.id, 'Anthem of the Seas', 4180
FROM cruise_lines cl WHERE cl.name = 'Royal Caribbean'
AND NOT EXISTS (SELECT 1 FROM cruise_ships WHERE name = 'Anthem of the Seas');

INSERT INTO cruise_ships (cruise_line_id, name, passenger_capacity)
SELECT cl.id, 'Quantum of the Seas', 4180
FROM cruise_lines cl WHERE cl.name = 'Royal Caribbean'
AND NOT EXISTS (SELECT 1 FROM cruise_ships WHERE name = 'Quantum of the Seas');

-- Carnival ships
INSERT INTO cruise_ships (cruise_line_id, name, passenger_capacity)
SELECT cl.id, 'Carnival Adventure', 2640
FROM cruise_lines cl WHERE cl.name = 'Carnival Cruise Line'
AND NOT EXISTS (SELECT 1 FROM cruise_ships WHERE name = 'Carnival Adventure');

INSERT INTO cruise_ships (cruise_line_id, name, passenger_capacity)
SELECT cl.id, 'Carnival Encounter', 2600
FROM cruise_lines cl WHERE cl.name = 'Carnival Cruise Line'
AND NOT EXISTS (SELECT 1 FROM cruise_ships WHERE name = 'Carnival Encounter');

INSERT INTO cruise_ships (cruise_line_id, name, passenger_capacity)
SELECT cl.id, 'Carnival Splendor', 3012
FROM cruise_lines cl WHERE cl.name = 'Carnival Cruise Line'
AND NOT EXISTS (SELECT 1 FROM cruise_ships WHERE name = 'Carnival Splendor');

INSERT INTO cruise_ships (cruise_line_id, name, passenger_capacity)
SELECT cl.id, 'Carnival Luminosa', 2260
FROM cruise_lines cl WHERE cl.name = 'Carnival Cruise Line'
AND NOT EXISTS (SELECT 1 FROM cruise_ships WHERE name = 'Carnival Luminosa');

-- Celebrity
INSERT INTO cruise_ships (cruise_line_id, name, passenger_capacity)
SELECT cl.id, 'Celebrity Edge', 2918
FROM cruise_lines cl WHERE cl.name = 'Celebrity Cruises'
AND NOT EXISTS (SELECT 1 FROM cruise_ships WHERE name = 'Celebrity Edge');

INSERT INTO cruise_ships (cruise_line_id, name, passenger_capacity)
SELECT cl.id, 'Celebrity Solstice', 2852
FROM cruise_lines cl WHERE cl.name = 'Celebrity Cruises'
AND NOT EXISTS (SELECT 1 FROM cruise_ships WHERE name = 'Celebrity Solstice');

-- Norwegian
INSERT INTO cruise_ships (cruise_line_id, name, passenger_capacity)
SELECT cl.id, 'Norwegian Spirit', 1972
FROM cruise_lines cl WHERE cl.name = 'Norwegian Cruise Line'
AND NOT EXISTS (SELECT 1 FROM cruise_ships WHERE name = 'Norwegian Spirit');

-- Princess
INSERT INTO cruise_ships (cruise_line_id, name, passenger_capacity)
SELECT cl.id, 'Grand Princess', 2610
FROM cruise_lines cl WHERE cl.name = 'Princess Cruises'
AND NOT EXISTS (SELECT 1 FROM cruise_ships WHERE name = 'Grand Princess');

-- Oceania
INSERT INTO cruise_ships (cruise_line_id, name, passenger_capacity)
SELECT cl.id, 'Oceania Riviera', 1250
FROM cruise_lines cl WHERE cl.name = 'Oceania Cruises'
AND NOT EXISTS (SELECT 1 FROM cruise_ships WHERE name = 'Oceania Riviera');

-- AIDA
INSERT INTO cruise_ships (cruise_line_id, name, passenger_capacity)
SELECT cl.id, 'AIDAsol', 2174
FROM cruise_lines cl WHERE cl.name = 'AIDA Cruises'
AND NOT EXISTS (SELECT 1 FROM cruise_ships WHERE name = 'AIDAsol');

-- Step 4: Insert real 2026 schedule
-- APRIL 2026
INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, data_source)
SELECT s.id, '2026-04-01', '07:00', '2026-04-01', '15:00', 3114, 'cruisemapper'
FROM cruise_ships s WHERE s.name = 'Voyager of the Seas'
ON CONFLICT (ship_id, arrival_date) DO UPDATE SET arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time, expected_passengers = EXCLUDED.expected_passengers;

INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, data_source)
SELECT s.id, '2026-04-07', '08:00', '2026-04-07', '15:00', 4180, 'cruisemapper'
FROM cruise_ships s WHERE s.name = 'Anthem of the Seas'
ON CONFLICT (ship_id, arrival_date) DO UPDATE SET arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time, expected_passengers = EXCLUDED.expected_passengers;

INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, data_source)
SELECT s.id, '2026-04-08', '08:00', '2026-04-08', '18:00', 2918, 'cruisemapper'
FROM cruise_ships s WHERE s.name = 'Celebrity Edge'
ON CONFLICT (ship_id, arrival_date) DO UPDATE SET arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time, expected_passengers = EXCLUDED.expected_passengers;

INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, data_source)
SELECT s.id, '2026-04-11', '09:30', '2026-04-11', '17:00', 3114, 'cruisetimetables'
FROM cruise_ships s WHERE s.name = 'Voyager of the Seas'
ON CONFLICT (ship_id, arrival_date) DO UPDATE SET arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time, expected_passengers = EXCLUDED.expected_passengers;

INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, data_source)
SELECT s.id, '2026-04-16', '08:00', '2026-04-16', '17:00', 2640, 'cruisetimetables'
FROM cruise_ships s WHERE s.name = 'Carnival Adventure'
ON CONFLICT (ship_id, arrival_date) DO UPDATE SET arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time, expected_passengers = EXCLUDED.expected_passengers;

INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, data_source)
SELECT s.id, '2026-04-26', '08:00', '2026-04-26', '16:00', 2600, 'cruisetimetables'
FROM cruise_ships s WHERE s.name = 'Carnival Encounter'
ON CONFLICT (ship_id, arrival_date) DO UPDATE SET arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time, expected_passengers = EXCLUDED.expected_passengers;

INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, data_source)
SELECT s.id, '2026-04-27', '07:00', '2026-04-27', '16:00', 1972, 'cruisetimetables'
FROM cruise_ships s WHERE s.name = 'Norwegian Spirit'
ON CONFLICT (ship_id, arrival_date) DO UPDATE SET arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time, expected_passengers = EXCLUDED.expected_passengers;

-- MAY 2026
INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, data_source)
SELECT s.id, '2026-05-12', '08:00', '2026-05-12', '17:00', 2600, 'cruisetimetables'
FROM cruise_ships s WHERE s.name = 'Carnival Encounter'
ON CONFLICT (ship_id, arrival_date) DO UPDATE SET arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time;

INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, data_source)
SELECT s.id, '2026-05-26', '08:00', '2026-05-26', '17:00', 2600, 'cruisetimetables'
FROM cruise_ships s WHERE s.name = 'Carnival Encounter'
ON CONFLICT (ship_id, arrival_date) DO UPDATE SET arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time;

-- JUNE 2026
INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, data_source)
SELECT s.id, '2026-06-13', '08:00', '2026-06-13', '17:00', 2640, 'cruisetimetables'
FROM cruise_ships s WHERE s.name = 'Carnival Adventure'
ON CONFLICT (ship_id, arrival_date) DO UPDATE SET arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time;

INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, data_source)
SELECT s.id, '2026-06-29', '08:00', '2026-06-29', '16:00', 2600, 'cruisetimetables'
FROM cruise_ships s WHERE s.name = 'Carnival Encounter'
ON CONFLICT (ship_id, arrival_date) DO UPDATE SET arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time;

-- JULY 2026
INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, data_source)
SELECT s.id, '2026-07-10', '08:00', '2026-07-10', '16:00', 2640, 'cruisetimetables'
FROM cruise_ships s WHERE s.name = 'Carnival Adventure'
ON CONFLICT (ship_id, arrival_date) DO UPDATE SET arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time;

INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, data_source)
SELECT s.id, '2026-07-11', '08:00', '2026-07-11', '17:00', 3012, 'cruisetimetables'
FROM cruise_ships s WHERE s.name = 'Carnival Splendor'
ON CONFLICT (ship_id, arrival_date) DO UPDATE SET arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time;

INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, data_source)
SELECT s.id, '2026-07-23', '08:00', '2026-07-23', '16:00', 2640, 'cruisetimetables'
FROM cruise_ships s WHERE s.name = 'Carnival Adventure'
ON CONFLICT (ship_id, arrival_date) DO UPDATE SET arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time;

-- AUGUST 2026
INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, data_source)
SELECT s.id, '2026-08-03', '08:00', '2026-08-03', '17:00', 2640, 'cruisetimetables'
FROM cruise_ships s WHERE s.name = 'Carnival Adventure'
ON CONFLICT (ship_id, arrival_date) DO UPDATE SET arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time;

INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, data_source)
SELECT s.id, '2026-08-11', '08:00', '2026-08-11', '16:00', 3012, 'cruisetimetables'
FROM cruise_ships s WHERE s.name = 'Carnival Splendor'
ON CONFLICT (ship_id, arrival_date) DO UPDATE SET arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time;

INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, data_source)
SELECT s.id, '2026-08-12', '08:00', '2026-08-12', '17:00', 2600, 'cruisetimetables'
FROM cruise_ships s WHERE s.name = 'Carnival Encounter'
ON CONFLICT (ship_id, arrival_date) DO UPDATE SET arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time;

INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, data_source)
SELECT s.id, '2026-08-24', '08:00', '2026-08-24', '17:00', 2640, 'cruisetimetables'
FROM cruise_ships s WHERE s.name = 'Carnival Adventure'
ON CONFLICT (ship_id, arrival_date) DO UPDATE SET arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time;

-- SEPTEMBER 2026
INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, data_source)
SELECT s.id, '2026-09-13', '08:00', '2026-09-13', '17:00', 2640, 'cruisetimetables'
FROM cruise_ships s WHERE s.name = 'Carnival Adventure'
ON CONFLICT (ship_id, arrival_date) DO UPDATE SET arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time;

INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, data_source)
SELECT s.id, '2026-09-22', '08:00', '2026-09-22', '16:00', 2600, 'cruisetimetables'
FROM cruise_ships s WHERE s.name = 'Carnival Encounter'
ON CONFLICT (ship_id, arrival_date) DO UPDATE SET arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time;

-- OCTOBER 2026
INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, data_source)
SELECT s.id, '2026-10-04', '08:00', '2026-10-04', '17:00', 2640, 'cruisetimetables'
FROM cruise_ships s WHERE s.name = 'Carnival Adventure'
ON CONFLICT (ship_id, arrival_date) DO UPDATE SET arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time;

INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, data_source)
SELECT s.id, '2026-10-07', '08:00', '2026-10-07', '17:00', 2600, 'cruisetimetables'
FROM cruise_ships s WHERE s.name = 'Carnival Encounter'
ON CONFLICT (ship_id, arrival_date) DO UPDATE SET arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time;

INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, data_source)
SELECT s.id, '2026-10-22', '08:00', '2026-10-22', '17:00', 2600, 'cruisetimetables'
FROM cruise_ships s WHERE s.name = 'Carnival Encounter'
ON CONFLICT (ship_id, arrival_date) DO UPDATE SET arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time;

INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, data_source)
SELECT s.id, '2026-10-25', '07:00', '2026-10-25', '16:30', 4180, 'cruisetimetables'
FROM cruise_ships s WHERE s.name = 'Quantum of the Seas'
ON CONFLICT (ship_id, arrival_date) DO UPDATE SET arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time;

INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, data_source)
SELECT s.id, '2026-10-29', '08:00', '2026-10-29', '18:00', 2610, 'cruisetimetables'
FROM cruise_ships s WHERE s.name = 'Grand Princess'
ON CONFLICT (ship_id, arrival_date) DO UPDATE SET arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time;

-- NOVEMBER 2026
INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, data_source)
SELECT s.id, '2026-11-02', '07:00', '2026-11-02', '16:30', 4180, 'cruisetimetables'
FROM cruise_ships s WHERE s.name = 'Quantum of the Seas'
ON CONFLICT (ship_id, arrival_date) DO UPDATE SET arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time;

INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, data_source)
SELECT s.id, '2026-11-03', '08:00', '2026-11-03', '17:00', 1250, 'cruisetimetables'
FROM cruise_ships s WHERE s.name = 'Oceania Riviera'
ON CONFLICT (ship_id, arrival_date) DO UPDATE SET arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time;

INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, data_source)
SELECT s.id, '2026-11-07', '07:00', '2026-11-07', '17:00', 4180, 'cruisetimetables'
FROM cruise_ships s WHERE s.name = 'Anthem of the Seas'
ON CONFLICT (ship_id, arrival_date) DO UPDATE SET arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time;

INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, data_source)
SELECT s.id, '2026-11-11', '08:00', '2026-11-11', '17:00', 2600, 'cruisetimetables'
FROM cruise_ships s WHERE s.name = 'Carnival Encounter'
ON CONFLICT (ship_id, arrival_date) DO UPDATE SET arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time;

INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, data_source)
SELECT s.id, '2026-11-17', '07:00', '2026-11-17', '18:00', 2852, 'cruisetimetables'
FROM cruise_ships s WHERE s.name = 'Celebrity Solstice'
ON CONFLICT (ship_id, arrival_date) DO UPDATE SET arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time;

INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, data_source)
SELECT s.id, '2026-11-17', '07:00', '2026-11-17', '17:00', 4180, 'cruisetimetables'
FROM cruise_ships s WHERE s.name = 'Quantum of the Seas'
ON CONFLICT (ship_id, arrival_date) DO UPDATE SET arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time;

INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, data_source)
SELECT s.id, '2026-11-21', '08:00', '2026-11-21', '17:00', 2640, 'cruisetimetables'
FROM cruise_ships s WHERE s.name = 'Carnival Adventure'
ON CONFLICT (ship_id, arrival_date) DO UPDATE SET arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time;

INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, data_source)
SELECT s.id, '2026-11-28', '07:00', '2026-11-28', '17:00', 4180, 'cruisetimetables'
FROM cruise_ships s WHERE s.name = 'Anthem of the Seas'
ON CONFLICT (ship_id, arrival_date) DO UPDATE SET arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time;

-- DECEMBER 2026
INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, data_source)
SELECT s.id, '2026-12-05', '07:00', '2026-12-05', '16:00', 1972, 'cruisetimetables'
FROM cruise_ships s WHERE s.name = 'Norwegian Spirit'
ON CONFLICT (ship_id, arrival_date) DO UPDATE SET arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time;

INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, data_source)
SELECT s.id, '2026-12-09', '07:00', '2026-12-09', '17:00', 4180, 'cruisetimetables'
FROM cruise_ships s WHERE s.name = 'Quantum of the Seas'
ON CONFLICT (ship_id, arrival_date) DO UPDATE SET arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time;

INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, data_source)
SELECT s.id, '2026-12-15', '08:00', '2026-12-15', '16:30', 4180, 'cruisetimetables'
FROM cruise_ships s WHERE s.name = 'Anthem of the Seas'
ON CONFLICT (ship_id, arrival_date) DO UPDATE SET arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time;

INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, data_source)
SELECT s.id, '2026-12-16', '08:00', '2026-12-16', '16:30', 4180, 'cruisetimetables'
FROM cruise_ships s WHERE s.name = 'Quantum of the Seas'
ON CONFLICT (ship_id, arrival_date) DO UPDATE SET arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time;

INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, data_source)
SELECT s.id, '2026-12-22', '08:00', '2026-12-22', '17:00', 2260, 'cruisetimetables'
FROM cruise_ships s WHERE s.name = 'Carnival Luminosa'
ON CONFLICT (ship_id, arrival_date) DO UPDATE SET arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time;

INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, data_source)
SELECT s.id, '2026-12-23', '08:00', '2026-12-23', '17:00', 2640, 'cruisetimetables'
FROM cruise_ships s WHERE s.name = 'Carnival Adventure'
ON CONFLICT (ship_id, arrival_date) DO UPDATE SET arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time;

INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, data_source)
SELECT s.id, '2026-12-24', '08:00', '2026-12-24', '17:00', 2600, 'cruisetimetables'
FROM cruise_ships s WHERE s.name = 'Carnival Encounter'
ON CONFLICT (ship_id, arrival_date) DO UPDATE SET arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time;

INSERT INTO cruise_schedules (ship_id, arrival_date, arrival_time, departure_date, departure_time, expected_passengers, data_source)
SELECT s.id, '2026-12-25', '08:00', '2026-12-25', '18:00', 2174, 'cruisetimetables'
FROM cruise_ships s WHERE s.name = 'AIDAsol'
ON CONFLICT (ship_id, arrival_date) DO UPDATE SET arrival_time = EXCLUDED.arrival_time, departure_time = EXCLUDED.departure_time;
