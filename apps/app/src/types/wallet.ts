export type TransactionType = 'credit' | 'debit';

export type TransactionCategory =
  | 'top_up'
  | 'ride_payment'
  | 'food_payment'
  | 'refund'
  | 'transfer_sent'
  | 'transfer_received'
  | 'withdrawal';

export type PaymentMethod =
  | 'my_cash'      // Digicel Mobile Money
  | 'm_vatu'       // Vodafone Mobile Money
  | 'polar'        // Polar.sh or credit card
  | 'wallet'       // VanuWay Wallet
  | 'cash';        // Cash

export type Currency = 'VUV' | 'AUD' | 'USD';

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  currency: Currency;
  description: string;
  payment_method?: PaymentMethod;
  reference_id?: string;
  related_booking_id?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface WalletBalance {
  user_id: string;
  balance_vvu: number;
  balance_aud: number;
  balance_usd: number;
  updated_at: string;
}

export interface AddMoneyRequest {
  amount: number;
  currency: Currency;
  payment_method: PaymentMethod;
  phone_number?: string; // For My Cash / M-Vatu
}
