import { supabase } from '@/integrations/supabase/client';

export type CancellationReasonCategory =
  | 'passenger_request'
  | 'driver_unavailable'
  | 'wrong_location'
  | 'price_issue'
  | 'weather'
  | 'emergency'
  | 'safety_concern'
  | 'no_show'
  | 'duplicate'
  | 'payment_failed'
  | 'vehicle_issue'
  | 'other';

export type RefundStatus =
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'partially_approved'
  | 'rejected'
  | 'processing'
  | 'completed'
  | 'failed';

export interface RideCancellation {
  id: string;
  ride_booking_id: string;
  scheduled_ride_id?: string;
  cancelled_by: string;
  cancelled_by_role: 'passenger' | 'driver' | 'admin' | 'system';
  cancelled_at: string;
  reason_category?: CancellationReasonCategory;
  reason_details?: string;
  original_price: number;
  cancellation_fee: number;
  refund_amount: number;
  fee_calculation_details?: any;
  fee_charged_to?: string;
  fee_processed: boolean;
  refund_processed: boolean;
  created_at: string;
}

export interface RefundRequest {
  id: string;
  user_id: string;
  payment_id: string;
  cancellation_id?: string;
  original_amount: number;
  requested_amount: number;
  approved_amount?: number;
  status: RefundStatus;
  reason: string;
  supporting_documents?: string[];
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  processed_at?: string;
  processing_method?: string;
  disputed: boolean;
  created_at: string;
}

export interface CancellationPolicy {
  id: string;
  policy_name: string;
  service_type: string;
  ride_status?: string;
  fee_type: 'percentage' | 'fixed' | 'none';
  fee_amount?: number;
  charged_to?: string;
  is_active: boolean;
  priority: number;
}

/**
 * Calculate cancellation fee for a ride
 */
const calculateCancellationFee = async (params: {
  rideBookingId: string;
  rideStatus: string;
  cancelledByRole: 'passenger' | 'driver';
  originalPrice: number;
}): Promise<{
  feeAmount: number;
  refundAmount: number;
  feeChargedTo: string;
  calculationDetails: any;
}> => {
  try {
    const { data, error } = await supabase.rpc('calculate_cancellation_fee', {
      p_ride_booking_id: params.rideBookingId,
      p_ride_status: params.rideStatus,
      p_cancelled_by_role: params.cancelledByRole,
      p_original_price: params.originalPrice,
    });

    if (error) {
      console.error('Error calculating cancellation fee:', error);
      // Fallback to basic calculation
      return {
        feeAmount: 0,
        refundAmount: params.originalPrice,
        feeChargedTo: 'none',
        calculationDetails: { error: error.message },
      };
    }

    const result = data[0];
    return {
      feeAmount: result.fee_amount,
      refundAmount: result.refund_amount,
      feeChargedTo: result.fee_charged_to,
      calculationDetails: result.calculation_details,
    };
  } catch (error: any) {
    console.error('Error in calculateCancellationFee:', error);
    return {
      feeAmount: 0,
      refundAmount: params.originalPrice,
      feeChargedTo: 'none',
      calculationDetails: { error: error.message },
    };
  }
};

/**
 * Cancel a ride booking
 */
export const cancelRideBooking = async (params: {
  rideBookingId: string;
  userId: string;
  userRole: 'passenger' | 'driver';
  rideStatus: string;
  originalPrice: number;
  reasonCategory?: CancellationReasonCategory;
  reasonDetails?: string;
}) => {
  try {
    // Calculate cancellation fee
    const feeCalculation = await calculateCancellationFee({
      rideBookingId: params.rideBookingId,
      rideStatus: params.rideStatus,
      cancelledByRole: params.userRole,
      originalPrice: params.originalPrice,
    });

    // Create cancellation record
    const { data: cancellation, error: cancelError } = await supabase
      .from('ride_cancellations')
      .insert({
        ride_booking_id: params.rideBookingId,
        cancelled_by: params.userId,
        cancelled_by_role: params.userRole,
        reason_category: params.reasonCategory || 'passenger_request',
        reason_details: params.reasonDetails,
        original_price: params.originalPrice,
        cancellation_fee: feeCalculation.feeAmount,
        refund_amount: feeCalculation.refundAmount,
        fee_calculation_details: feeCalculation.calculationDetails,
        fee_charged_to: feeCalculation.feeChargedTo,
        fee_processed: false,
        refund_processed: false,
      })
      .select()
      .single();

    if (cancelError) {
      console.error('Error creating cancellation:', cancelError);
      return { success: false, error: cancelError.message };
    }

    // Update ride booking status to cancelled
    const { error: updateError } = await supabase
      .from('ride_bookings')
      .update({ status: 'cancelled' })
      .eq('id', params.rideBookingId);

    if (updateError) {
      console.error('Error updating ride status:', updateError);
    }

    return {
      success: true,
      data: cancellation as RideCancellation,
      cancellationFee: feeCalculation.feeAmount,
      refundAmount: feeCalculation.refundAmount,
      message:
        feeCalculation.feeAmount > 0
          ? `Ride cancelled. Cancellation fee: VUV ${feeCalculation.feeAmount.toFixed(2)}. Refund: VUV ${feeCalculation.refundAmount.toFixed(2)}`
          : `Ride cancelled. Full refund: VUV ${feeCalculation.refundAmount.toFixed(2)}`,
    };
  } catch (error: any) {
    console.error('Error in cancelRideBooking:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Request a refund
 */
export const requestRefund = async (params: {
  userId: string;
  paymentId: string;
  cancellationId?: string;
  originalAmount: number;
  requestedAmount: number;
  reason: string;
  supportingDocuments?: string[];
}) => {
  try {
    const { data, error } = await supabase
      .from('refund_requests')
      .insert({
        user_id: params.userId,
        payment_id: params.paymentId,
        cancellation_id: params.cancellationId,
        original_amount: params.originalAmount,
        requested_amount: params.requestedAmount,
        reason: params.reason,
        supporting_documents: params.supportingDocuments,
        status: 'pending',
        disputed: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating refund request:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: data as RefundRequest,
      message: 'Refund request submitted successfully. We will review it within 24-48 hours.',
    };
  } catch (error: any) {
    console.error('Error in requestRefund:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user's refund requests
 */
export const getUserRefundRequests = async (userId: string) => {
  const { data, error } = await supabase
    .from('refund_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching refund requests:', error);
    return { success: false, error: error.message, data: [] };
  }

  return { success: true, data: data as RefundRequest[] };
};

/**
 * Get cancellation for a ride
 */
export const getCancellationForRide = async (rideBookingId: string) => {
  const { data, error } = await supabase
    .from('ride_cancellations')
    .select('*')
    .eq('ride_booking_id', rideBookingId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No cancellation found
      return { success: true, data: null };
    }
    console.error('Error fetching cancellation:', error);
    return { success: false, error: error.message, data: null };
  }

  return { success: true, data: data as RideCancellation };
};

/**
 * Get cancellation policies
 */
export const getCancellationPolicies = async (serviceType: string = 'ride') => {
  const { data, error } = await supabase
    .from('cancellation_policies')
    .select('*')
    .eq('service_type', serviceType)
    .eq('is_active', true)
    .order('priority', { ascending: false });

  if (error) {
    console.error('Error fetching cancellation policies:', error);
    return { success: false, error: error.message, data: [] };
  }

  return { success: true, data: data as CancellationPolicy[] };
};

/**
 * Format cancellation policy for display
 */
export const formatCancellationPolicy = (policy: CancellationPolicy): string => {
  const status = policy.ride_status ? ` (${policy.ride_status})` : '';

  if (policy.fee_type === 'none') {
    return `${policy.policy_name}: No cancellation fee`;
  } else if (policy.fee_type === 'percentage') {
    return `${policy.policy_name}: ${policy.fee_amount}% fee${status}`;
  } else if (policy.fee_type === 'fixed') {
    return `${policy.policy_name}: VUV ${policy.fee_amount} fee${status}`;
  }

  return policy.policy_name;
};

/**
 * Get cancellation fee preview for a ride
 */
export const getCancellationFeePreview = async (params: {
  rideBookingId: string;
  rideStatus: string;
  userRole: 'passenger' | 'driver';
  originalPrice: number;
}): Promise<{
  success: boolean;
  feeAmount?: number;
  refundAmount?: number;
  feePercentage?: number;
  message?: string;
}> => {
  const feeCalculation = await calculateCancellationFee({
    rideBookingId: params.rideBookingId,
    rideStatus: params.rideStatus,
    cancelledByRole: params.userRole,
    originalPrice: params.originalPrice,
  });

  const feePercentage = params.originalPrice > 0
    ? (feeCalculation.feeAmount / params.originalPrice) * 100
    : 0;

  let message = '';
  if (feeCalculation.feeAmount === 0) {
    message = `You will receive a full refund of VUV ${feeCalculation.refundAmount.toFixed(2)}`;
  } else {
    message = `Cancellation fee: VUV ${feeCalculation.feeAmount.toFixed(2)} (${feePercentage.toFixed(0)}%). Refund: VUV ${feeCalculation.refundAmount.toFixed(2)}`;
  }

  return {
    success: true,
    feeAmount: feeCalculation.feeAmount,
    refundAmount: feeCalculation.refundAmount,
    feePercentage,
    message,
  };
};

/**
 * Process automatic refund after cancellation
 */
export const processAutomaticRefund = async (params: {
  userId: string;
  paymentId: string;
  cancellationId: string;
  refundAmount: number;
}) => {
  try {
    // Create refund request
    const refundRequest = await requestRefund({
      userId: params.userId,
      paymentId: params.paymentId,
      cancellationId: params.cancellationId,
      originalAmount: params.refundAmount,
      requestedAmount: params.refundAmount,
      reason: 'Automatic refund from ride cancellation',
    });

    if (!refundRequest.success) {
      return refundRequest;
    }

    // Auto-approve refunds under certain conditions (e.g., passenger cancelled pending ride)
    // In production, this would integrate with payment provider

    return {
      success: true,
      data: refundRequest.data,
      message: 'Refund is being processed and will be credited within 3-5 business days.',
    };
  } catch (error: any) {
    console.error('Error in processAutomaticRefund:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get refund status display
 */
export const getRefundStatusDisplay = (status: RefundStatus): {
  label: string;
  color: 'default' | 'secondary' | 'destructive' | 'outline';
} => {
  const statusMap: Record<RefundStatus, { label: string; color: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { label: 'Pending Review', color: 'secondary' },
    under_review: { label: 'Under Review', color: 'default' },
    approved: { label: 'Approved', color: 'default' },
    partially_approved: { label: 'Partially Approved', color: 'default' },
    rejected: { label: 'Rejected', color: 'destructive' },
    processing: { label: 'Processing', color: 'default' },
    completed: { label: 'Completed', color: 'default' },
    failed: { label: 'Failed', color: 'destructive' },
  };

  return statusMap[status] || { label: status, color: 'outline' };
};
