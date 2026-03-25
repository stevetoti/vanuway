-- Add missing columns to ride_bookings table for enhanced functionality

-- Add service_type column to differentiate between VanuCar and VanuRide
ALTER TABLE ride_bookings 
ADD COLUMN IF NOT EXISTS service_type text 
CHECK (service_type IN ('vanucar', 'vanuride'));

-- Add payment_method_id for tracking payment methods
ALTER TABLE ride_bookings 
ADD COLUMN IF NOT EXISTS payment_method_id uuid 
REFERENCES payment_methods(id);

-- Add payment_method_type for quick reference without joining
ALTER TABLE ride_bookings 
ADD COLUMN IF NOT EXISTS payment_method_type text;

-- Add category column for special ride types (regular, airport, scheduled)
ALTER TABLE ride_bookings 
ADD COLUMN IF NOT EXISTS category text 
DEFAULT 'regular'
CHECK (category IN ('regular', 'airport', 'scheduled'));