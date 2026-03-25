// Types for Shop Delivery system

export interface ShopCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface Shop {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  category: string;
  logo_url: string | null;
  cover_image_url: string | null;
  phone_number: string;
  whatsapp_number: string | null;
  email: string | null;
  address: string;
  island: string;
  area: string | null;
  latitude: number | null;
  longitude: number | null;
  opening_time: string;
  closing_time: string;
  open_days: string[];
  is_open_now: boolean;
  offers_delivery: boolean;
  delivery_fee: number;
  free_delivery_minimum: number | null;
  delivery_radius_km: number;
  estimated_delivery_time: number;
  is_verified: boolean;
  is_active: boolean;
  average_rating: number;
  total_reviews: number;
  total_orders: number;
  created_at: string;
  updated_at: string;
}

export interface ShopProduct {
  id: string;
  shop_id: string;
  name: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  price: number;
  original_price: number | null;
  unit: string;
  unit_size: string | null;
  in_stock: boolean;
  stock_quantity: number | null;
  low_stock_threshold: number;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShopOrder {
  id: string;
  user_id: string;
  shop_id: string;
  order_number: string;
  delivery_type: 'delivery' | 'pickup';
  delivery_address: string | null;
  delivery_island: string | null;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  delivery_instructions: string | null;
  customer_name: string;
  customer_phone: string;
  subtotal: number;
  delivery_fee: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  payment_method: 'cash' | 'mobile_money' | 'card';
  payment_status: 'pending' | 'paid' | 'refunded';
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  scheduled_delivery_time: string | null;
  confirmed_at: string | null;
  ready_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  shop?: Shop;
  items?: ShopOrderItem[];
}

export interface ShopOrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image_url: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  special_instructions: string | null;
  created_at: string;
}

export interface ShopReview {
  id: string;
  shop_id: string;
  user_id: string;
  order_id: string | null;
  rating: number;
  review: string | null;
  shop_response: string | null;
  response_date: string | null;
  is_hidden: boolean;
  created_at: string;
}

// Cart types
export interface CartItem {
  product: ShopProduct;
  quantity: number;
  special_instructions?: string;
}

export interface Cart {
  shop_id: string;
  shop: Shop;
  items: CartItem[];
}

// Constants
export const VANUATU_ISLANDS = [
  'Efate',
  'Santo',
  'Tanna',
  'Malekula',
  'Epi',
  'Ambrym',
  'Pentecost',
  'Ambae',
  'Erromango',
  'Aneityum',
];

export const ORDER_STATUSES = {
  pending: { label: 'Pending', color: 'yellow', description: 'Waiting for shop to confirm' },
  confirmed: { label: 'Confirmed', color: 'blue', description: 'Order confirmed by shop' },
  preparing: { label: 'Preparing', color: 'purple', description: 'Shop is preparing your order' },
  ready: { label: 'Ready', color: 'cyan', description: 'Order ready for pickup/delivery' },
  out_for_delivery: { label: 'On the way', color: 'orange', description: 'Order is being delivered' },
  delivered: { label: 'Delivered', color: 'green', description: 'Order completed' },
  cancelled: { label: 'Cancelled', color: 'red', description: 'Order was cancelled' },
};

export const PAYMENT_METHODS = {
  cash: { label: 'Cash on Delivery', icon: 'Banknote' },
  mobile_money: { label: 'Mobile Money', icon: 'Smartphone' },
  card: { label: 'Card Payment', icon: 'CreditCard' },
};

export const SHOP_ICONS: Record<string, string> = {
  supermarket: 'ShoppingCart',
  convenience: 'Store',
  produce: 'Leaf',
  butcher: 'Beef',
  bakery: 'Croissant',
  pharmacy: 'Pill',
  hardware: 'Hammer',
  electronics: 'Smartphone',
  baby: 'Baby',
  pets: 'Dog',
  office: 'Briefcase',
  beverages: 'GlassWater',
};
