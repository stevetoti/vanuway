-- Shop Delivery System for Vanuatu
-- Order groceries and essentials from local shops

-- ============================================
-- SHOP CATEGORIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.shop_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SHOPS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic Info
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  logo_url TEXT,
  cover_image_url TEXT,

  -- Contact
  phone_number TEXT NOT NULL,
  whatsapp_number TEXT,
  email TEXT,

  -- Location
  address TEXT NOT NULL,
  island TEXT NOT NULL,
  area TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),

  -- Operating Hours
  opening_time TIME DEFAULT '08:00',
  closing_time TIME DEFAULT '18:00',
  open_days TEXT[] DEFAULT ARRAY['monday','tuesday','wednesday','thursday','friday','saturday'],
  is_open_now BOOLEAN DEFAULT true,

  -- Delivery
  offers_delivery BOOLEAN DEFAULT true,
  delivery_fee DECIMAL(10,2) DEFAULT 200,
  free_delivery_minimum DECIMAL(10,2),
  delivery_radius_km INTEGER DEFAULT 10,
  estimated_delivery_time INTEGER DEFAULT 45, -- minutes

  -- Status
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  -- Stats
  average_rating DECIMAL(2,1) DEFAULT 5.0,
  total_reviews INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SHOP PRODUCTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.shop_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,

  -- Product Info
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  image_url TEXT,

  -- Pricing
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2), -- For showing discounts
  unit TEXT DEFAULT 'each', -- 'each', 'kg', 'pack', 'bottle', etc.
  unit_size TEXT, -- '500ml', '1kg', etc.

  -- Inventory
  in_stock BOOLEAN DEFAULT true,
  stock_quantity INTEGER,
  low_stock_threshold INTEGER DEFAULT 5,

  -- Flags
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SHOP ORDERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.shop_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,

  -- Order Reference
  order_number TEXT NOT NULL UNIQUE,

  -- Delivery Info
  delivery_type TEXT NOT NULL CHECK (delivery_type IN ('delivery', 'pickup')),
  delivery_address TEXT,
  delivery_island TEXT,
  delivery_latitude DECIMAL(10,8),
  delivery_longitude DECIMAL(11,8),
  delivery_instructions TEXT,

  -- Contact
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,

  -- Pricing
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'VUV',

  -- Payment
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'mobile_money', 'card')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled')),

  -- Timestamps
  scheduled_delivery_time TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ORDER ITEMS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.shop_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.shop_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.shop_products(id) ON DELETE SET NULL,

  -- Item Details
  product_name TEXT NOT NULL,
  product_image_url TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,

  -- Notes
  special_instructions TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SHOP REVIEWS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.shop_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.shop_orders(id) ON DELETE SET NULL,

  -- Review
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,

  -- Response
  shop_response TEXT,
  response_date TIMESTAMPTZ,

  -- Status
  is_hidden BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(shop_id, user_id, order_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_shops_owner ON public.shops(owner_id);
CREATE INDEX IF NOT EXISTS idx_shops_category ON public.shops(category);
CREATE INDEX IF NOT EXISTS idx_shops_island ON public.shops(island);
CREATE INDEX IF NOT EXISTS idx_shops_active ON public.shops(is_active);
CREATE INDEX IF NOT EXISTS idx_shop_products_shop ON public.shop_products(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_products_category ON public.shop_products(category);
CREATE INDEX IF NOT EXISTS idx_shop_products_active ON public.shop_products(is_active);
CREATE INDEX IF NOT EXISTS idx_shop_orders_user ON public.shop_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_orders_shop ON public.shop_orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_orders_status ON public.shop_orders(status);
CREATE INDEX IF NOT EXISTS idx_shop_order_items_order ON public.shop_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_shop_reviews_shop ON public.shop_reviews(shop_id);

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE public.shop_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_reviews ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Categories
DROP POLICY IF EXISTS "Public can view active shop categories" ON public.shop_categories;
CREATE POLICY "Public can view active shop categories"
  ON public.shop_categories FOR SELECT
  USING (is_active = true);

-- Shops
DROP POLICY IF EXISTS "Public can view active shops" ON public.shops;
CREATE POLICY "Public can view active shops"
  ON public.shops FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Owners can manage their shops" ON public.shops;
CREATE POLICY "Owners can manage their shops"
  ON public.shops FOR ALL
  USING (owner_id = auth.uid());

-- Products
DROP POLICY IF EXISTS "Public can view active products" ON public.shop_products;
CREATE POLICY "Public can view active products"
  ON public.shop_products FOR SELECT
  USING (is_active = true AND shop_id IN (SELECT id FROM public.shops WHERE is_active = true));

DROP POLICY IF EXISTS "Shop owners can manage products" ON public.shop_products;
CREATE POLICY "Shop owners can manage products"
  ON public.shop_products FOR ALL
  USING (shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));

-- Orders
DROP POLICY IF EXISTS "Users can view their orders" ON public.shop_orders;
CREATE POLICY "Users can view their orders"
  ON public.shop_orders FOR SELECT
  USING (user_id = auth.uid() OR shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Users can create orders" ON public.shop_orders;
CREATE POLICY "Users can create orders"
  ON public.shop_orders FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users and owners can update orders" ON public.shop_orders;
CREATE POLICY "Users and owners can update orders"
  ON public.shop_orders FOR UPDATE
  USING (user_id = auth.uid() OR shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));

-- Order Items
DROP POLICY IF EXISTS "Users can view their order items" ON public.shop_order_items;
CREATE POLICY "Users can view their order items"
  ON public.shop_order_items FOR SELECT
  USING (order_id IN (SELECT id FROM public.shop_orders WHERE user_id = auth.uid() OR shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid())));

DROP POLICY IF EXISTS "Users can add order items" ON public.shop_order_items;
CREATE POLICY "Users can add order items"
  ON public.shop_order_items FOR INSERT
  WITH CHECK (order_id IN (SELECT id FROM public.shop_orders WHERE user_id = auth.uid()));

-- Reviews
DROP POLICY IF EXISTS "Public can view shop reviews" ON public.shop_reviews;
CREATE POLICY "Public can view shop reviews"
  ON public.shop_reviews FOR SELECT
  USING (is_hidden = false);

DROP POLICY IF EXISTS "Users can create shop reviews" ON public.shop_reviews;
CREATE POLICY "Users can create shop reviews"
  ON public.shop_reviews FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users and owners can update reviews" ON public.shop_reviews;
CREATE POLICY "Users and owners can update reviews"
  ON public.shop_reviews FOR UPDATE
  USING (user_id = auth.uid() OR shop_id IN (SELECT id FROM public.shops WHERE owner_id = auth.uid()));

-- Admin policies
DROP POLICY IF EXISTS "Admins can manage all shops" ON public.shops;
CREATE POLICY "Admins can manage all shops"
  ON public.shops FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can manage shop categories" ON public.shop_categories;
CREATE POLICY "Admins can manage shop categories"
  ON public.shop_categories FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ============================================
-- FUNCTIONS
-- ============================================

-- Generate order number
CREATE OR REPLACE FUNCTION generate_shop_order_number()
RETURNS TEXT AS $$
DECLARE
  ref TEXT;
  exists_count INTEGER;
BEGIN
  LOOP
    ref := 'SH' || to_char(NOW(), 'YYMMDD') || upper(substring(md5(random()::text) from 1 for 4));
    SELECT COUNT(*) INTO exists_count FROM public.shop_orders WHERE order_number = ref;
    IF exists_count = 0 THEN
      RETURN ref;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger for order number
CREATE OR REPLACE FUNCTION set_shop_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_shop_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_shop_order_number_trigger ON public.shop_orders;
CREATE TRIGGER set_shop_order_number_trigger
  BEFORE INSERT ON public.shop_orders
  FOR EACH ROW
  EXECUTE FUNCTION set_shop_order_number();

-- Update shop rating
CREATE OR REPLACE FUNCTION update_shop_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.shops
  SET
    average_rating = (
      SELECT COALESCE(AVG(rating), 5.0)
      FROM public.shop_reviews
      WHERE shop_id = NEW.shop_id AND is_hidden = false
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM public.shop_reviews
      WHERE shop_id = NEW.shop_id AND is_hidden = false
    )
  WHERE id = NEW.shop_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_shop_rating_trigger ON public.shop_reviews;
CREATE TRIGGER update_shop_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.shop_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_shop_rating();

-- ============================================
-- SEED DATA
-- ============================================

-- Shop Categories
INSERT INTO public.shop_categories (name, slug, description, icon, display_order) VALUES
('Supermarket', 'supermarket', 'General grocery stores and supermarkets', 'ShoppingCart', 1),
('Convenience', 'convenience', 'Quick stop convenience stores', 'Store', 2),
('Fresh Produce', 'produce', 'Fresh fruits, vegetables, and local produce', 'Leaf', 3),
('Butcher', 'butcher', 'Fresh meat and seafood', 'Beef', 4),
('Bakery', 'bakery', 'Fresh bread, pastries, and baked goods', 'Croissant', 5),
('Pharmacy', 'pharmacy', 'Medicines and health products', 'Pill', 6),
('Hardware', 'hardware', 'Tools, building materials, and supplies', 'Hammer', 7),
('Electronics', 'electronics', 'Phones, appliances, and electronics', 'Smartphone', 8),
('Baby & Kids', 'baby', 'Baby products and children items', 'Baby', 9),
('Pet Supplies', 'pets', 'Pet food and supplies', 'Dog', 10),
('Office Supplies', 'office', 'Stationery and office equipment', 'Briefcase', 11),
('Beverages', 'beverages', 'Drinks, water, and beverages', 'GlassWater', 12)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.shop_categories IS 'Categories for shops';
COMMENT ON TABLE public.shops IS 'Local shops offering delivery';
COMMENT ON TABLE public.shop_products IS 'Products available in shops';
COMMENT ON TABLE public.shop_orders IS 'Customer orders from shops';
COMMENT ON TABLE public.shop_order_items IS 'Individual items in orders';
COMMENT ON TABLE public.shop_reviews IS 'Customer reviews for shops';
