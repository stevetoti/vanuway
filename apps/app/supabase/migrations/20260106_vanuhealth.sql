-- VanuHealth Schema for Vanuway
-- Comprehensive healthcare platform: Pharmacies, Hospitals, Labs

-- =====================================================
-- PART 1: PHARMACIES
-- =====================================================

-- Pharmacy registration
CREATE TABLE IF NOT EXISTS pharmacies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  license_number TEXT,

  -- Location
  island TEXT NOT NULL,
  area TEXT,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Contact
  phone TEXT,
  email TEXT,
  whatsapp TEXT,

  -- Operating hours
  opening_time TIME DEFAULT '08:00',
  closing_time TIME DEFAULT '18:00',
  operating_days TEXT[] DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],

  -- Delivery options
  offers_delivery BOOLEAN DEFAULT true,
  uses_platform_riders BOOLEAN DEFAULT true,
  has_own_delivery BOOLEAN DEFAULT false,
  delivery_fee DECIMAL(10, 2) DEFAULT 500,
  free_delivery_above DECIMAL(10, 2),
  delivery_radius_km DECIMAL(5, 2),

  -- Pickup
  offers_pickup BOOLEAN DEFAULT true,

  -- Media
  logo_url TEXT,
  banner_url TEXT,
  images TEXT[] DEFAULT '{}',

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  verified BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,

  -- Stats
  rating DECIMAL(2, 1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  order_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medicine categories
CREATE TABLE IF NOT EXISTS medicine_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pharmacy products (medicines)
CREATE TABLE IF NOT EXISTS pharmacy_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
  category_id UUID REFERENCES medicine_categories(id) ON DELETE SET NULL,

  name TEXT NOT NULL,
  generic_name TEXT,
  description TEXT,
  dosage TEXT,
  manufacturer TEXT,

  -- Prescription requirement
  requires_prescription BOOLEAN DEFAULT false,
  prescription_notes TEXT,

  -- Pricing
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),

  -- Stock
  in_stock BOOLEAN DEFAULT true,
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,

  -- Media
  image_url TEXT,
  images TEXT[] DEFAULT '{}',

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pharmacy orders
CREATE TABLE IF NOT EXISTS pharmacy_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Delivery method
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('delivery', 'pickup')),
  delivery_type TEXT CHECK (delivery_type IN ('platform_rider', 'pharmacy_delivery')),

  -- Delivery address (for delivery orders)
  delivery_address TEXT,
  delivery_island TEXT,
  delivery_area TEXT,
  delivery_notes TEXT,
  delivery_latitude DECIMAL(10, 8),
  delivery_longitude DECIMAL(11, 8),

  -- Rider assignment
  rider_id UUID REFERENCES drivers(id) ON DELETE SET NULL,

  -- Prescription
  has_prescription_items BOOLEAN DEFAULT false,
  prescription_url TEXT,
  prescription_verified BOOLEAN DEFAULT false,
  prescription_verified_at TIMESTAMPTZ,
  prescription_verified_by UUID,

  -- Pricing
  subtotal DECIMAL(10, 2) NOT NULL,
  delivery_fee DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,

  -- Payment
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'mobile_money', 'card')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'prescription_review', 'confirmed', 'preparing',
    'ready_for_pickup', 'out_for_delivery', 'delivered', 'completed', 'cancelled'
  )),

  -- Timestamps
  confirmed_at TIMESTAMPTZ,
  prepared_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pharmacy order items
CREATE TABLE IF NOT EXISTS pharmacy_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES pharmacy_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES pharmacy_products(id) ON DELETE SET NULL,

  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  requires_prescription BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pharmacy reviews
CREATE TABLE IF NOT EXISTS pharmacy_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES pharmacy_orders(id) ON DELETE SET NULL,

  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id, user_id)
);

-- =====================================================
-- PART 2: HOSPITALS & CLINICS
-- =====================================================

-- Hospital/Clinic registration
CREATE TABLE IF NOT EXISTS hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('hospital', 'clinic', 'health_center', 'specialist_center')),
  description TEXT,
  license_number TEXT,

  -- Location
  island TEXT NOT NULL,
  area TEXT,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Contact
  phone TEXT,
  emergency_phone TEXT,
  email TEXT,
  website TEXT,

  -- Operating hours
  is_24_hours BOOLEAN DEFAULT false,
  opening_time TIME DEFAULT '08:00',
  closing_time TIME DEFAULT '17:00',
  operating_days TEXT[] DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],

  -- Features
  has_emergency BOOLEAN DEFAULT false,
  has_ambulance BOOLEAN DEFAULT false,
  has_pharmacy BOOLEAN DEFAULT false,
  has_lab BOOLEAN DEFAULT false,
  accepts_insurance BOOLEAN DEFAULT false,
  insurance_providers TEXT[],

  -- Media
  logo_url TEXT,
  banner_url TEXT,
  images TEXT[] DEFAULT '{}',

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  verified BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,

  -- Stats
  rating DECIMAL(2, 1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hospital departments
CREATE TABLE IF NOT EXISTS hospital_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,

  -- Consultation fee
  consultation_fee DECIMAL(10, 2),

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Doctors
CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
  department_id UUID REFERENCES hospital_departments(id) ON DELETE SET NULL,

  -- Personal info
  title TEXT DEFAULT 'Dr.',
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),

  -- Professional info
  specialization TEXT NOT NULL,
  qualifications TEXT[],
  experience_years INTEGER,
  registration_number TEXT,

  -- Bio
  bio TEXT,
  languages TEXT[] DEFAULT ARRAY['English', 'Bislama'],

  -- Consultation
  consultation_fee DECIMAL(10, 2),
  consultation_duration INTEGER DEFAULT 30, -- minutes

  -- Availability
  available_days TEXT[] DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  available_from TIME DEFAULT '09:00',
  available_to TIME DEFAULT '17:00',

  -- Media
  photo_url TEXT,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hospital services
CREATE TABLE IF NOT EXISTS hospital_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
  department_id UUID REFERENCES hospital_departments(id) ON DELETE SET NULL,

  name TEXT NOT NULL,
  description TEXT,

  -- Pricing
  price DECIMAL(10, 2),
  price_from DECIMAL(10, 2),
  price_to DECIMAL(10, 2),

  -- Duration
  duration_minutes INTEGER,

  -- Requirements
  requires_appointment BOOLEAN DEFAULT true,
  requires_referral BOOLEAN DEFAULT false,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hospital appointments
CREATE TABLE IF NOT EXISTS hospital_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_number TEXT UNIQUE NOT NULL,
  hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  department_id UUID REFERENCES hospital_departments(id) ON DELETE SET NULL,
  service_id UUID REFERENCES hospital_services(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Patient info
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  patient_email TEXT,
  patient_dob DATE,
  patient_gender TEXT,

  -- Appointment details
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  appointment_type TEXT DEFAULT 'consultation' CHECK (appointment_type IN ('consultation', 'follow_up', 'procedure', 'test')),

  -- Reason
  reason TEXT,
  symptoms TEXT,
  notes TEXT,

  -- Pricing
  consultation_fee DECIMAL(10, 2),

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show'
  )),

  -- Timestamps
  confirmed_at TIMESTAMPTZ,
  checked_in_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hospital reviews
CREATE TABLE IF NOT EXISTS hospital_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES hospital_appointments(id) ON DELETE SET NULL,
  doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,

  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PART 3: LABS & DIAGNOSTICS
-- =====================================================

-- Lab registration
CREATE TABLE IF NOT EXISTS labs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  license_number TEXT,
  accreditation TEXT,

  -- Location
  island TEXT NOT NULL,
  area TEXT,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Contact
  phone TEXT,
  email TEXT,
  whatsapp TEXT,

  -- Operating hours
  opening_time TIME DEFAULT '07:00',
  closing_time TIME DEFAULT '18:00',
  operating_days TEXT[] DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],

  -- Features
  offers_home_collection BOOLEAN DEFAULT false,
  home_collection_fee DECIMAL(10, 2),
  home_collection_radius_km DECIMAL(5, 2),
  offers_online_results BOOLEAN DEFAULT true,
  average_result_time_hours INTEGER DEFAULT 24,

  -- Media
  logo_url TEXT,
  banner_url TEXT,
  images TEXT[] DEFAULT '{}',

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  verified BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,

  -- Stats
  rating DECIMAL(2, 1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lab test categories
CREATE TABLE IF NOT EXISTS lab_test_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lab tests
CREATE TABLE IF NOT EXISTS lab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
  category_id UUID REFERENCES lab_test_categories(id) ON DELETE SET NULL,

  name TEXT NOT NULL,
  description TEXT,
  test_code TEXT,

  -- Pricing
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),

  -- Test details
  sample_type TEXT, -- blood, urine, stool, etc.
  preparation_instructions TEXT,
  fasting_required BOOLEAN DEFAULT false,
  fasting_hours INTEGER,

  -- Timing
  result_time_hours INTEGER DEFAULT 24,

  -- Requirements
  requires_prescription BOOLEAN DEFAULT false,
  home_collection_available BOOLEAN DEFAULT true,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lab bookings
CREATE TABLE IF NOT EXISTS lab_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number TEXT UNIQUE NOT NULL,
  lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Patient info
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  patient_email TEXT,
  patient_dob DATE,
  patient_gender TEXT,

  -- Collection method
  collection_method TEXT NOT NULL CHECK (collection_method IN ('lab_visit', 'home_collection')),

  -- For lab visit
  appointment_date DATE,
  appointment_time TIME,

  -- For home collection
  collection_address TEXT,
  collection_island TEXT,
  collection_area TEXT,
  collection_date DATE,
  collection_time_slot TEXT,
  collection_notes TEXT,

  -- Prescription (if required)
  prescription_url TEXT,
  prescription_verified BOOLEAN DEFAULT false,

  -- Pricing
  tests_total DECIMAL(10, 2) NOT NULL,
  collection_fee DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,

  -- Payment
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'mobile_money', 'card')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'sample_collected', 'processing',
    'results_ready', 'completed', 'cancelled'
  )),

  -- Timestamps
  confirmed_at TIMESTAMPTZ,
  collected_at TIMESTAMPTZ,
  results_ready_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lab booking items (tests ordered)
CREATE TABLE IF NOT EXISTS lab_booking_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES lab_bookings(id) ON DELETE CASCADE,
  test_id UUID REFERENCES lab_tests(id) ON DELETE SET NULL,

  test_name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lab results
CREATE TABLE IF NOT EXISTS lab_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES lab_bookings(id) ON DELETE CASCADE,
  test_id UUID REFERENCES lab_tests(id) ON DELETE SET NULL,

  test_name TEXT NOT NULL,
  result_value TEXT,
  result_unit TEXT,
  reference_range TEXT,
  status TEXT CHECK (status IN ('normal', 'abnormal', 'critical')),

  notes TEXT,

  -- File upload
  result_file_url TEXT,

  -- Verification
  verified_by TEXT,
  verified_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lab reviews
CREATE TABLE IF NOT EXISTS lab_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES lab_bookings(id) ON DELETE SET NULL,

  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_test_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_booking_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view approved pharmacies" ON pharmacies;
DROP POLICY IF EXISTS "Users can create pharmacies" ON pharmacies;
DROP POLICY IF EXISTS "Owners can update their pharmacies" ON pharmacies;
DROP POLICY IF EXISTS "Anyone can view medicine categories" ON medicine_categories;
DROP POLICY IF EXISTS "Anyone can view active pharmacy products" ON pharmacy_products;
DROP POLICY IF EXISTS "Pharmacy owners can manage products" ON pharmacy_products;
DROP POLICY IF EXISTS "Users can view their orders" ON pharmacy_orders;
DROP POLICY IF EXISTS "Pharmacy owners can view orders" ON pharmacy_orders;
DROP POLICY IF EXISTS "Users can create orders" ON pharmacy_orders;
DROP POLICY IF EXISTS "Anyone can view approved hospitals" ON hospitals;
DROP POLICY IF EXISTS "Users can create hospitals" ON hospitals;
DROP POLICY IF EXISTS "Owners can update their hospitals" ON hospitals;
DROP POLICY IF EXISTS "Anyone can view hospital departments" ON hospital_departments;
DROP POLICY IF EXISTS "Anyone can view active doctors" ON doctors;
DROP POLICY IF EXISTS "Anyone can view hospital services" ON hospital_services;
DROP POLICY IF EXISTS "Users can view their appointments" ON hospital_appointments;
DROP POLICY IF EXISTS "Hospital admins can view appointments" ON hospital_appointments;
DROP POLICY IF EXISTS "Users can create appointments" ON hospital_appointments;
DROP POLICY IF EXISTS "Anyone can view approved labs" ON labs;
DROP POLICY IF EXISTS "Users can create labs" ON labs;
DROP POLICY IF EXISTS "Owners can update their labs" ON labs;
DROP POLICY IF EXISTS "Anyone can view lab test categories" ON lab_test_categories;
DROP POLICY IF EXISTS "Anyone can view active lab tests" ON lab_tests;
DROP POLICY IF EXISTS "Users can view their bookings" ON lab_bookings;
DROP POLICY IF EXISTS "Lab admins can view bookings" ON lab_bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON lab_bookings;
DROP POLICY IF EXISTS "Users can view their results" ON lab_results;

-- Pharmacy policies
CREATE POLICY "Anyone can view approved pharmacies" ON pharmacies FOR SELECT
  USING (status = 'approved' OR user_id = auth.uid());

CREATE POLICY "Users can create pharmacies" ON pharmacies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update their pharmacies" ON pharmacies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view medicine categories" ON medicine_categories FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view active pharmacy products" ON pharmacy_products FOR SELECT
  USING (is_active = true OR EXISTS (
    SELECT 1 FROM pharmacies WHERE id = pharmacy_id AND user_id = auth.uid()
  ));

CREATE POLICY "Pharmacy owners can manage products" ON pharmacy_products FOR ALL
  USING (EXISTS (SELECT 1 FROM pharmacies WHERE id = pharmacy_id AND user_id = auth.uid()));

CREATE POLICY "Users can view their orders" ON pharmacy_orders FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM pharmacies WHERE id = pharmacy_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create orders" ON pharmacy_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Order items viewable with order" ON pharmacy_order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM pharmacy_orders WHERE id = order_id AND (user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM pharmacies WHERE id = pharmacy_id AND user_id = auth.uid()
    ))
  ));

CREATE POLICY "Anyone can view pharmacy reviews" ON pharmacy_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create pharmacy reviews" ON pharmacy_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Hospital policies
CREATE POLICY "Anyone can view approved hospitals" ON hospitals FOR SELECT
  USING (status = 'approved' OR user_id = auth.uid());

CREATE POLICY "Users can create hospitals" ON hospitals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update their hospitals" ON hospitals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view hospital departments" ON hospital_departments FOR SELECT
  USING (is_active = true OR EXISTS (
    SELECT 1 FROM hospitals WHERE id = hospital_id AND user_id = auth.uid()
  ));

CREATE POLICY "Anyone can view active doctors" ON doctors FOR SELECT
  USING (is_active = true OR EXISTS (
    SELECT 1 FROM hospitals WHERE id = hospital_id AND user_id = auth.uid()
  ));

CREATE POLICY "Hospital admins can manage doctors" ON doctors FOR ALL
  USING (EXISTS (SELECT 1 FROM hospitals WHERE id = hospital_id AND user_id = auth.uid()));

CREATE POLICY "Anyone can view hospital services" ON hospital_services FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can view their appointments" ON hospital_appointments FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM hospitals WHERE id = hospital_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create appointments" ON hospital_appointments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Appointment updates" ON hospital_appointments FOR UPDATE
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM hospitals WHERE id = hospital_id AND user_id = auth.uid()
  ));

CREATE POLICY "Anyone can view hospital reviews" ON hospital_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create hospital reviews" ON hospital_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Lab policies
CREATE POLICY "Anyone can view approved labs" ON labs FOR SELECT
  USING (status = 'approved' OR user_id = auth.uid());

CREATE POLICY "Users can create labs" ON labs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update their labs" ON labs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view lab test categories" ON lab_test_categories FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view active lab tests" ON lab_tests FOR SELECT
  USING (is_active = true OR EXISTS (
    SELECT 1 FROM labs WHERE id = lab_id AND user_id = auth.uid()
  ));

CREATE POLICY "Lab owners can manage tests" ON lab_tests FOR ALL
  USING (EXISTS (SELECT 1 FROM labs WHERE id = lab_id AND user_id = auth.uid()));

CREATE POLICY "Users can view their bookings" ON lab_bookings FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM labs WHERE id = lab_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create bookings" ON lab_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Booking items viewable with booking" ON lab_booking_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM lab_bookings WHERE id = booking_id AND (user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM labs WHERE id = lab_id AND user_id = auth.uid()
    ))
  ));

CREATE POLICY "Users can view their results" ON lab_results FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM lab_bookings WHERE id = booking_id AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM lab_bookings lb JOIN labs l ON lb.lab_id = l.id
    WHERE lb.id = booking_id AND l.user_id = auth.uid()
  ));

CREATE POLICY "Lab owners can manage results" ON lab_results FOR ALL
  USING (EXISTS (
    SELECT 1 FROM lab_bookings lb JOIN labs l ON lb.lab_id = l.id
    WHERE lb.id = booking_id AND l.user_id = auth.uid()
  ));

CREATE POLICY "Anyone can view lab reviews" ON lab_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create lab reviews" ON lab_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_pharmacies_user_id ON pharmacies(user_id);
CREATE INDEX IF NOT EXISTS idx_pharmacies_status ON pharmacies(status);
CREATE INDEX IF NOT EXISTS idx_pharmacies_island ON pharmacies(island);
CREATE INDEX IF NOT EXISTS idx_pharmacy_products_pharmacy_id ON pharmacy_products(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_products_category ON pharmacy_products(category_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_orders_user_id ON pharmacy_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_orders_pharmacy_id ON pharmacy_orders(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_orders_status ON pharmacy_orders(status);

CREATE INDEX IF NOT EXISTS idx_hospitals_user_id ON hospitals(user_id);
CREATE INDEX IF NOT EXISTS idx_hospitals_status ON hospitals(status);
CREATE INDEX IF NOT EXISTS idx_hospitals_island ON hospitals(island);
CREATE INDEX IF NOT EXISTS idx_doctors_hospital_id ON doctors(hospital_id);
CREATE INDEX IF NOT EXISTS idx_hospital_appointments_user_id ON hospital_appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_hospital_appointments_hospital_id ON hospital_appointments(hospital_id);
CREATE INDEX IF NOT EXISTS idx_hospital_appointments_doctor_id ON hospital_appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_hospital_appointments_date ON hospital_appointments(appointment_date);

CREATE INDEX IF NOT EXISTS idx_labs_user_id ON labs(user_id);
CREATE INDEX IF NOT EXISTS idx_labs_status ON labs(status);
CREATE INDEX IF NOT EXISTS idx_labs_island ON labs(island);
CREATE INDEX IF NOT EXISTS idx_lab_tests_lab_id ON lab_tests(lab_id);
CREATE INDEX IF NOT EXISTS idx_lab_bookings_user_id ON lab_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_bookings_lab_id ON lab_bookings(lab_id);
CREATE INDEX IF NOT EXISTS idx_lab_bookings_status ON lab_bookings(status);

-- =====================================================
-- SEED DATA
-- =====================================================

-- Medicine categories
INSERT INTO medicine_categories (name, icon, description, sort_order) VALUES
  ('Pain Relief', '💊', 'Painkillers and anti-inflammatory medicines', 1),
  ('Cold & Flu', '🤧', 'Cold, cough, and flu remedies', 2),
  ('Antibiotics', '🦠', 'Prescription antibiotics', 3),
  ('Vitamins & Supplements', '💪', 'Vitamins, minerals, and dietary supplements', 4),
  ('First Aid', '🩹', 'Bandages, antiseptics, and first aid supplies', 5),
  ('Skin Care', '🧴', 'Creams, ointments, and skin treatments', 6),
  ('Digestive Health', '🫃', 'Antacids, laxatives, and digestive aids', 7),
  ('Allergy', '🌸', 'Antihistamines and allergy relief', 8),
  ('Eye & Ear Care', '👁️', 'Eye drops, ear drops, and related products', 9),
  ('Diabetes Care', '🩸', 'Diabetes management supplies', 10),
  ('Heart & Blood Pressure', '❤️', 'Cardiovascular medications', 11),
  ('Baby & Child', '👶', 'Pediatric medicines and baby care', 12),
  ('Women Health', '🚺', 'Women-specific health products', 13),
  ('Men Health', '🚹', 'Men-specific health products', 14),
  ('Personal Care', '🧼', 'Hygiene and personal care items', 15)
ON CONFLICT (name) DO NOTHING;

-- Lab test categories
INSERT INTO lab_test_categories (name, icon, description, sort_order) VALUES
  ('Blood Tests', '🩸', 'Complete blood count, glucose, lipid profile, etc.', 1),
  ('Urine Tests', '🧪', 'Urinalysis and urine culture', 2),
  ('Diabetes', '📊', 'HbA1c, fasting glucose, insulin', 3),
  ('Thyroid', '🦋', 'TSH, T3, T4 and thyroid panel', 4),
  ('Liver Function', '🫀', 'ALT, AST, bilirubin, albumin', 5),
  ('Kidney Function', '🫘', 'Creatinine, BUN, eGFR', 6),
  ('Heart Health', '❤️', 'Cholesterol, triglycerides, cardiac markers', 7),
  ('Infectious Disease', '🦠', 'HIV, Hepatitis, STD testing', 8),
  ('Hormones', '⚗️', 'Testosterone, estrogen, cortisol', 9),
  ('Pregnancy', '🤰', 'Pregnancy tests, prenatal screening', 10),
  ('Imaging', '📷', 'X-ray, ultrasound, CT scan', 11),
  ('COVID-19', '😷', 'PCR and rapid antigen tests', 12)
ON CONFLICT (name) DO NOTHING;

-- Sample pharmacy
INSERT INTO pharmacies (
  user_id, name, description, license_number,
  island, area, address, phone, email,
  offers_delivery, uses_platform_riders, has_own_delivery,
  delivery_fee, offers_pickup, status, verified, featured
) VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'VanuMed Pharmacy',
  'Your trusted pharmacy in Port Vila. We stock a wide range of medicines, health products, and provide professional pharmaceutical advice.',
  'PH-2024-001',
  'Efate', 'Port Vila CBD', 'Main Street, Port Vila',
  '+678 22222', 'info@vanumed.vu',
  true, true, false, 500, true,
  'approved', true, true
);

-- Sample hospital
INSERT INTO hospitals (
  user_id, name, type, description, license_number,
  island, area, address, phone, emergency_phone, email,
  is_24_hours, has_emergency, has_ambulance, has_pharmacy, has_lab,
  status, verified, featured
) VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'Vila Central Hospital',
  'hospital',
  'The main referral hospital for Vanuatu providing comprehensive medical services including emergency care, surgery, maternity, and specialist consultations.',
  'HOS-2024-001',
  'Efate', 'Port Vila', 'Hospital Road, Port Vila',
  '+678 22100', '+678 22111', 'info@vilahospital.vu',
  true, true, true, true, true,
  'approved', true, true
);

-- Sample lab
INSERT INTO labs (
  user_id, name, description, license_number, accreditation,
  island, area, address, phone, email,
  offers_home_collection, home_collection_fee, offers_online_results,
  average_result_time_hours, status, verified, featured
) VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'Pacific Diagnostics Lab',
  'Modern diagnostic laboratory offering a comprehensive range of pathology and imaging services with quick turnaround times.',
  'LAB-2024-001',
  'ISO 15189',
  'Efate', 'Port Vila CBD', 'Kumul Highway, Port Vila',
  '+678 23456', 'info@pacificdiagnostics.vu',
  true, 1000, true, 24,
  'approved', true, true
);

-- Add sample departments to hospital
INSERT INTO hospital_departments (hospital_id, name, description, icon, consultation_fee) VALUES
  ((SELECT id FROM hospitals WHERE name = 'Vila Central Hospital'), 'General Medicine', 'Primary care and general health consultations', '🏥', 3000),
  ((SELECT id FROM hospitals WHERE name = 'Vila Central Hospital'), 'Emergency', '24/7 emergency medical services', '🚨', 5000),
  ((SELECT id FROM hospitals WHERE name = 'Vila Central Hospital'), 'Pediatrics', 'Child health and development', '👶', 3500),
  ((SELECT id FROM hospitals WHERE name = 'Vila Central Hospital'), 'Obstetrics & Gynecology', 'Women health, pregnancy and childbirth', '🤰', 4000),
  ((SELECT id FROM hospitals WHERE name = 'Vila Central Hospital'), 'Surgery', 'Surgical procedures and operations', '🔪', 10000),
  ((SELECT id FROM hospitals WHERE name = 'Vila Central Hospital'), 'Orthopedics', 'Bone, joint, and muscle conditions', '🦴', 4500),
  ((SELECT id FROM hospitals WHERE name = 'Vila Central Hospital'), 'Cardiology', 'Heart and cardiovascular health', '❤️', 5000),
  ((SELECT id FROM hospitals WHERE name = 'Vila Central Hospital'), 'Dental', 'Dental and oral health services', '🦷', 2500);

-- Add sample doctors
INSERT INTO doctors (hospital_id, department_id, title, first_name, last_name, gender, specialization, qualifications, experience_years, consultation_fee, bio) VALUES
  (
    (SELECT id FROM hospitals WHERE name = 'Vila Central Hospital'),
    (SELECT id FROM hospital_departments WHERE name = 'General Medicine' LIMIT 1),
    'Dr.', 'James', 'Naupa', 'male', 'General Practitioner',
    ARRAY['MBBS', 'MD'], 15, 3000,
    'Experienced general practitioner with over 15 years of service in Vanuatu. Fluent in English, Bislama, and French.'
  ),
  (
    (SELECT id FROM hospitals WHERE name = 'Vila Central Hospital'),
    (SELECT id FROM hospital_departments WHERE name = 'Pediatrics' LIMIT 1),
    'Dr.', 'Marie', 'Tari', 'female', 'Pediatrician',
    ARRAY['MBBS', 'DCH', 'MRCPCH'], 10, 3500,
    'Dedicated pediatrician specializing in child health and development. Passionate about improving child healthcare in the Pacific.'
  ),
  (
    (SELECT id FROM hospitals WHERE name = 'Vila Central Hospital'),
    (SELECT id FROM hospital_departments WHERE name = 'Obstetrics & Gynecology' LIMIT 1),
    'Dr.', 'Sarah', 'Moli', 'female', 'OB/GYN Specialist',
    ARRAY['MBBS', 'MRCOG'], 12, 4000,
    'Specialist in women health, pregnancy care, and gynecological conditions. Committed to safe motherhood in Vanuatu.'
  );

-- Add sample pharmacy products
INSERT INTO pharmacy_products (pharmacy_id, category_id, name, generic_name, description, dosage, price, requires_prescription, in_stock, stock_quantity) VALUES
  (
    (SELECT id FROM pharmacies WHERE name = 'VanuMed Pharmacy'),
    (SELECT id FROM medicine_categories WHERE name = 'Pain Relief'),
    'Panadol Extra', 'Paracetamol + Caffeine',
    'Fast and effective pain relief for headaches, muscle pain, and fever',
    '500mg + 65mg', 850, false, true, 100
  ),
  (
    (SELECT id FROM pharmacies WHERE name = 'VanuMed Pharmacy'),
    (SELECT id FROM medicine_categories WHERE name = 'Pain Relief'),
    'Ibuprofen Tablets', 'Ibuprofen',
    'Anti-inflammatory pain relief for muscle pain, dental pain, and arthritis',
    '400mg', 650, false, true, 80
  ),
  (
    (SELECT id FROM pharmacies WHERE name = 'VanuMed Pharmacy'),
    (SELECT id FROM medicine_categories WHERE name = 'Antibiotics'),
    'Amoxicillin Capsules', 'Amoxicillin',
    'Broad-spectrum antibiotic for bacterial infections',
    '500mg', 1200, true, true, 50
  ),
  (
    (SELECT id FROM pharmacies WHERE name = 'VanuMed Pharmacy'),
    (SELECT id FROM medicine_categories WHERE name = 'Cold & Flu'),
    'Strepsils Lozenges', 'Amylmetacresol + Dichlorobenzyl alcohol',
    'Soothing relief for sore throats and minor mouth infections',
    '24 lozenges', 450, false, true, 60
  ),
  (
    (SELECT id FROM pharmacies WHERE name = 'VanuMed Pharmacy'),
    (SELECT id FROM medicine_categories WHERE name = 'Vitamins & Supplements'),
    'Vitamin C 1000mg', 'Ascorbic Acid',
    'High-strength vitamin C for immune support',
    '1000mg, 60 tablets', 1500, false, true, 40
  ),
  (
    (SELECT id FROM pharmacies WHERE name = 'VanuMed Pharmacy'),
    (SELECT id FROM medicine_categories WHERE name = 'Diabetes Care'),
    'Metformin Tablets', 'Metformin Hydrochloride',
    'For management of type 2 diabetes',
    '500mg', 800, true, true, 30
  ),
  (
    (SELECT id FROM pharmacies WHERE name = 'VanuMed Pharmacy'),
    (SELECT id FROM medicine_categories WHERE name = 'First Aid'),
    'First Aid Kit', 'Various',
    'Complete first aid kit with bandages, antiseptics, and essential supplies',
    '25 pieces', 2500, false, true, 20
  );

-- Add sample lab tests
INSERT INTO lab_tests (lab_id, category_id, name, description, test_code, price, sample_type, result_time_hours, fasting_required, fasting_hours, requires_prescription, home_collection_available) VALUES
  (
    (SELECT id FROM labs WHERE name = 'Pacific Diagnostics Lab'),
    (SELECT id FROM lab_test_categories WHERE name = 'Blood Tests'),
    'Complete Blood Count (CBC)', 'Full blood count including RBC, WBC, platelets, hemoglobin',
    'CBC-001', 2500, 'Blood', 4, false, NULL, false, true
  ),
  (
    (SELECT id FROM labs WHERE name = 'Pacific Diagnostics Lab'),
    (SELECT id FROM lab_test_categories WHERE name = 'Diabetes'),
    'Fasting Blood Glucose', 'Blood sugar level after fasting',
    'GLU-001', 1500, 'Blood', 2, true, 8, false, true
  ),
  (
    (SELECT id FROM labs WHERE name = 'Pacific Diagnostics Lab'),
    (SELECT id FROM lab_test_categories WHERE name = 'Diabetes'),
    'HbA1c', 'Average blood sugar over 2-3 months',
    'HBA-001', 3500, 'Blood', 24, false, NULL, false, true
  ),
  (
    (SELECT id FROM labs WHERE name = 'Pacific Diagnostics Lab'),
    (SELECT id FROM lab_test_categories WHERE name = 'Heart Health'),
    'Lipid Profile', 'Complete cholesterol panel including HDL, LDL, triglycerides',
    'LIP-001', 4000, 'Blood', 6, true, 12, false, true
  ),
  (
    (SELECT id FROM labs WHERE name = 'Pacific Diagnostics Lab'),
    (SELECT id FROM lab_test_categories WHERE name = 'Liver Function'),
    'Liver Function Test (LFT)', 'AST, ALT, ALP, bilirubin, albumin',
    'LFT-001', 4500, 'Blood', 6, false, NULL, false, true
  ),
  (
    (SELECT id FROM labs WHERE name = 'Pacific Diagnostics Lab'),
    (SELECT id FROM lab_test_categories WHERE name = 'Thyroid'),
    'Thyroid Panel (TSH, T3, T4)', 'Complete thyroid function assessment',
    'THY-001', 5000, 'Blood', 24, false, NULL, false, true
  ),
  (
    (SELECT id FROM labs WHERE name = 'Pacific Diagnostics Lab'),
    (SELECT id FROM lab_test_categories WHERE name = 'COVID-19'),
    'COVID-19 PCR Test', 'Gold standard COVID-19 detection',
    'COV-001', 3000, 'Nasal swab', 24, false, NULL, false, true
  ),
  (
    (SELECT id FROM labs WHERE name = 'Pacific Diagnostics Lab'),
    (SELECT id FROM lab_test_categories WHERE name = 'Urine Tests'),
    'Urinalysis', 'Complete urine examination',
    'URI-001', 1500, 'Urine', 4, false, NULL, false, false
  ),
  (
    (SELECT id FROM labs WHERE name = 'Pacific Diagnostics Lab'),
    (SELECT id FROM lab_test_categories WHERE name = 'Pregnancy'),
    'Pregnancy Test (Blood)', 'Beta-hCG blood test for pregnancy confirmation',
    'PRG-001', 2000, 'Blood', 4, false, NULL, false, true
  );
