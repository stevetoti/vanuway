import { supabase } from '@/integrations/supabase/client';

export type CallStatus =
  | 'initiated'
  | 'ringing'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'missed'
  | 'rejected'
  | 'cancelled'
  | 'no_answer';

export type CallType = 'voip' | 'pstn' | 'emergency';
export type CallerType = 'passenger' | 'driver' | 'support';
export type CallProvider = 'twilio' | 'vonage' | 'agora' | 'internal';

export interface CallLog {
  id: string;
  caller_id: string;
  receiver_id: string;
  caller_type: CallerType;
  receiver_type: CallerType;
  booking_id?: string;
  service_type?: string;
  masked_caller_number?: string;
  masked_receiver_number?: string;
  call_type: CallType;
  call_status: CallStatus;
  initiated_at: string;
  answered_at?: string;
  ended_at?: string;
  duration_seconds: number;
  provider: CallProvider;
  provider_call_id?: string;
  provider_session_id?: string;
  connection_quality?: string;
  quality_rating?: number;
  is_emergency: boolean;
  created_at: string;
}

export interface PhoneMasking {
  id: string;
  user_id: string;
  real_phone_number: string;
  masked_number: string;
  masked_number_provider: string;
  booking_id?: string;
  paired_with_user_id?: string;
  is_active: boolean;
  assigned_at: string;
  expires_at?: string;
  calls_made: number;
  calls_received: number;
  total_call_duration: number;
}

export interface MaskedNumber {
  id: string;
  phone_number: string;
  country_code: string;
  provider: string;
  is_available: boolean;
  currently_assigned_to?: string;
}

/**
 * Initiate a call between two users
 */
export const initiateCall = async (params: {
  callerId: string;
  receiverId: string;
  callerType: CallerType;
  receiverType: CallerType;
  bookingId?: string;
  serviceType?: string;
  isEmergency?: boolean;
}) => {
  try {
    // Get or create masked numbers for both parties
    const callerMasking = await getOrCreateMaskedNumber({
      userId: params.callerId,
      bookingId: params.bookingId,
      pairedWithUserId: params.receiverId,
    });

    const receiverMasking = await getOrCreateMaskedNumber({
      userId: params.receiverId,
      bookingId: params.bookingId,
      pairedWithUserId: params.callerId,
    });

    if (!callerMasking.success || !receiverMasking.success) {
      return {
        success: false,
        error: 'Failed to assign masked numbers',
      };
    }

    // Create call log
    const { data: callLog, error: callError } = await supabase
      .from('call_logs')
      .insert({
        caller_id: params.callerId,
        receiver_id: params.receiverId,
        caller_type: params.callerType,
        receiver_type: params.receiverType,
        booking_id: params.bookingId,
        service_type: params.serviceType,
        masked_caller_number: callerMasking.data?.masked_number,
        masked_receiver_number: receiverMasking.data?.masked_number,
        call_type: params.isEmergency ? 'emergency' : 'voip',
        call_status: 'initiated',
        provider: 'internal', // Will be updated when connected to real provider
        is_emergency: params.isEmergency || false,
      })
      .select()
      .single();

    if (callError) {
      console.error('Error creating call log:', callError);
      return { success: false, error: callError.message };
    }

    // In production, integrate with VoIP provider here
    // For now, return call log for UI to handle
    return {
      success: true,
      data: callLog as CallLog,
      callerMaskedNumber: callerMasking.data?.masked_number,
      receiverMaskedNumber: receiverMasking.data?.masked_number,
    };
  } catch (error: unknown) {
    console.error('Error initiating call:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update call status
 */
export const updateCallStatus = async (
  callId: string,
  status: CallStatus,
  metadata?: {
    answeredAt?: string;
    endedAt?: string;
    providerCallId?: string;
    providerSessionId?: string;
  }
) => {
  const updateData: unknown = {
    call_status: status,
  };

  if (metadata?.answeredAt) updateData.answered_at = metadata.answeredAt;
  if (metadata?.endedAt) updateData.ended_at = metadata.endedAt;
  if (metadata?.providerCallId) updateData.provider_call_id = metadata.providerCallId;
  if (metadata?.providerSessionId) updateData.provider_session_id = metadata.providerSessionId;

  const { data, error } = await supabase
    .from('call_logs')
    .update(updateData)
    .eq('id', callId)
    .select()
    .single();

  if (error) {
    console.error('Error updating call status:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data: data as CallLog };
};

/**
 * End a call
 */
export const endCall = async (callId: string, quality?: number) => {
  const updateData: unknown = {
    call_status: 'completed',
    ended_at: new Date().toISOString(),
  };

  if (quality) {
    updateData.quality_rating = quality;
  }

  const { data, error } = await supabase
    .from('call_logs')
    .update(updateData)
    .eq('id', callId)
    .select()
    .single();

  if (error) {
    console.error('Error ending call:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data: data as CallLog };
};

/**
 * Get or create masked number for a user
 */
export const getOrCreateMaskedNumber = async (params: {
  userId: string;
  bookingId?: string;
  pairedWithUserId?: string;
}) => {
  try {
    // Check if user already has an active masked number for this booking
    const { data: existing } = await supabase
      .from('phone_masking')
      .select('*')
      .eq('user_id', params.userId)
      .eq('is_active', true)
      .maybeSingle();

    if (existing) {
      return { success: true, data: existing as PhoneMasking };
    }

    // Get an available masked number from the pool
    const { data: availableNumber } = await supabase
      .from('masked_number_pool')
      .select('*')
      .eq('is_available', true)
      .limit(1)
      .single();

    if (!availableNumber) {
      // Fallback: generate a simple masked number (in production, get from provider)
      const fallbackMasked = `+678555${Math.floor(1000 + Math.random() * 9000)}`;

      // Get user's phone number from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone_number')
        .eq('id', params.userId)
        .single();

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // Masked number valid for 24 hours

      const { data: masking, error: maskError } = await supabase
        .from('phone_masking')
        .insert({
          user_id: params.userId,
          real_phone_number: profile?.phone_number || 'unknown',
          masked_number: fallbackMasked,
          masked_number_provider: 'internal',
          booking_id: params.bookingId,
          paired_with_user_id: params.pairedWithUserId,
          is_active: true,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (maskError) {
        console.error('Error creating phone masking:', maskError);
        return { success: false, error: maskError.message };
      }

      return { success: true, data: masking as PhoneMasking };
    }

    // Assign the available number
    const { error: poolError } = await supabase
      .from('masked_number_pool')
      .update({
        is_available: false,
        currently_assigned_to: params.userId,
        assigned_at: new Date().toISOString(),
      })
      .eq('id', availableNumber.id);

    if (poolError) {
      console.error('Error assigning masked number:', poolError);
      return { success: false, error: poolError.message };
    }

    // Get user's phone number
    const { data: profile } = await supabase
      .from('profiles')
      .select('phone_number')
      .eq('id', params.userId)
      .single();

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { data: masking, error: maskError } = await supabase
      .from('phone_masking')
      .insert({
        user_id: params.userId,
        real_phone_number: profile?.phone_number || 'unknown',
        masked_number: availableNumber.phone_number,
        masked_number_provider: availableNumber.provider,
        booking_id: params.bookingId,
        paired_with_user_id: params.pairedWithUserId,
        is_active: true,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (maskError) {
      console.error('Error creating phone masking:', maskError);
      return { success: false, error: maskError.message };
    }

    return { success: true, data: masking as PhoneMasking };
  } catch (error: unknown) {
    console.error('Error in getOrCreateMaskedNumber:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Release masked number (after ride/service completion)
 */
export const releaseMaskedNumber = async (userId: string, bookingId?: string) => {
  const query = supabase
    .from('phone_masking')
    .update({
      is_active: false,
      released_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('is_active', true);

  if (bookingId) {
    query.eq('booking_id', bookingId);
  }

  const { error } = await query;

  if (error) {
    console.error('Error releasing masked number:', error);
    return { success: false, error: error.message };
  }

  // Mark pool numbers as available again
  await supabase
    .from('masked_number_pool')
    .update({
      is_available: true,
      currently_assigned_to: null,
      assigned_at: null,
    })
    .eq('currently_assigned_to', userId);

  return { success: true };
};

/**
 * Get call history for a user
 */
export const getCallHistory = async (userId: string, limit: number = 50) => {
  const { data, error } = await supabase
    .from('call_logs')
    .select('*')
    .or(`caller_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching call history:', error);
    return { success: false, error: error.message, data: [] };
  }

  return { success: true, data: data as CallLog[] };
};

/**
 * Get calls for a specific booking
 */
export const getCallsForBooking = async (bookingId: string) => {
  const { data, error } = await supabase
    .from('call_logs')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching booking calls:', error);
    return { success: false, error: error.message, data: [] };
  }

  return { success: true, data: data as CallLog[] };
};

/**
 * Submit call quality report
 */
export const submitCallQualityReport = async (params: {
  callLogId: string;
  reporterId: string;
  issueType: string;
  description?: string;
  severity?: 'low' | 'medium' | 'high';
}) => {
  const { data, error } = await supabase
    .from('call_quality_reports')
    .insert({
      call_log_id: params.callLogId,
      reporter_id: params.reporterId,
      issue_type: params.issueType,
      description: params.description,
      severity: params.severity || 'medium',
      status: 'reported',
    })
    .select()
    .single();

  if (error) {
    console.error('Error submitting quality report:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
};

/**
 * Make PSTN call (fallback for poor internet connection)
 * This will use the device's native phone dialer with the masked number
 */
export const makePSTNCall = (maskedNumber: string) => {
  // Remove any non-digit characters except +
  const cleanNumber = maskedNumber.replace(/[^\d+]/g, '');

  // On mobile web, this will open the phone dialer
  window.location.href = `tel:${cleanNumber}`;

  return { success: true, message: 'Opening phone dialer...' };
};

/**
 * Check if VoIP is available (has good internet connection)
 */
export const checkVoIPAvailability = async (): Promise<{
  available: boolean;
  connectionType?: string;
  recommendation: 'voip' | 'pstn';
}> => {
  try {
    // Check if online
    if (!navigator.onLine) {
      return {
        available: false,
        recommendation: 'pstn',
      };
    }

    // Check connection type (if available)
    const connection = (navigator as unknown).connection || (navigator as unknown).mozConnection || (navigator as unknown).webkitConnection;

    if (connection) {
      const effectiveType = connection.effectiveType; // '4g', '3g', '2g', 'slow-2g'

      // Recommend VoIP for 4G and good 3G connections
      if (effectiveType === '4g' || effectiveType === '3g') {
        return {
          available: true,
          connectionType: effectiveType,
          recommendation: 'voip',
        };
      }

      // Recommend PSTN for 2G and slow connections
      return {
        available: false,
        connectionType: effectiveType,
        recommendation: 'pstn',
      };
    }

    // Default to VoIP if we can't determine connection quality
    return {
      available: true,
      recommendation: 'voip',
    };
  } catch (error) {
    console.error('Error checking VoIP availability:', error);
    return {
      available: false,
      recommendation: 'pstn',
    };
  }
};

/**
 * Format phone number for display (masked)
 */
export const formatMaskedNumber = (phoneNumber: string): string => {
  // Remove country code for display
  const cleaned = phoneNumber.replace(/^\+678/, '');

  // Format as: XXX XXXX
  if (cleaned.length === 7) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
  }

  return phoneNumber;
};

/**
 * Get call duration in human-readable format
 */
export const formatCallDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
};

/**
 * Vanuatu emergency calling
 */
export const callEmergency = () => {
  window.location.href = 'tel:112';
  return { success: true, message: 'Calling emergency services (112)...' };
};
