-- Fix existing approved drivers who have is_verified = false
UPDATE drivers 
SET is_verified = true, is_active = true
WHERE application_status = 'approved' 
  AND (is_verified = false OR is_verified IS NULL);