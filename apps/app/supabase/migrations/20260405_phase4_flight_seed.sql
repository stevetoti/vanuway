-- ============================================================================
-- SEED DATA: Flights for April 2026
-- ============================================================================

-- Sample flights (next 2 weeks from Bauerfield Airport VLI)
INSERT INTO flights (airline_id, flight_number, origin_airport_code, origin_city, origin_country, scheduled_arrival, aircraft_type, status, is_international, estimated_passengers) VALUES
-- Today (April 5)
((SELECT id FROM airlines WHERE code = 'NF'), 'NF080', 'BNE', 'Brisbane', 'Australia', '2026-04-05 10:30:00+11', 'Boeing 737-800', 'on_time', true, 160),
((SELECT id FROM airlines WHERE code = 'FJ'), 'FJ261', 'NAN', 'Nadi', 'Fiji', '2026-04-05 14:00:00+11', 'Airbus A330', 'scheduled', true, 200),
-- April 6
((SELECT id FROM airlines WHERE code = 'NF'), 'NF050', 'SYD', 'Sydney', 'Australia', '2026-04-06 11:00:00+11', 'Boeing 737-800', 'scheduled', true, 160),
((SELECT id FROM airlines WHERE code = 'NZ'), 'NZ960', 'AKL', 'Auckland', 'New Zealand', '2026-04-06 13:45:00+11', 'Airbus A320', 'scheduled', true, 150),
-- April 7
((SELECT id FROM airlines WHERE code = 'NF'), 'NF080', 'BNE', 'Brisbane', 'Australia', '2026-04-07 10:30:00+11', 'Boeing 737-800', 'scheduled', true, 160),
((SELECT id FROM airlines WHERE code = 'IE'), 'IE702', 'HIR', 'Honiara', 'Solomon Islands', '2026-04-07 09:00:00+11', 'DHC-8 Dash 8', 'scheduled', true, 36),
-- April 8
((SELECT id FROM airlines WHERE code = 'NF'), 'NF050', 'SYD', 'Sydney', 'Australia', '2026-04-08 11:00:00+11', 'Boeing 737-800', 'scheduled', true, 160),
((SELECT id FROM airlines WHERE code = 'QF'), 'QF130', 'SYD', 'Sydney', 'Australia', '2026-04-08 15:30:00+11', 'Boeing 737-800', 'scheduled', true, 174),
((SELECT id FROM airlines WHERE code = 'FJ'), 'FJ261', 'NAN', 'Nadi', 'Fiji', '2026-04-08 14:00:00+11', 'Airbus A330', 'scheduled', true, 200),
-- April 9
((SELECT id FROM airlines WHERE code = 'NF'), 'NF080', 'BNE', 'Brisbane', 'Australia', '2026-04-09 10:30:00+11', 'Boeing 737-800', 'scheduled', true, 160),
((SELECT id FROM airlines WHERE code = 'NZ'), 'NZ960', 'AKL', 'Auckland', 'New Zealand', '2026-04-09 13:45:00+11', 'Airbus A320', 'scheduled', true, 150),
-- April 10 (same day as Pacific Adventure cruise!)
((SELECT id FROM airlines WHERE code = 'NF'), 'NF050', 'SYD', 'Sydney', 'Australia', '2026-04-10 11:00:00+11', 'Boeing 737-800', 'scheduled', true, 160),
((SELECT id FROM airlines WHERE code = 'FJ'), 'FJ261', 'NAN', 'Nadi', 'Fiji', '2026-04-10 14:00:00+11', 'Airbus A330', 'scheduled', true, 200),
((SELECT id FROM airlines WHERE code = 'QF'), 'QF130', 'SYD', 'Sydney', 'Australia', '2026-04-10 15:30:00+11', 'Boeing 737-800', 'scheduled', true, 174),
-- April 11
((SELECT id FROM airlines WHERE code = 'NF'), 'NF080', 'BNE', 'Brisbane', 'Australia', '2026-04-11 10:30:00+11', 'Boeing 737-800', 'scheduled', true, 160),
((SELECT id FROM airlines WHERE code = 'IE'), 'IE702', 'HIR', 'Honiara', 'Solomon Islands', '2026-04-11 09:00:00+11', 'DHC-8 Dash 8', 'scheduled', true, 36),
-- April 12
((SELECT id FROM airlines WHERE code = 'NF'), 'NF050', 'SYD', 'Sydney', 'Australia', '2026-04-12 11:00:00+11', 'Boeing 737-800', 'scheduled', true, 160),
((SELECT id FROM airlines WHERE code = 'NZ'), 'NZ960', 'AKL', 'Auckland', 'New Zealand', '2026-04-12 13:45:00+11', 'Airbus A320', 'scheduled', true, 150),
((SELECT id FROM airlines WHERE code = 'FJ'), 'FJ261', 'NAN', 'Nadi', 'Fiji', '2026-04-12 14:00:00+11', 'Airbus A330', 'scheduled', true, 200);
