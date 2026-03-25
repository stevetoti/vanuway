-- Fix driver availability for testing
-- Update drivers to be properly available for ride assignment

UPDATE public.drivers 
SET 
  is_available = true,
  is_online = true,
  status = 'available',
  current_lat = COALESCE(current_lat, -17.7334),
  current_lng = COALESCE(current_lng, 168.3220)
WHERE status != 'busy' OR status IS NULL;

-- Ensure at least one car driver is available
UPDATE public.drivers 
SET 
  is_available = true,
  is_online = true,
  status = 'available',
  current_lat = -17.7334,
  current_lng = 168.3220
WHERE id = (
  SELECT id FROM public.drivers 
  WHERE vehicle_type = 'car'
  ORDER BY created_at DESC
  LIMIT 1
);