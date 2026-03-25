-- Add payment method columns to hotel_bookings table
ALTER TABLE hotel_bookings 
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cod',
ADD COLUMN IF NOT EXISTS payment_method_id uuid REFERENCES payment_methods(id);

-- Set existing bookings to COD
UPDATE hotel_bookings 
SET payment_method = 'cod' 
WHERE payment_method IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN hotel_bookings.payment_method IS 'Payment method type: cod, my_cash, m_vatu, polar_card, wallet';
COMMENT ON COLUMN hotel_bookings.payment_method_id IS 'Reference to saved payment method if used';