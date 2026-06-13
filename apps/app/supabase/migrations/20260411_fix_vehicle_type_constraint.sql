-- ============================================================================
-- Fix vehicle_type CHECK constraint on drivers table
-- Was: only 'car' and 'moto' allowed
-- Now: allows all vehicle types the app actually uses
-- ============================================================================

-- Drop the old constraint (if it exists)
ALTER TABLE drivers DROP CONSTRAINT IF EXISTS drivers_vehicle_type_check;

-- Add new constraint with all valid types
ALTER TABLE drivers ADD CONSTRAINT drivers_vehicle_type_check
  CHECK (vehicle_type IN ('car', 'suv', 'van', 'moto', 'bike', 'wheelchair_van', 'truck'));

-- Also ensure driver_vehicles has the right constraint
ALTER TABLE driver_vehicles DROP CONSTRAINT IF EXISTS driver_vehicles_vehicle_type_check;

ALTER TABLE driver_vehicles ADD CONSTRAINT driver_vehicles_vehicle_type_check
  CHECK (vehicle_type IN ('car', 'suv', 'van', 'moto', 'bike', 'wheelchair_van', 'truck'));
