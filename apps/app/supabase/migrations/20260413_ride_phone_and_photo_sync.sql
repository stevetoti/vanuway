-- Book-Now ride phone snapshot + driver photo sync
-- 1. Snapshot passenger phone on ride_bookings (prebook already has contact_phone)
ALTER TABLE ride_bookings
  ADD COLUMN IF NOT EXISTS passenger_phone text,
  ADD COLUMN IF NOT EXISTS driver_phone text;

-- 2. Backfill existing drivers.profile_photo_url from profiles.avatar_url
--    so drivers whose photo only lives on profiles show up everywhere.
UPDATE drivers d
SET profile_photo_url = p.avatar_url
FROM profiles p
WHERE d.user_id = p.id
  AND (d.profile_photo_url IS NULL OR d.profile_photo_url = '')
  AND p.avatar_url IS NOT NULL;

-- 3. Keep the two in sync going forward via trigger on profiles.avatar_url
CREATE OR REPLACE FUNCTION sync_driver_profile_photo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.avatar_url IS DISTINCT FROM OLD.avatar_url THEN
    UPDATE drivers SET profile_photo_url = NEW.avatar_url
    WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_driver_profile_photo ON profiles;
CREATE TRIGGER trg_sync_driver_profile_photo
AFTER UPDATE OF avatar_url ON profiles
FOR EACH ROW EXECUTE FUNCTION sync_driver_profile_photo();
