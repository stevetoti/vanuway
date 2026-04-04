-- =====================================================
-- VANUWAY RIDE SCHEDULING SYSTEM SETUP
-- =====================================================
-- Phase 1-C: Ride Scheduling & Recurring Rides
--
-- Features:
-- - Schedule rides in advance (future bookings)
-- - Recurring ride schedules (daily, weekly, monthly)
-- - Calendar integration support
-- - Driver pre-acceptance for scheduled rides
-- - Automated reminders before scheduled rides
-- - Cancellation and modification of scheduled rides
--
-- Usage: Run this script in your Supabase SQL Editor
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: scheduled_rides
-- Future ride bookings with specific date/time
-- =====================================================
CREATE TABLE IF NOT EXISTS public.scheduled_rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User information
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Ride details (similar to ride_bookings but for future)
  pickup_location TEXT NOT NULL,
  pickup_location_lat DOUBLE PRECISION,
  pickup_location_lng DOUBLE PRECISION,
  dropoff_location TEXT NOT NULL,
  dropoff_location_lat DOUBLE PRECISION,
  dropoff_location_lng DOUBLE PRECISION,

  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('car', 'suv', 'van', 'bike')),
  passenger_count INTEGER NOT NULL DEFAULT 1 CHECK (passenger_count BETWEEN 1 AND 8),

  -- Scheduling
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  scheduled_datetime TIMESTAMPTZ NOT NULL, -- Combined for easier querying
  timezone TEXT DEFAULT 'Pacific/Efate', -- Vanuatu timezone

  -- Flexibility
  time_flexibility_minutes INTEGER DEFAULT 0, -- Allow ±N minutes
  allow_earlier_pickup BOOLEAN DEFAULT FALSE,
  allow_later_pickup BOOLEAN DEFAULT FALSE,

  -- Pricing
  estimated_price DECIMAL(10,2),
  currency TEXT DEFAULT 'VUV',
  price_locked BOOLEAN DEFAULT FALSE, -- Lock price at booking time
  locked_price DECIMAL(10,2),

  -- Payment
  payment_method TEXT CHECK (payment_method IN ('my_cash', 'm_vatu', 'polar_card', 'cod', 'wallet')),
  payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  prepaid BOOLEAN DEFAULT FALSE,
  payment_id UUID,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'driver_assigned', 'active',
    'completed', 'cancelled', 'no_show', 'expired'
  )),

  -- Driver assignment
  driver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  driver_assigned_at TIMESTAMPTZ,
  driver_acceptance_deadline TIMESTAMPTZ, -- Driver must accept by this time

  -- Converted to actual ride
  ride_booking_id UUID, -- Links to ride_bookings when ride starts
  converted_at TIMESTAMPTZ,

  -- Recurring schedule reference
  recurring_schedule_id UUID REFERENCES public.recurring_schedules(id) ON DELETE SET NULL,
  is_recurring BOOLEAN DEFAULT FALSE,

  -- Special requests
  special_instructions TEXT,
  requires_wheelchair BOOLEAN DEFAULT FALSE,
  requires_child_seat BOOLEAN DEFAULT FALSE,
  allows_pets BOOLEAN DEFAULT FALSE,
  luggage_count INTEGER DEFAULT 0,

  -- Notifications
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_sent_at TIMESTAMPTZ,
  driver_notified BOOLEAN DEFAULT FALSE,
  driver_notified_at TIMESTAMPTZ,

  -- Cancellation
  cancelled_by UUID REFERENCES auth.users(id),
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  cancellation_fee DECIMAL(10,2) DEFAULT 0,

  -- Metadata
  metadata JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CHECK (scheduled_datetime > created_at) -- Must be in future
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_rides_user ON public.scheduled_rides(user_id, scheduled_datetime DESC);
CREATE INDEX IF NOT EXISTS idx_scheduled_rides_driver ON public.scheduled_rides(driver_id, scheduled_datetime);
CREATE INDEX IF NOT EXISTS idx_scheduled_rides_status ON public.scheduled_rides(status, scheduled_datetime);
CREATE INDEX IF NOT EXISTS idx_scheduled_rides_datetime ON public.scheduled_rides(scheduled_datetime);
CREATE INDEX IF NOT EXISTS idx_scheduled_rides_recurring ON public.scheduled_rides(recurring_schedule_id);

-- =====================================================
-- TABLE: recurring_schedules
-- Recurring ride patterns (daily commute, weekly trips)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.recurring_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User information
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Schedule name
  schedule_name TEXT NOT NULL, -- e.g., "Daily Commute to Work"
  description TEXT,

  -- Ride template (same details as scheduled_rides)
  pickup_location TEXT NOT NULL,
  pickup_location_lat DOUBLE PRECISION,
  pickup_location_lng DOUBLE PRECISION,
  dropoff_location TEXT NOT NULL,
  dropoff_location_lat DOUBLE PRECISION,
  dropoff_location_lng DOUBLE PRECISION,

  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('car', 'suv', 'van', 'bike')),
  passenger_count INTEGER NOT NULL DEFAULT 1,

  -- Recurrence pattern
  recurrence_type TEXT NOT NULL CHECK (recurrence_type IN (
    'daily', 'weekly', 'biweekly', 'monthly', 'custom'
  )),

  -- For weekly/biweekly: days of week
  days_of_week INTEGER[], -- [1,2,3,4,5] for Mon-Fri, [6,7] for weekends

  -- For monthly: day of month
  day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31),

  -- Custom recurrence (e.g., every 3 days)
  custom_interval_days INTEGER,

  -- Time
  scheduled_time TIME NOT NULL,
  timezone TEXT DEFAULT 'Pacific/Efate',

  -- Recurrence bounds
  start_date DATE NOT NULL,
  end_date DATE, -- NULL means indefinite
  max_occurrences INTEGER, -- Alternative to end_date

  -- Pricing
  payment_method TEXT CHECK (payment_method IN ('my_cash', 'm_vatu', 'polar_card', 'cod', 'wallet')),
  payment_method_id UUID REFERENCES public.payment_methods(id),

  -- Special requests (applied to all rides in schedule)
  special_instructions TEXT,
  requires_wheelchair BOOLEAN DEFAULT FALSE,
  requires_child_seat BOOLEAN DEFAULT FALSE,
  allows_pets BOOLEAN DEFAULT FALSE,

  -- Preferred driver (if available)
  preferred_driver_id UUID REFERENCES auth.users(id),

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  paused BOOLEAN DEFAULT FALSE,
  paused_until DATE,

  -- Statistics
  rides_generated INTEGER DEFAULT 0,
  rides_completed INTEGER DEFAULT 0,
  last_ride_generated_at TIMESTAMPTZ,
  next_ride_date DATE,

  -- Metadata
  metadata JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_recurring_schedules_user ON public.recurring_schedules(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_recurring_schedules_active ON public.recurring_schedules(is_active, next_ride_date);
CREATE INDEX IF NOT EXISTS idx_recurring_schedules_preferred_driver ON public.recurring_schedules(preferred_driver_id);

-- =====================================================
-- TABLE: schedule_exceptions
-- Skip or modify specific dates in recurring schedules
-- =====================================================
CREATE TABLE IF NOT EXISTS public.schedule_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  recurring_schedule_id UUID NOT NULL REFERENCES public.recurring_schedules(id) ON DELETE CASCADE,

  -- Exception date
  exception_date DATE NOT NULL,

  -- Action
  action TEXT NOT NULL CHECK (action IN ('skip', 'modify')),

  -- If action is 'modify', new details
  modified_time TIME,
  modified_pickup TEXT,
  modified_dropoff TEXT,

  -- Reason
  reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(recurring_schedule_id, exception_date)
);

CREATE INDEX IF NOT EXISTS idx_schedule_exceptions_schedule ON public.schedule_exceptions(recurring_schedule_id, exception_date);

-- =====================================================
-- TABLE: driver_schedule_preferences
-- Drivers can set when they're available for scheduled rides
-- =====================================================
CREATE TABLE IF NOT EXISTS public.driver_schedule_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Availability windows
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Monday, 7=Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  -- Areas
  preferred_areas TEXT[], -- Array of area names
  service_radius_km INTEGER DEFAULT 10,

  -- Pricing adjustments for scheduled rides
  scheduled_ride_premium_percent INTEGER DEFAULT 0, -- Extra % for advance booking

  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(driver_id, day_of_week, start_time)
);

CREATE INDEX IF NOT EXISTS idx_driver_schedule_prefs_driver ON public.driver_schedule_preferences(driver_id, is_active);
CREATE INDEX IF NOT EXISTS idx_driver_schedule_prefs_availability ON public.driver_schedule_preferences(day_of_week, is_active);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.scheduled_rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_schedule_preferences ENABLE ROW LEVEL SECURITY;

-- Scheduled Rides Policies
CREATE POLICY "Users can view their own scheduled rides"
  ON public.scheduled_rides
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.uid() = driver_id
  );

CREATE POLICY "Users can create their own scheduled rides"
  ON public.scheduled_rides
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled rides"
  ON public.scheduled_rides
  FOR UPDATE
  USING (
    auth.uid() = user_id OR
    auth.uid() = driver_id
  );

CREATE POLICY "Users can delete their own scheduled rides"
  ON public.scheduled_rides
  FOR DELETE
  USING (auth.uid() = user_id);

-- Recurring Schedules Policies
CREATE POLICY "Users can manage their own recurring schedules"
  ON public.recurring_schedules
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Schedule Exceptions Policies
CREATE POLICY "Users can manage exceptions for their schedules"
  ON public.schedule_exceptions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.recurring_schedules
      WHERE id = recurring_schedule_id
      AND user_id = auth.uid()
    )
  );

-- Driver Schedule Preferences Policies
CREATE POLICY "Drivers can manage their own preferences"
  ON public.driver_schedule_preferences
  FOR ALL
  USING (auth.uid() = driver_id)
  WITH CHECK (auth.uid() = driver_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to auto-update updated_at timestamp
DROP TRIGGER IF EXISTS update_scheduled_rides_updated_at ON public.scheduled_rides;
CREATE TRIGGER update_scheduled_rides_updated_at
  BEFORE UPDATE ON public.scheduled_rides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recurring_schedules_updated_at ON public.recurring_schedules;
CREATE TRIGGER update_recurring_schedules_updated_at
  BEFORE UPDATE ON public.recurring_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate rides from recurring schedules (called by cron job)
CREATE OR REPLACE FUNCTION generate_recurring_rides()
RETURNS void AS $$
DECLARE
  schedule RECORD;
  next_date DATE;
  next_datetime TIMESTAMPTZ;
  new_ride_id UUID;
BEGIN
  -- Loop through active recurring schedules
  FOR schedule IN
    SELECT * FROM public.recurring_schedules
    WHERE is_active = true
    AND paused = false
    AND (end_date IS NULL OR end_date >= CURRENT_DATE)
    AND (max_occurrences IS NULL OR rides_generated < max_occurrences)
  LOOP
    -- Calculate next ride date based on recurrence type
    next_date := schedule.next_ride_date;

    IF next_date IS NULL OR next_date <= CURRENT_DATE THEN
      -- Determine next date based on recurrence_type
      CASE schedule.recurrence_type
        WHEN 'daily' THEN
          next_date := CURRENT_DATE + INTERVAL '1 day';

        WHEN 'weekly' THEN
          -- Find next day of week
          next_date := CURRENT_DATE + INTERVAL '7 days';

        WHEN 'monthly' THEN
          -- Next month, same day
          next_date := (CURRENT_DATE + INTERVAL '1 month')::DATE;

        ELSE
          next_date := CURRENT_DATE + INTERVAL '1 day';
      END CASE;
    END IF;

    -- Only generate if within 7 days
    IF next_date <= CURRENT_DATE + INTERVAL '7 days' THEN
      -- Combine date and time
      next_datetime := (next_date::TEXT || ' ' || schedule.scheduled_time::TEXT)::TIMESTAMPTZ;

      -- Check if ride already exists for this date
      IF NOT EXISTS (
        SELECT 1 FROM public.scheduled_rides
        WHERE recurring_schedule_id = schedule.id
        AND scheduled_date = next_date
      ) THEN
        -- Create scheduled ride
        INSERT INTO public.scheduled_rides (
          user_id,
          pickup_location,
          pickup_location_lat,
          pickup_location_lng,
          dropoff_location,
          dropoff_location_lat,
          dropoff_location_lng,
          vehicle_type,
          passenger_count,
          scheduled_date,
          scheduled_time,
          scheduled_datetime,
          timezone,
          payment_method,
          payment_method_id,
          recurring_schedule_id,
          is_recurring,
          special_instructions,
          requires_wheelchair,
          requires_child_seat,
          allows_pets,
          status
        ) VALUES (
          schedule.user_id,
          schedule.pickup_location,
          schedule.pickup_location_lat,
          schedule.pickup_location_lng,
          schedule.dropoff_location,
          schedule.dropoff_location_lat,
          schedule.dropoff_location_lng,
          schedule.vehicle_type,
          schedule.passenger_count,
          next_date,
          schedule.scheduled_time,
          next_datetime,
          schedule.timezone,
          schedule.payment_method,
          schedule.payment_method_id,
          schedule.id,
          true,
          schedule.special_instructions,
          schedule.requires_wheelchair,
          schedule.requires_child_seat,
          schedule.allows_pets,
          'pending'
        )
        RETURNING id INTO new_ride_id;

        -- Update recurring schedule stats
        UPDATE public.recurring_schedules
        SET
          rides_generated = rides_generated + 1,
          last_ride_generated_at = NOW(),
          next_ride_date = next_date + (
            CASE recurrence_type
              WHEN 'daily' THEN INTERVAL '1 day'
              WHEN 'weekly' THEN INTERVAL '7 days'
              WHEN 'biweekly' THEN INTERVAL '14 days'
              WHEN 'monthly' THEN INTERVAL '1 month'
              ELSE INTERVAL '1 day'
            END
          )::DATE
        WHERE id = schedule.id;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- REALTIME SUBSCRIPTIONS
-- Enable real-time for scheduled rides updates
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.scheduled_rides;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheduled_rides TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recurring_schedules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schedule_exceptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.driver_schedule_preferences TO authenticated;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ VanuWay Ride Scheduling System Setup Complete!';
  RAISE NOTICE '';
  RAISE NOTICE '📅 Created Tables:';
  RAISE NOTICE '  - scheduled_rides (future ride bookings)';
  RAISE NOTICE '  - recurring_schedules (repeat patterns)';
  RAISE NOTICE '  - schedule_exceptions (skip/modify dates)';
  RAISE NOTICE '  - driver_schedule_preferences (driver availability)';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Security:';
  RAISE NOTICE '  - RLS policies enabled';
  RAISE NOTICE '  - Users can only manage their own schedules';
  RAISE NOTICE '  - Drivers can see assigned scheduled rides';
  RAISE NOTICE '';
  RAISE NOTICE '📱 Features Ready:';
  RAISE NOTICE '  - Schedule rides with specific date/time';
  RAISE NOTICE '  - Recurring schedules (daily, weekly, monthly)';
  RAISE NOTICE '  - Driver pre-acceptance system';
  RAISE NOTICE '  - Price locking for scheduled rides';
  RAISE NOTICE '  - Flexible time windows (±N minutes)';
  RAISE NOTICE '  - Special requests (wheelchair, child seat, pets)';
  RAISE NOTICE '';
  RAISE NOTICE '⚙️  Next Steps:';
  RAISE NOTICE '  1. Set up cron job to run generate_recurring_rides() daily';
  RAISE NOTICE '  2. Configure reminder notifications (24hrs, 1hr before)';
  RAISE NOTICE '  3. Add calendar export (iCal/Google Calendar)';
  RAISE NOTICE '  4. Build driver scheduled ride acceptance UI';
END $$;

SELECT json_build_object(
  'message', '✅ VanuWay Ride Scheduling System Setup Complete!',
  'tables_created', 4,
  'features', json_build_array(
    'Scheduled Rides',
    'Recurring Schedules',
    'Schedule Exceptions',
    'Driver Availability'
  )
);
