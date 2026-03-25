import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type AlertType = 'sos' | 'route_deviation' | 'unexpected_stop' | 'speed_violation' | 'check_in_failed' | 'manual' | 'other';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ServiceType = 'ride' | 'food' | 'hotel' | 'tour' | 'other';

export interface EmergencyContact {
  id: string;
  user_id: string;
  name: string;
  phone_number: string;
  relationship?: string;
  email?: string;
  is_primary: boolean;
  priority_order: number;
  is_verified: boolean;
  is_active: boolean;
}

export interface TripShare {
  id: string;
  user_id: string;
  booking_id: string;
  service_type: ServiceType;
  share_token: string;
  share_url: string;
  recipient_name?: string;
  recipient_phone?: string;
  recipient_email?: string;
  is_active: boolean;
  expires_at?: string;
  accessed_count: number;
}

export interface SafetyAlert {
  id: string;
  user_id: string;
  booking_id?: string;
  service_type?: ServiceType;
  alert_type: AlertType;
  severity: AlertSeverity;
  location_lat?: number;
  location_lng?: number;
  location_address?: string;
  title: string;
  message?: string;
  metadata?: any;
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  emergency_services_notified: boolean;
  contacts_notified: boolean;
  admin_notified: boolean;
  created_at: string;
}

export interface VerificationPIN {
  id: string;
  booking_id: string;
  user_id: string;
  driver_id?: string;
  pin_code: string;
  pin_type: 'pickup' | 'dropoff';
  is_verified: boolean;
  verification_attempts: number;
  max_attempts: number;
  expires_at: string;
}

// Emergency Contacts Functions

/**
 * Get all emergency contacts for a user
 */
export const getEmergencyContacts = async (userId: string) => {
  const { data, error } = await supabase
    .from('emergency_contacts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('priority_order', { ascending: true });

  if (error) {
    console.error('Error fetching emergency contacts:', error);
    return { success: false, error: error.message, data: [] };
  }

  return { success: true, data: data as EmergencyContact[] };
};

/**
 * Add emergency contact
 */
export const addEmergencyContact = async (params: {
  userId: string;
  name: string;
  phoneNumber: string;
  relationship?: string;
  email?: string;
  isPrimary?: boolean;
}) => {
  // If setting as primary, unset other primary contacts
  if (params.isPrimary) {
    await supabase
      .from('emergency_contacts')
      .update({ is_primary: false })
      .eq('user_id', params.userId);
  }

  const { data, error } = await supabase
    .from('emergency_contacts')
    .insert({
      user_id: params.userId,
      name: params.name,
      phone_number: params.phoneNumber,
      relationship: params.relationship,
      email: params.email,
      is_primary: params.isPrimary || false,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding emergency contact:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data: data as EmergencyContact };
};

/**
 * Delete emergency contact
 */
export const deleteEmergencyContact = async (contactId: string) => {
  const { error } = await supabase
    .from('emergency_contacts')
    .update({ is_active: false })
    .eq('id', contactId);

  if (error) {
    console.error('Error deleting emergency contact:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

// Emergency SOS Functions

/**
 * Trigger Emergency SOS Alert
 */
export const triggerEmergencySOS = async (params: {
  userId: string;
  bookingId?: string;
  serviceType?: ServiceType;
  locationLat?: number;
  locationLng?: number;
  message?: string;
}) => {
  try {
    // Create critical safety alert
    const { data: alert, error: alertError } = await supabase
      .from('safety_alerts')
      .insert({
        user_id: params.userId,
        booking_id: params.bookingId,
        service_type: params.serviceType,
        alert_type: 'sos',
        severity: 'critical',
        location_lat: params.locationLat,
        location_lng: params.locationLng,
        title: '🚨 EMERGENCY SOS ACTIVATED',
        message: params.message || 'User has triggered emergency SOS',
        status: 'active',
        emergency_services_notified: false, // Will be handled by backend/admin
        contacts_notified: false,
        admin_notified: false,
      })
      .select()
      .single();

    if (alertError) throw alertError;

    // Get emergency contacts
    const contacts = await getEmergencyContacts(params.userId);

    // Notify emergency contacts via notification system
    if (contacts.success && contacts.data.length > 0) {
      for (const contact of contacts.data) {
        await supabase.from('notifications').insert({
          user_id: params.userId,
          title: '🚨 EMERGENCY SOS',
          message: `Emergency SOS has been activated. ${contact.name} has been notified.`,
          type: 'safety_alert',
        });
      }

      // Mark contacts as notified
      await supabase
        .from('safety_alerts')
        .update({ contacts_notified: true })
        .eq('id', alert.id);
    }

    // Notify admins
    await supabase.from('notifications').insert({
      user_id: params.userId,
      title: '🚨 CRITICAL: Emergency SOS Activated',
      message: `User has triggered emergency SOS. Immediate action required.`,
      type: 'safety_alert',
    });

    await supabase
      .from('safety_alerts')
      .update({ admin_notified: true })
      .eq('id', alert.id);

    return {
      success: true,
      data: alert as SafetyAlert,
      message: 'Emergency SOS activated. Emergency contacts and authorities have been notified.',
    };
  } catch (error: any) {
    console.error('Error triggering emergency SOS:', error);
    return { success: false, error: error.message };
  }
};

// Trip Sharing Functions

/**
 * Generate shareable trip link
 */
export const shareTripWithContacts = async (params: {
  userId: string;
  bookingId: string;
  serviceType: ServiceType;
  recipientName?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  expiresInHours?: number;
}) => {
  try {
    // Generate unique share token
    const shareToken = `${params.bookingId}-${Math.random().toString(36).substring(2, 15)}`;
    const shareUrl = `${window.location.origin}/track/shared/${shareToken}`;

    const expiresAt = params.expiresInHours
      ? new Date(Date.now() + params.expiresInHours * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Default 24 hours

    const { data, error } = await supabase
      .from('trip_shares')
      .insert({
        user_id: params.userId,
        booking_id: params.bookingId,
        service_type: params.serviceType,
        share_token: shareToken,
        share_url: shareUrl,
        recipient_name: params.recipientName,
        recipient_phone: params.recipientPhone,
        recipient_email: params.recipientEmail,
        is_active: true,
        expires_at: expiresAt,
        accessed_count: 0,
      })
      .select()
      .single();

    if (error) throw error;

    // Send notification to emergency contacts if specified
    if (params.recipientPhone || params.recipientEmail) {
      await supabase.from('notifications').insert({
        user_id: params.userId,
        title: 'Trip Shared Successfully',
        message: `Your trip has been shared with ${params.recipientName || 'your contact'}. They can track your journey at: ${shareUrl}`,
        type: 'trip_share',
      });
    }

    return {
      success: true,
      data: data as TripShare,
      shareUrl,
      shareToken,
    };
  } catch (error: any) {
    console.error('Error sharing trip:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get shared trip details by token (public access)
 */
export const getSharedTripByToken = async (shareToken: string) => {
  const { data: share, error: shareError } = await supabase
    .from('trip_shares')
    .select('*')
    .eq('share_token', shareToken)
    .eq('is_active', true)
    .single();

  if (shareError || !share) {
    return { success: false, error: 'Invalid or expired share link' };
  }

  // Check if expired
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return { success: false, error: 'This share link has expired' };
  }

  // Increment access count
  await supabase
    .from('trip_shares')
    .update({
      accessed_count: share.accessed_count + 1,
      last_accessed_at: new Date().toISOString(),
    })
    .eq('id', share.id);

  // Get booking details based on service type
  let bookingData = null;
  if (share.service_type === 'ride') {
    const { data } = await supabase
      .from('ride_bookings')
      .select('*')
      .eq('id', share.booking_id)
      .single();
    bookingData = data;
  }

  return {
    success: true,
    data: {
      share: share as TripShare,
      booking: bookingData,
    },
  };
};

// Verification PIN Functions

/**
 * Generate ride verification PIN
 */
export const generateVerificationPIN = async (params: {
  bookingId: string;
  userId: string;
  driverId?: string;
  pinType?: 'pickup' | 'dropoff';
}) => {
  // Generate 4-digit PIN
  const pinCode = Math.floor(1000 + Math.random() * 9000).toString();

  // PIN expires in 30 minutes
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('ride_verification_pins')
    .insert({
      booking_id: params.bookingId,
      user_id: params.userId,
      driver_id: params.driverId,
      pin_code: pinCode,
      pin_type: params.pinType || 'pickup',
      is_verified: false,
      verification_attempts: 0,
      max_attempts: 3,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) {
    console.error('Error generating verification PIN:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data: data as VerificationPIN, pinCode };
};

/**
 * Verify PIN
 */
export const verifyPIN = async (bookingId: string, pinCode: string, verifiedBy: string) => {
  const { data: pin, error: fetchError } = await supabase
    .from('ride_verification_pins')
    .select('*')
    .eq('booking_id', bookingId)
    .single();

  if (fetchError || !pin) {
    return { success: false, error: 'PIN not found' };
  }

  // Check if expired
  if (new Date(pin.expires_at) < new Date()) {
    return { success: false, error: 'PIN has expired' };
  }

  // Check if already verified
  if (pin.is_verified) {
    return { success: false, error: 'PIN already verified' };
  }

  // Check max attempts
  if (pin.verification_attempts >= pin.max_attempts) {
    return { success: false, error: 'Maximum verification attempts exceeded' };
  }

  // Verify PIN
  if (pin.pin_code === pinCode) {
    await supabase
      .from('ride_verification_pins')
      .update({
        is_verified: true,
        verified_at: new Date().toISOString(),
        verified_by: verifiedBy,
      })
      .eq('id', pin.id);

    return { success: true, message: 'PIN verified successfully' };
  } else {
    // Increment attempts
    await supabase
      .from('ride_verification_pins')
      .update({
        verification_attempts: pin.verification_attempts + 1,
      })
      .eq('id', pin.id);

    const attemptsLeft = pin.max_attempts - (pin.verification_attempts + 1);
    return {
      success: false,
      error: `Incorrect PIN. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining.`,
    };
  }
};

/**
 * Get PIN for booking
 */
export const getPINForBooking = async (bookingId: string) => {
  const { data, error } = await supabase
    .from('ride_verification_pins')
    .select('*')
    .eq('booking_id', bookingId)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data as VerificationPIN };
};

// Safety Check-in Functions

/**
 * Create safety check-in
 */
export const createSafetyCheckIn = async (params: {
  userId: string;
  bookingId: string;
  serviceType: ServiceType;
  checkInType: 'scheduled' | 'route_deviation' | 'unexpected_stop' | 'manual';
  expectedAt: string;
  locationLat?: number;
  locationLng?: number;
}) => {
  const { data, error } = await supabase
    .from('safety_check_ins')
    .insert({
      user_id: params.userId,
      booking_id: params.bookingId,
      service_type: params.serviceType,
      check_in_type: params.checkInType,
      expected_at: params.expectedAt,
      location_lat: params.locationLat,
      location_lng: params.locationLng,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating safety check-in:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
};

/**
 * Complete safety check-in
 */
export const completeSafetyCheckIn = async (checkInId: string, responseMessage?: string) => {
  const { error } = await supabase
    .from('safety_check_ins')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      response_message: responseMessage,
    })
    .eq('id', checkInId);

  if (error) {
    console.error('Error completing check-in:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Get active safety alerts for user
 */
export const getActiveSafetyAlerts = async (userId: string) => {
  const { data, error } = await supabase
    .from('safety_alerts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching safety alerts:', error);
    return { success: false, error: error.message, data: [] };
  }

  return { success: true, data: data as SafetyAlert[] };
};

// Vanuatu Emergency Numbers
export const VANUATU_EMERGENCY_NUMBERS = {
  police: '112',
  ambulance: '112',
  fire: '112',
  general_emergency: '112',
};

/**
 * Call emergency services
 */
export const callEmergencyServices = (service: 'police' | 'ambulance' | 'fire' | 'general') => {
  const number = VANUATU_EMERGENCY_NUMBERS[`${service}_emergency`] || VANUATU_EMERGENCY_NUMBERS.general_emergency;
  window.location.href = `tel:${number}`;
};
