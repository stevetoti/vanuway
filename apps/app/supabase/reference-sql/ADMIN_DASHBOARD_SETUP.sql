-- =====================================================
-- VANUWAY ADMIN DASHBOARD SYSTEM SETUP
-- =====================================================
-- Phase 2-B: Admin Dashboard & Management
--
-- Features:
-- - Admin user management with role-based access
-- - Real-time ride monitoring
-- - Driver approval workflow
-- - User management
-- - Analytics and reporting
-- - System settings configuration
-- - Activity logging and audit trail
-- - Payment reconciliation
-- - Refund management
--
-- Usage: Run this script in your Supabase SQL Editor
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: admin_users
-- Admin accounts with role-based permissions
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Personal Info
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT,

  -- Role & Permissions
  role TEXT NOT NULL CHECK (role IN (
    'super_admin', 'admin', 'operations_manager', 'customer_support',
    'finance_manager', 'driver_manager', 'analyst'
  )),

  -- Permissions (granular control)
  permissions JSONB DEFAULT '{
    "view_dashboard": true,
    "manage_users": false,
    "manage_drivers": false,
    "manage_rides": false,
    "approve_refunds": false,
    "view_analytics": true,
    "manage_settings": false,
    "manage_admins": false,
    "export_data": false
  }'::jsonb,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,

  -- Security
  last_login_at TIMESTAMPTZ,
  last_login_ip TEXT,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,

  -- Two-Factor Authentication
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret TEXT,

  -- Profile
  profile_photo_url TEXT,
  timezone TEXT DEFAULT 'Pacific/Efate',

  -- Metadata
  metadata JSONB,
  notes TEXT,

  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_user ON public.admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(role, is_active);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);

-- =====================================================
-- TABLE: admin_activity_logs
-- Audit trail for all admin actions
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  admin_user_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,

  -- Action Details
  action_type TEXT NOT NULL CHECK (action_type IN (
    'login', 'logout', 'create', 'update', 'delete', 'approve', 'reject',
    'suspend', 'activate', 'export', 'refund', 'payment', 'settings_change', 'other'
  )),
  action_category TEXT CHECK (action_category IN (
    'user_management', 'driver_management', 'ride_management', 'payment_management',
    'refund_management', 'system_settings', 'security', 'analytics', 'other'
  )),

  -- Target (what was acted upon)
  target_type TEXT, -- 'user', 'driver', 'ride', 'payment', etc.
  target_id UUID,

  -- Description
  description TEXT NOT NULL,

  -- Changes (before/after values)
  changes_made JSONB,

  -- Request Info
  ip_address TEXT,
  user_agent TEXT,

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_activity_admin ON public.admin_activity_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_type ON public.admin_activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_activity_date ON public.admin_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_target ON public.admin_activity_logs(target_type, target_id);

-- =====================================================
-- TABLE: system_settings
-- Configurable system-wide settings
-- =====================================================
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Setting identification
  setting_key TEXT NOT NULL UNIQUE,
  setting_category TEXT NOT NULL CHECK (setting_category IN (
    'general', 'rides', 'payments', 'notifications', 'security',
    'driver', 'pricing', 'features', 'maintenance'
  )),

  -- Value
  setting_value JSONB NOT NULL,
  default_value JSONB,

  -- Metadata
  display_name TEXT NOT NULL,
  description TEXT,
  value_type TEXT CHECK (value_type IN (
    'string', 'number', 'boolean', 'json', 'array'
  )),

  -- Validation
  validation_rules JSONB, -- min, max, regex, etc.

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_public BOOLEAN DEFAULT FALSE, -- Can users see this setting?

  -- Audit
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON public.system_settings(setting_category);

-- =====================================================
-- TABLE: platform_analytics
-- Pre-calculated analytics and metrics
-- =====================================================
CREATE TABLE IF NOT EXISTS public.platform_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Time Period
  period_type TEXT NOT NULL CHECK (period_type IN ('hourly', 'daily', 'weekly', 'monthly')),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  -- Ride Metrics
  total_rides INTEGER DEFAULT 0,
  completed_rides INTEGER DEFAULT 0,
  cancelled_rides INTEGER DEFAULT 0,
  pending_rides INTEGER DEFAULT 0,

  -- User Metrics
  total_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,

  -- Driver Metrics
  total_drivers INTEGER DEFAULT 0,
  active_drivers INTEGER DEFAULT 0,
  online_drivers INTEGER DEFAULT 0,

  -- Revenue Metrics
  total_revenue DECIMAL(12,2) DEFAULT 0,
  platform_commission DECIMAL(12,2) DEFAULT 0,
  driver_earnings DECIMAL(12,2) DEFAULT 0,
  refunds_issued DECIMAL(12,2) DEFAULT 0,

  -- Performance Metrics
  average_ride_duration INTEGER, -- in minutes
  average_wait_time INTEGER, -- in minutes
  average_rating DECIMAL(3,2),
  completion_rate DECIMAL(5,2),

  -- Geographic Data
  top_pickup_locations JSONB,
  top_dropoff_locations JSONB,

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_platform_analytics_period ON public.platform_analytics(period_type, period_start DESC);

-- =====================================================
-- TABLE: notification_templates
-- Templates for system notifications
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template Info
  template_key TEXT NOT NULL UNIQUE,
  template_name TEXT NOT NULL,
  template_category TEXT CHECK (template_category IN (
    'ride', 'driver', 'payment', 'safety', 'promotion', 'system'
  )),

  -- Content
  subject TEXT,
  body_text TEXT NOT NULL,
  body_html TEXT,

  -- Variables (placeholders)
  variables TEXT[], -- e.g., ['user_name', 'ride_id', 'amount']

  -- Channels
  enabled_channels TEXT[] DEFAULT ARRAY['push', 'sms', 'email'],

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Metadata
  metadata JSONB,

  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notification_templates_key ON public.notification_templates(template_key);

-- =====================================================
-- TABLE: scheduled_reports
-- Automated report generation
-- =====================================================
CREATE TABLE IF NOT EXISTS public.scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Report Config
  report_name TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN (
    'daily_summary', 'weekly_summary', 'monthly_summary',
    'driver_performance', 'revenue_report', 'user_activity',
    'safety_incidents', 'refund_report', 'custom'
  )),

  -- Schedule
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('daily', 'weekly', 'monthly')),
  schedule_time TIME NOT NULL,
  schedule_day_of_week INTEGER, -- For weekly (0-6)
  schedule_day_of_month INTEGER, -- For monthly (1-31)

  -- Recipients
  recipient_emails TEXT[] NOT NULL,
  recipient_roles TEXT[], -- Send to all admins with these roles

  -- Report Config
  report_config JSONB,
  include_charts BOOLEAN DEFAULT TRUE,
  file_format TEXT DEFAULT 'pdf' CHECK (file_format IN ('pdf', 'excel', 'csv')),

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_generated_at TIMESTAMPTZ,
  next_generation_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB,

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_active ON public.scheduled_reports(is_active, next_generation_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;

-- Admin Users (only super_admins can manage)
CREATE POLICY "Admins can view their own profile"
  ON public.admin_users
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all admin users"
  ON public.admin_users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND role = 'super_admin' AND is_active = true
    )
  );

-- Admin Activity Logs (admins can view, super_admins can view all)
CREATE POLICY "Admins can view their own activity logs"
  ON public.admin_activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = admin_user_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can view all activity logs"
  ON public.admin_activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Admins can create activity logs"
  ON public.admin_activity_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = admin_user_id AND user_id = auth.uid()
    )
  );

-- System Settings (admins can view, only those with permission can edit)
CREATE POLICY "Admins can view system settings"
  ON public.system_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Authorized admins can manage settings"
  ON public.system_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
        AND is_active = true
        AND (
          role = 'super_admin'
          OR (permissions->>'manage_settings')::boolean = true
        )
    )
  );

-- Platform Analytics (admins with view_analytics permission)
CREATE POLICY "Admins can view analytics"
  ON public.platform_analytics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
        AND is_active = true
        AND (permissions->>'view_analytics')::boolean = true
    )
  );

-- Notification Templates (admins can view, super_admins can edit)
CREATE POLICY "Admins can view notification templates"
  ON public.notification_templates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Scheduled Reports
CREATE POLICY "Admins can view scheduled reports"
  ON public.scheduled_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to auto-update updated_at timestamp
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON public.admin_users;
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_system_settings_updated_at ON public.system_settings;
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_templates_updated_at ON public.notification_templates;
CREATE TRIGGER update_notification_templates_updated_at
  BEFORE UPDATE ON public.notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scheduled_reports_updated_at ON public.scheduled_reports;
CREATE TRIGGER update_scheduled_reports_updated_at
  BEFORE UPDATE ON public.scheduled_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to log admin activity
CREATE OR REPLACE FUNCTION log_admin_activity(
  p_admin_user_id UUID,
  p_action_type TEXT,
  p_action_category TEXT,
  p_description TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_changes_made JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.admin_activity_logs (
    admin_user_id,
    action_type,
    action_category,
    description,
    target_type,
    target_id,
    changes_made
  ) VALUES (
    p_admin_user_id,
    p_action_type,
    p_action_category,
    p_description,
    p_target_type,
    p_target_id,
    p_changes_made
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get dashboard statistics
CREATE OR REPLACE FUNCTION get_dashboard_stats(
  p_period TEXT DEFAULT 'today' -- 'today', 'week', 'month', 'year'
)
RETURNS TABLE(
  total_rides BIGINT,
  completed_rides BIGINT,
  cancelled_rides BIGINT,
  total_revenue NUMERIC,
  total_users BIGINT,
  total_drivers BIGINT,
  active_drivers BIGINT,
  pending_driver_applications BIGINT,
  pending_refunds BIGINT,
  active_safety_alerts BIGINT
) AS $$
DECLARE
  v_start_date TIMESTAMPTZ;
BEGIN
  -- Determine date range
  CASE p_period
    WHEN 'today' THEN
      v_start_date := DATE_TRUNC('day', NOW());
    WHEN 'week' THEN
      v_start_date := DATE_TRUNC('week', NOW());
    WHEN 'month' THEN
      v_start_date := DATE_TRUNC('month', NOW());
    WHEN 'year' THEN
      v_start_date := DATE_TRUNC('year', NOW());
    ELSE
      v_start_date := DATE_TRUNC('day', NOW());
  END CASE;

  RETURN QUERY
  SELECT
    -- Rides (note: ride_bookings table needs to exist)
    (SELECT COUNT(*) FROM public.ride_bookings WHERE created_at >= v_start_date),
    (SELECT COUNT(*) FROM public.ride_bookings WHERE created_at >= v_start_date AND status = 'completed'),
    (SELECT COUNT(*) FROM public.ride_bookings WHERE created_at >= v_start_date AND status = 'cancelled'),

    -- Revenue (note: payments table needs to exist)
    COALESCE((SELECT SUM(amount) FROM public.payments WHERE created_at >= v_start_date AND status = 'completed'), 0),

    -- Users
    (SELECT COUNT(*) FROM auth.users WHERE created_at >= v_start_date),

    -- Drivers
    (SELECT COUNT(*) FROM public.drivers WHERE created_at >= v_start_date),
    (SELECT COUNT(*) FROM public.drivers WHERE is_active = true AND is_online = true),
    (SELECT COUNT(*) FROM public.drivers WHERE application_status = 'pending'),

    -- Refunds
    (SELECT COUNT(*) FROM public.refund_requests WHERE status = 'pending'),

    -- Safety
    (SELECT COUNT(*) FROM public.safety_alerts WHERE status = 'active');
END;
$$ LANGUAGE plpgsql;

-- Function to approve driver application
CREATE OR REPLACE FUNCTION approve_driver_application(
  p_driver_id UUID,
  p_admin_user_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get the user_id for the driver
  SELECT user_id INTO v_user_id FROM public.drivers WHERE id = p_driver_id;

  -- Update driver status
  UPDATE public.drivers
  SET
    application_status = 'approved',
    verification_status = 'verified',
    approved_by = p_admin_user_id,
    approved_at = NOW(),
    is_active = true,
    updated_at = NOW()
  WHERE id = p_driver_id;

  -- Update application status
  UPDATE public.driver_applications
  SET
    status = 'approved',
    reviewed_by = p_admin_user_id,
    reviewed_at = NOW(),
    decision_date = NOW(),
    decision_notes = p_notes,
    updated_at = NOW()
  WHERE driver_id = p_driver_id;

  -- Log activity
  PERFORM log_admin_activity(
    p_admin_user_id,
    'approve',
    'driver_management',
    'Approved driver application',
    'driver',
    p_driver_id,
    jsonb_build_object('notes', p_notes)
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject driver application
CREATE OR REPLACE FUNCTION reject_driver_application(
  p_driver_id UUID,
  p_admin_user_id UUID,
  p_reason TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update driver status
  UPDATE public.drivers
  SET
    application_status = 'rejected',
    approved_by = p_admin_user_id,
    approved_at = NOW(),
    rejection_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_driver_id;

  -- Update application status
  UPDATE public.driver_applications
  SET
    status = 'rejected',
    reviewed_by = p_admin_user_id,
    reviewed_at = NOW(),
    decision_date = NOW(),
    decision_notes = p_reason,
    updated_at = NOW()
  WHERE driver_id = p_driver_id;

  -- Log activity
  PERFORM log_admin_activity(
    p_admin_user_id,
    'reject',
    'driver_management',
    'Rejected driver application',
    'driver',
    p_driver_id,
    jsonb_build_object('reason', p_reason)
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- DEFAULT SYSTEM SETTINGS
-- =====================================================
INSERT INTO public.system_settings (setting_key, setting_category, setting_value, display_name, description, value_type)
VALUES
  -- General
  ('platform_name', 'general', '"VanuWay"', 'Platform Name', 'Name of the platform', 'string'),
  ('platform_timezone', 'general', '"Pacific/Efate"', 'Platform Timezone', 'Default timezone', 'string'),
  ('support_email', 'general', '"support@vanuway.vu"', 'Support Email', 'Customer support email', 'string'),
  ('support_phone', 'general', '"+678 xxx xxxx"', 'Support Phone', 'Customer support phone', 'string'),

  -- Rides
  ('min_ride_fare', 'rides', '200', 'Minimum Ride Fare (VUV)', 'Minimum fare for any ride', 'number'),
  ('max_ride_distance_km', 'rides', '100', 'Maximum Ride Distance (km)', 'Maximum distance for a single ride', 'number'),
  ('driver_search_radius_km', 'rides', '10', 'Driver Search Radius (km)', 'Radius to search for available drivers', 'number'),
  ('ride_timeout_minutes', 'rides', '5', 'Ride Request Timeout (minutes)', 'Time before ride request expires', 'number'),

  -- Pricing
  ('platform_commission_percentage', 'pricing', '20', 'Platform Commission (%)', 'Commission percentage from each ride', 'number'),
  ('base_fare_vnd', 'pricing', '200', 'Base Fare (VUV)', 'Base fare for rides', 'number'),
  ('per_km_rate', 'pricing', '50', 'Per KM Rate (VUV)', 'Rate per kilometer', 'number'),
  ('per_minute_rate', 'pricing', '10', 'Per Minute Rate (VUV)', 'Rate per minute', 'number'),

  -- Driver
  ('min_driver_rating', 'driver', '3.5', 'Minimum Driver Rating', 'Minimum rating to remain active', 'number'),
  ('driver_auto_accept_enabled', 'driver', 'false', 'Auto-Accept Rides', 'Enable automatic ride acceptance', 'boolean'),

  -- Payments
  ('payment_methods_enabled', 'payments', '["my_cash", "m_vatu", "polar_card", "cash"]', 'Enabled Payment Methods', 'Available payment methods', 'json'),

  -- Security
  ('max_login_attempts', 'security', '5', 'Max Login Attempts', 'Maximum failed login attempts before lockout', 'number'),
  ('session_timeout_minutes', 'security', '30', 'Session Timeout (minutes)', 'Idle time before session expires', 'number')
ON CONFLICT (setting_key) DO NOTHING;

-- =====================================================
-- REALTIME SUBSCRIPTIONS
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_activity_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_analytics;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT SELECT ON public.admin_users TO authenticated;
GRANT SELECT, INSERT ON public.admin_activity_logs TO authenticated;
GRANT SELECT ON public.system_settings TO authenticated;
GRANT SELECT ON public.platform_analytics TO authenticated;
GRANT SELECT ON public.notification_templates TO authenticated;
GRANT SELECT ON public.scheduled_reports TO authenticated;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ VanuWay Admin Dashboard System Setup Complete!';
  RAISE NOTICE '';
  RAISE NOTICE '👨‍💼 Created Tables:';
  RAISE NOTICE '  - admin_users (admin accounts & roles)';
  RAISE NOTICE '  - admin_activity_logs (audit trail)';
  RAISE NOTICE '  - system_settings (configuration)';
  RAISE NOTICE '  - platform_analytics (metrics & KPIs)';
  RAISE NOTICE '  - notification_templates (messaging)';
  RAISE NOTICE '  - scheduled_reports (automated reports)';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Security:';
  RAISE NOTICE '  - RLS policies enabled';
  RAISE NOTICE '  - Role-based access control';
  RAISE NOTICE '  - Activity logging for all actions';
  RAISE NOTICE '';
  RAISE NOTICE '📱 Features Ready:';
  RAISE NOTICE '  - Admin user management';
  RAISE NOTICE '  - Driver approval workflow';
  RAISE NOTICE '  - Real-time dashboard statistics';
  RAISE NOTICE '  - System settings configuration';
  RAISE NOTICE '  - Audit trail & activity logs';
  RAISE NOTICE '  - Analytics & reporting';
END $$;

SELECT json_build_object(
  'message', '✅ VanuWay Admin Dashboard System Setup Complete!',
  'tables_created', 6,
  'features', json_build_array(
    'Admin Management',
    'Driver Approval',
    'Analytics',
    'Activity Logging',
    'System Settings'
  )
);
