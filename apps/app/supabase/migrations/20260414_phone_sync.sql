-- Ensure passenger + driver phones are reachable wherever the app reads them.

-- 1. One-time backfill: copy driver onboarding phone into profiles.phone
--    where the profile phone is missing. drivers.phone_number is captured
--    at onboarding and is the authoritative source for drivers.
UPDATE profiles p
SET phone = d.phone_number
FROM drivers d
WHERE d.user_id = p.id
  AND d.phone_number IS NOT NULL AND d.phone_number <> ''
  AND (p.phone IS NULL OR p.phone = '');

-- 2. Keep them in sync going forward.
CREATE OR REPLACE FUNCTION sync_driver_phone_to_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.phone_number IS NOT NULL AND NEW.phone_number <> ''
     AND NEW.phone_number IS DISTINCT FROM OLD.phone_number THEN
    UPDATE profiles
    SET phone = NEW.phone_number
    WHERE id = NEW.user_id
      AND (phone IS NULL OR phone = '' OR phone = '+678');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_driver_phone_to_profile ON drivers;
CREATE TRIGGER trg_sync_driver_phone_to_profile
AFTER INSERT OR UPDATE OF phone_number ON drivers
FOR EACH ROW EXECUTE FUNCTION sync_driver_phone_to_profile();

-- 3. Backfill ride_bookings.passenger_phone for existing rides that predate
--    the column / snapshot logic, so driver "Call passenger" works for them.
UPDATE ride_bookings rb
SET passenger_phone = p.phone
FROM profiles p
WHERE rb.user_id = p.id
  AND (rb.passenger_phone IS NULL OR rb.passenger_phone = '')
  AND p.phone IS NOT NULL AND p.phone <> '';
