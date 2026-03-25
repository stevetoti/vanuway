import { supabase } from '@/integrations/supabase/client';

export type AdminRole =
  | 'super_admin'
  | 'admin'
  | 'operations_manager'
  | 'customer_support'
  | 'finance_manager'
  | 'driver_manager'
  | 'analyst';

export interface AdminUser {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: AdminRole;
  permissions: {
    view_dashboard: boolean;
    manage_users: boolean;
    manage_drivers: boolean;
    manage_rides: boolean;
    approve_refunds: boolean;
    view_analytics: boolean;
    manage_settings: boolean;
    manage_admins: boolean;
    export_data: boolean;
  };
  is_active: boolean;
  created_at: string;
}

export interface DashboardStats {
  total_rides: number;
  completed_rides: number;
  cancelled_rides: number;
  total_revenue: number;
  total_users: number;
  total_drivers: number;
  active_drivers: number;
  pending_driver_applications: number;
  pending_refunds: number;
  active_safety_alerts: number;
}

export interface ActivityLog {
  id: string;
  admin_user_id: string;
  action_type: string;
  action_category: string;
  description: string;
  target_type?: string;
  target_id?: string;
  changes_made?: any;
  created_at: string;
}

/**
 * Check if current user is an admin
 */
export const isAdmin = async (userId: string) => {
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, role, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { success: true, isAdmin: false, data: null };
    }
    console.error('Error checking admin status:', error);
    return { success: false, isAdmin: false, data: null };
  }

  return { success: true, isAdmin: true, data };
};

/**
 * Get admin user profile
 */
export const getAdminProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { success: true, data: null };
    }
    console.error('Error fetching admin profile:', error);
    return { success: false, error: error.message, data: null };
  }

  return { success: true, data: data as unknown as AdminUser };
};

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async (period: 'today' | 'week' | 'month' | 'year' = 'today') => {
  try {
    const { data, error } = await supabase.rpc('get_dashboard_stats', {
      p_period: period,
    });

    if (error) {
      console.error('Error fetching dashboard stats:', error);
      return { success: false, error: error.message, data: null };
    }

    return { success: true, data: data[0] as DashboardStats };
  } catch (error: any) {
    console.error('Error in getDashboardStats:', error);
    return { success: false, error: error.message, data: null };
  }
};

/**
 * Get pending driver applications
 */
export const getPendingDriverApplications = async () => {
  const { data, error } = await supabase
    .from('drivers')
    .select(
      `
      *,
      driver_applications (
        id,
        status,
        current_step,
        submitted_at
      ),
      driver_vehicles (
        id,
        vehicle_type,
        make,
        model,
        year
      )
    `
    )
    .eq('application_status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending applications:', error);
    return { success: false, error: error.message, data: [] };
  }

  return { success: true, data };
};

/**
 * Get all drivers with filters
 */
export const getAllDrivers = async (filters?: {
  status?: string;
  isOnline?: boolean;
  isActive?: boolean;
  searchQuery?: string;
}) => {
  let query = supabase.from('drivers').select(`
      *,
      driver_vehicles (
        id,
        vehicle_type,
        make,
        model,
        is_primary
      )
    `);

  if (filters?.status) {
    query = query.eq('application_status', filters.status);
  }
  if (filters?.isOnline !== undefined) {
    query = query.eq('is_online', filters.isOnline);
  }
  if (filters?.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive);
  }
  if (filters?.searchQuery) {
    query = query.or(
      `first_name.ilike.%${filters.searchQuery}%,last_name.ilike.%${filters.searchQuery}%,phone_number.ilike.%${filters.searchQuery}%`
    );
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching drivers:', error);
    return { success: false, error: error.message, data: [] };
  }

  return { success: true, data };
};

/**
 * Get driver details with full information
 */
export const getDriverDetails = async (driverId: string) => {
  const { data, error } = await supabase
    .from('drivers')
    .select(
      `
      *,
      driver_applications (*),
      driver_vehicles (*),
      driver_documents (*),
      driver_earnings (
        id,
        total_fare,
        driver_earning,
        payment_status,
        earned_at
      )
    `
    )
    .eq('id', driverId)
    .single();

  if (error) {
    console.error('Error fetching driver details:', error);
    return { success: false, error: error.message, data: null };
  }

  return { success: true, data };
};

/**
 * Approve driver application
 */
export const approveDriverApplication = async (params: {
  driverId: string;
  adminUserId: string;
  notes?: string;
}) => {
  try {
    const { data, error } = await supabase.rpc('approve_driver_application', {
      p_driver_id: params.driverId,
      p_admin_user_id: params.adminUserId,
      p_notes: params.notes || null,
    });

    if (error) {
      console.error('Error approving driver:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data,
      message: 'Driver application approved successfully',
    };
  } catch (error: any) {
    console.error('Error in approveDriverApplication:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Reject driver application
 */
export const rejectDriverApplication = async (params: {
  driverId: string;
  adminUserId: string;
  reason: string;
}) => {
  try {
    const { data, error } = await supabase.rpc('reject_driver_application', {
      p_driver_id: params.driverId,
      p_admin_user_id: params.adminUserId,
      p_reason: params.reason,
    });

    if (error) {
      console.error('Error rejecting driver:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data,
      message: 'Driver application rejected',
    };
  } catch (error: any) {
    console.error('Error in rejectDriverApplication:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Suspend driver account
 */
export const suspendDriver = async (params: {
  driverId: string;
  adminUserId: string;
  reason: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('drivers')
      .update({
        application_status: 'suspended',
        is_active: false,
        is_online: false,
        is_available: false,
      })
      .eq('id', params.driverId)
      .select()
      .single();

    if (error) {
      console.error('Error suspending driver:', error);
      return { success: false, error: error.message };
    }

    // Log activity
    await logAdminActivity({
      adminUserId: params.adminUserId,
      actionType: 'suspend',
      actionCategory: 'driver_management',
      description: `Suspended driver account: ${params.reason}`,
      targetType: 'driver',
      targetId: params.driverId,
    });

    return {
      success: true,
      data,
      message: 'Driver account suspended',
    };
  } catch (error: any) {
    console.error('Error in suspendDriver:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Activate driver account
 */
export const activateDriver = async (params: {
  driverId: string;
  adminUserId: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('drivers')
      .update({
        application_status: 'approved',
        is_active: true,
      })
      .eq('id', params.driverId)
      .select()
      .single();

    if (error) {
      console.error('Error activating driver:', error);
      return { success: false, error: error.message };
    }

    // Log activity
    await logAdminActivity({
      adminUserId: params.adminUserId,
      actionType: 'activate',
      actionCategory: 'driver_management',
      description: 'Activated driver account',
      targetType: 'driver',
      targetId: params.driverId,
    });

    return {
      success: true,
      data,
      message: 'Driver account activated',
    };
  } catch (error: any) {
    console.error('Error in activateDriver:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all users with filters
 */
export const getAllUsers = async (filters?: {
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
}) => {
  // Note: Using profiles table as users table doesn't exist in current schema
  let query = supabase.from('profiles').select('*');

  if (filters?.searchQuery) {
    query = query.or(
      `full_name.ilike.%${filters.searchQuery}%`
    );
  }
  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
    return { success: false, error: error.message, data: [] };
  }

  return { success: true, data };
};

/**
 * Get pending refund requests
 */
export const getPendingRefunds = async () => {
  const { data, error } = await supabase
    .from('refund_requests')
    .select(
      `
      *,
      users:user_id (
        id,
        email,
        phone
      )
    `
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending refunds:', error);
    return { success: false, error: error.message, data: [] };
  }

  return { success: true, data };
};

/**
 * Approve refund request
 */
export const approveRefund = async (params: {
  refundId: string;
  adminUserId: string;
  approvedAmount?: number;
  notes?: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('refund_requests')
      .update({
        status: 'approved',
        approved_amount: params.approvedAmount,
        reviewed_by: params.adminUserId,
        reviewed_at: new Date().toISOString(),
        review_notes: params.notes,
      })
      .eq('id', params.refundId)
      .select()
      .single();

    if (error) {
      console.error('Error approving refund:', error);
      return { success: false, error: error.message };
    }

    // Log activity
    await logAdminActivity({
      adminUserId: params.adminUserId,
      actionType: 'approve',
      actionCategory: 'refund_management',
      description: `Approved refund request: VUV ${params.approvedAmount}`,
      targetType: 'refund',
      targetId: params.refundId,
    });

    return {
      success: true,
      data,
      message: 'Refund approved successfully',
    };
  } catch (error: any) {
    console.error('Error in approveRefund:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Reject refund request
 */
export const rejectRefund = async (params: {
  refundId: string;
  adminUserId: string;
  reason: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('refund_requests')
      .update({
        status: 'rejected',
        reviewed_by: params.adminUserId,
        reviewed_at: new Date().toISOString(),
        review_notes: params.reason,
      })
      .eq('id', params.refundId)
      .select()
      .single();

    if (error) {
      console.error('Error rejecting refund:', error);
      return { success: false, error: error.message };
    }

    // Log activity
    await logAdminActivity({
      adminUserId: params.adminUserId,
      actionType: 'reject',
      actionCategory: 'refund_management',
      description: `Rejected refund request: ${params.reason}`,
      targetType: 'refund',
      targetId: params.refundId,
    });

    return {
      success: true,
      data,
      message: 'Refund rejected',
    };
  } catch (error: any) {
    console.error('Error in rejectRefund:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get active safety alerts
 */
export const getActiveSafetyAlerts = async () => {
  const { data, error } = await supabase
    .from('safety_alerts')
    .select(
      `
      *,
      users:user_id (
        id,
        email,
        phone
      )
    `
    )
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching safety alerts:', error);
    return { success: false, error: error.message, data: [] };
  }

  return { success: true, data };
};

/**
 * Acknowledge safety alert
 */
export const acknowledgeSafetyAlert = async (params: {
  alertId: string;
  adminUserId: string;
  notes?: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('safety_alerts')
      .update({
        status: 'acknowledged',
        acknowledged_by: params.adminUserId,
        acknowledged_at: new Date().toISOString(),
        resolution_notes: params.notes,
      })
      .eq('id', params.alertId)
      .select()
      .single();

    if (error) {
      console.error('Error acknowledging alert:', error);
      return { success: false, error: error.message };
    }

    // Log activity
    await logAdminActivity({
      adminUserId: params.adminUserId,
      actionType: 'update',
      actionCategory: 'safety',
      description: 'Acknowledged safety alert',
      targetType: 'safety_alert',
      targetId: params.alertId,
    });

    return {
      success: true,
      data,
      message: 'Safety alert acknowledged',
    };
  } catch (error: any) {
    console.error('Error in acknowledgeSafetyAlert:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Log admin activity
 */
export const logAdminActivity = async (params: {
  adminUserId: string;
  actionType: string;
  actionCategory: string;
  description: string;
  targetType?: string;
  targetId?: string;
  changesMade?: any;
}) => {
  try {
    const { data, error } = await supabase.rpc('log_admin_activity', {
      p_admin_user_id: params.adminUserId,
      p_action_type: params.actionType,
      p_action_category: params.actionCategory,
      p_description: params.description,
      p_target_type: params.targetType || null,
      p_target_id: params.targetId || null,
      p_changes_made: params.changesMade || null,
    });

    if (error) {
      console.error('Error logging admin activity:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error in logAdminActivity:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get admin activity logs
 */
export const getAdminActivityLogs = async (params?: {
  adminUserId?: string;
  actionType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) => {
  let query = supabase
    .from('admin_activity_logs')
    .select(
      `
      *,
      admin_users (
        first_name,
        last_name,
        email
      )
    `
    );

  if (params?.adminUserId) {
    query = query.eq('admin_user_id', params.adminUserId);
  }
  if (params?.actionType) {
    query = query.eq('action_type', params.actionType);
  }
  if (params?.startDate) {
    query = query.gte('created_at', params.startDate);
  }
  if (params?.endDate) {
    query = query.lte('created_at', params.endDate);
  }

  query = query.order('created_at', { ascending: false });

  if (params?.limit) {
    query = query.limit(params.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching activity logs:', error);
    return { success: false, error: error.message, data: [] };
  }

  return { success: true, data: data as ActivityLog[] };
};

/**
 * Get system settings
 */
export const getSystemSettings = async (category?: string) => {
  let query = supabase.from('system_settings').select('*');

  if (category) {
    query = query.eq('setting_category', category);
  }

  const { data, error } = await query.order('setting_category');

  if (error) {
    console.error('Error fetching system settings:', error);
    return { success: false, error: error.message, data: [] };
  }

  return { success: true, data };
};

/**
 * Update system setting
 */
export const updateSystemSetting = async (params: {
  settingKey: string;
  settingValue: any;
  adminUserId: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .update({
        setting_value: params.settingValue,
        updated_by: params.adminUserId,
        updated_at: new Date().toISOString(),
      })
      .eq('setting_key', params.settingKey)
      .select()
      .single();

    if (error) {
      console.error('Error updating system setting:', error);
      return { success: false, error: error.message };
    }

    // Log activity
    await logAdminActivity({
      adminUserId: params.adminUserId,
      actionType: 'settings_change',
      actionCategory: 'system_settings',
      description: `Updated setting: ${params.settingKey}`,
      changesMade: { settingKey: params.settingKey, newValue: params.settingValue },
    });

    return {
      success: true,
      data,
      message: 'System setting updated successfully',
    };
  } catch (error: any) {
    console.error('Error in updateSystemSetting:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get platform analytics
 */
export const getPlatformAnalytics = async (params?: {
  periodType?: 'hourly' | 'daily' | 'weekly' | 'monthly';
  startDate?: string;
  endDate?: string;
}) => {
  let query = supabase.from('platform_analytics').select('*');

  if (params?.periodType) {
    query = query.eq('period_type', params.periodType);
  }
  if (params?.startDate) {
    query = query.gte('period_start', params.startDate);
  }
  if (params?.endDate) {
    query = query.lte('period_end', params.endDate);
  }

  const { data, error } = await query.order('period_start', { ascending: false });

  if (error) {
    console.error('Error fetching platform analytics:', error);
    return { success: false, error: error.message, data: [] };
  }

  return { success: true, data };
};
