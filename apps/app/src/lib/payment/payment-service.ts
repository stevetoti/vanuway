import { supabase } from '@/integrations/supabase/client';

export type PaymentMethodType = 'stripe' | 'cod' | 'my_cash' | 'm_vatu' | 'polar_card';
export type ServiceType = 'ride' | 'food' | 'hotel' | 'tour' | 'mart' | 'other';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';

export interface PaymentMethod {
  id: string;
  user_id: string;
  method_type: PaymentMethodType;
  provider_name?: string;
  account_number?: string;
  account_name?: string;
  card_last_four?: string;
  card_expiry?: string;
  card_brand?: string;
  is_default: boolean;
  is_verified: boolean;
  status: string;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  service_type: ServiceType;
  booking_id?: string;
  amount: number;
  currency: string;
  payment_method: PaymentMethodType;
  payment_method_id?: string;
  transaction_id?: string;
  provider_reference?: string;
  status: PaymentStatus;
  cod_collected: boolean;
  cod_collected_at?: string;
  cod_collector_id?: string;
  description?: string;
  metadata?: any;
  failure_reason?: string;
  created_at: string;
  completed_at?: string;
}

export interface CreatePaymentParams {
  userId: string;
  serviceType: ServiceType;
  bookingId?: string;
  amount: number;
  currency?: string;
  paymentMethod: PaymentMethodType;
  paymentMethodId?: string;
  description?: string;
  metadata?: any;
}

export interface PaymentProviderConfig {
  stripe: {
    displayName: string;
    logo: string;
    supportedCards: string[];
    instructions: string;
    enabled: boolean;
  };
  cod: {
    displayName: string;
    instructions: string;
    enabled: boolean;
  };
}

/**
 * Get all payment methods for a user
 */
export const getUserPaymentMethods = async (userId: string) => {
  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching payment methods:', error);
    return { success: false, error: error.message, data: [] };
  }

  return { success: true, data: data as PaymentMethod[] };
};

/**
 * Add a new payment method
 */
export const addPaymentMethod = async (params: {
  userId: string;
  methodType: PaymentMethodType;
  providerName?: string;
  accountNumber?: string;
  accountName?: string;
  cardLastFour?: string;
  cardExpiry?: string;
  cardBrand?: string;
  isDefault?: boolean;
}) => {
  // If setting as default, unset other defaults first
  if (params.isDefault) {
    await supabase
      .from('payment_methods')
      .update({ is_default: false })
      .eq('user_id', params.userId);
  }

  const { data, error } = await supabase
    .from('payment_methods')
    .insert({
      user_id: params.userId,
      method_type: params.methodType,
      provider_name: params.providerName,
      account_number: params.accountNumber,
      account_name: params.accountName,
      card_last_four: params.cardLastFour,
      card_expiry: params.cardExpiry,
      card_brand: params.cardBrand,
      is_default: params.isDefault || false,
      is_verified: params.methodType === 'cod', // COD doesn't need verification
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding payment method:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data: data as PaymentMethod };
};

/**
 * Set default payment method
 */
export const setDefaultPaymentMethod = async (userId: string, methodId: string) => {
  // Unset all defaults for this user
  await supabase
    .from('payment_methods')
    .update({ is_default: false })
    .eq('user_id', userId);

  // Set the new default
  const { error } = await supabase
    .from('payment_methods')
    .update({ is_default: true })
    .eq('id', methodId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error setting default payment method:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Delete a payment method
 */
export const deletePaymentMethod = async (userId: string, methodId: string) => {
  const { error } = await supabase
    .from('payment_methods')
    .update({ status: 'inactive' })
    .eq('id', methodId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting payment method:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Create a payment
 */
export const createPayment = async (params: CreatePaymentParams) => {
  const { data, error } = await supabase
    .from('payments')
    .insert({
      user_id: params.userId,
      service_type: params.serviceType,
      booking_id: params.bookingId,
      amount: params.amount,
      currency: params.currency || 'VUV',
      payment_method: params.paymentMethod,
      payment_method_id: params.paymentMethodId,
      description: params.description,
      metadata: params.metadata,
      status: params.paymentMethod === 'cod' ? 'pending' : 'processing',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating payment:', error);
    return { success: false, error: error.message };
  }

  // If COD, mark as pending and return success
  if (params.paymentMethod === 'cod') {
    return {
      success: true,
      data: data as Payment,
      requiresAction: false,
      message: 'Cash on Delivery order placed successfully'
    };
  }

  // For digital payments, initiate payment processing
  const processingResult = await processDigitalPayment(data.id, params.paymentMethod, params.amount);

  return {
    success: processingResult.success,
    data: data as Payment,
    requiresAction: processingResult.requiresAction,
    actionUrl: processingResult.requiresAction ? (processingResult as any).actionUrl : undefined,
    message: processingResult.message,
  };
};

/**
 * Process digital payment (Stripe)
 */
const processDigitalPayment = async (
  paymentId: string,
  method: PaymentMethodType,
  amount: number
) => {
  if (method === 'stripe') {
    return processStripePayment(paymentId, amount);
  }

  return {
    success: false,
    requiresAction: false,
    message: 'Unsupported payment method',
  };
};

/**
 * Process Stripe payment
 */
const processStripePayment = async (paymentId: string, amount: number) => {
  // TODO: Integrate with Stripe API
  // https://stripe.com/docs/payments

  // For now, return integration-ready structure
  // In production, create a PaymentIntent and return the client_secret
  return {
    success: true,
    requiresAction: true,
    actionUrl: `/payment/stripe/${paymentId}`,
    message: 'Redirecting to secure payment page...',
  };
};

/**
 * Mark COD as collected
 */
export const markCODCollected = async (
  paymentId: string,
  collectorId: string
) => {
  const { error } = await supabase
    .from('payments')
    .update({
      status: 'completed',
      cod_collected: true,
      cod_collected_at: new Date().toISOString(),
      cod_collector_id: collectorId,
      completed_at: new Date().toISOString(),
    })
    .eq('id', paymentId)
    .eq('payment_method', 'cod');

  if (error) {
    console.error('Error marking COD as collected:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Get payment history for a user
 */
export const getPaymentHistory = async (
  userId: string,
  limit: number = 50
) => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching payment history:', error);
    return { success: false, error: error.message, data: [] };
  }

  return { success: true, data: data as Payment[] };
};

/**
 * Get payment by ID
 */
export const getPaymentById = async (paymentId: string) => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single();

  if (error) {
    console.error('Error fetching payment:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data: data as Payment };
};

/**
 * Get provider configurations
 */
export const getPaymentProviderConfig = async (): Promise<PaymentProviderConfig> => {
  // Return default config
  return {
    stripe: {
      displayName: 'Card Payment',
      logo: '/payment-logos/stripe.png',
      supportedCards: ['Visa', 'Mastercard', 'American Express'],
      instructions: 'Pay securely with your credit or debit card',
      enabled: true,
    },
    cod: {
      displayName: 'Cash on Delivery',
      instructions: 'Pay with cash when your order arrives',
      enabled: true,
    },
  };
};
