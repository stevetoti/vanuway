-- VanuJobs - Job Portal & Freelancing Platform for Vanuatu Youth
-- Comprehensive job listings, applications, and freelancer services

-- ============================================
-- JOB CATEGORIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.job_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- JOBS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic Info
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES public.job_categories(id) ON DELETE SET NULL,

  -- Company Details
  company_name TEXT NOT NULL,
  company_logo TEXT,
  company_website TEXT,
  company_description TEXT,

  -- Job Type
  job_type TEXT NOT NULL CHECK (job_type IN ('full_time', 'part_time', 'contract', 'internship', 'casual', 'temporary')),
  experience_level TEXT CHECK (experience_level IN ('entry', 'mid', 'senior', 'executive', 'any')),

  -- Location
  location_type TEXT NOT NULL CHECK (location_type IN ('onsite', 'remote', 'hybrid')),
  island TEXT,
  address TEXT,

  -- Compensation
  salary_min DECIMAL(12,2),
  salary_max DECIMAL(12,2),
  salary_period TEXT DEFAULT 'month' CHECK (salary_period IN ('hour', 'day', 'week', 'month', 'year', 'project')),
  currency TEXT DEFAULT 'VUV',
  show_salary BOOLEAN DEFAULT true,

  -- Requirements
  requirements TEXT[], -- Array of requirements
  responsibilities TEXT[], -- Array of responsibilities
  benefits TEXT[], -- Array of benefits
  skills_required TEXT[], -- Array of required skills
  education_required TEXT,
  years_experience INTEGER,

  -- Application Details
  application_deadline DATE,
  application_email TEXT,
  application_link TEXT,
  how_to_apply TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'closed', 'filled')),
  is_featured BOOLEAN DEFAULT false,
  is_urgent BOOLEAN DEFAULT false,

  -- Counts
  views_count INTEGER DEFAULT 0,
  applications_count INTEGER DEFAULT 0,

  -- Timestamps
  posted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- JOB APPLICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Application Details
  cover_letter TEXT,
  resume_url TEXT,
  portfolio_url TEXT,

  -- Applicant Info (snapshot at time of application)
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  current_location TEXT,

  -- Additional Questions
  years_of_experience INTEGER,
  expected_salary DECIMAL(12,2),
  available_start_date DATE,
  why_interested TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'interview', 'offered', 'hired', 'rejected', 'withdrawn')),
  rejection_reason TEXT,

  -- Employer Notes (private)
  employer_notes TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),

  -- Timestamps
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(job_id, applicant_id)
);

-- ============================================
-- JOB SAVES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.job_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, user_id)
);

-- ============================================
-- FREELANCER PROFILES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.freelancer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Personal Info
  display_name TEXT NOT NULL,
  tagline TEXT, -- Short professional headline
  bio TEXT,
  profile_image TEXT,

  -- Professional Details
  primary_skill TEXT NOT NULL,
  skills TEXT[] NOT NULL,
  experience_years INTEGER,
  education TEXT,
  certifications TEXT[],

  -- Work Preferences
  hourly_rate DECIMAL(10,2),
  min_project_rate DECIMAL(10,2),
  currency TEXT DEFAULT 'VUV',
  availability TEXT CHECK (availability IN ('full_time', 'part_time', 'weekends', 'evenings', 'not_available')),
  available_hours_per_week INTEGER,

  -- Location
  island TEXT,
  location TEXT,
  is_remote_only BOOLEAN DEFAULT false,
  willing_to_travel BOOLEAN DEFAULT false,

  -- Portfolio
  portfolio_url TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  website_url TEXT,
  portfolio_images TEXT[],

  -- Contact
  contact_email TEXT,
  contact_phone TEXT,
  preferred_contact TEXT CHECK (preferred_contact IN ('email', 'phone', 'whatsapp', 'platform')),

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended', 'inactive')),
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,

  -- Stats
  completed_projects INTEGER DEFAULT 0,
  total_earnings DECIMAL(12,2) DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  profile_views INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FREELANCER SERVICES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.freelancer_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID NOT NULL REFERENCES public.freelancer_profiles(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES public.job_categories(id) ON DELETE SET NULL,

  -- Pricing
  price_type TEXT NOT NULL CHECK (price_type IN ('fixed', 'hourly', 'starting_at')),
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'VUV',

  -- Delivery
  delivery_time_days INTEGER,
  revisions_included INTEGER DEFAULT 1,

  -- Features
  features TEXT[],

  -- Media
  images TEXT[],

  is_active BOOLEAN DEFAULT true,
  orders_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FREELANCER REVIEWS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.freelancer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID NOT NULL REFERENCES public.freelancer_profiles(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.freelancer_services(id) ON DELETE SET NULL,

  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  review TEXT,

  -- Breakdown Ratings
  communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
  quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
  delivery_rating INTEGER CHECK (delivery_rating BETWEEN 1 AND 5),
  value_rating INTEGER CHECK (value_rating BETWEEN 1 AND 5),

  -- Response
  freelancer_response TEXT,
  responded_at TIMESTAMPTZ,

  is_verified BOOLEAN DEFAULT false, -- Verified purchase/project

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FREELANCER PROJECTS/ORDERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.freelancer_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID NOT NULL REFERENCES public.freelancer_profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.freelancer_services(id) ON DELETE SET NULL,

  title TEXT NOT NULL,
  description TEXT,

  -- Pricing
  agreed_price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'VUV',

  -- Timeline
  start_date DATE,
  deadline DATE,
  completed_at TIMESTAMPTZ,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'delivered', 'revision', 'completed', 'cancelled', 'disputed')),

  -- Files
  deliverables_url TEXT[],
  requirements_url TEXT[],

  -- Notes
  client_notes TEXT,
  freelancer_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SKILL CATEGORIES (SEEDED)
-- ============================================

INSERT INTO public.job_categories (name, description, icon) VALUES
('Technology & IT', 'Software development, web design, IT support', 'laptop'),
('Design & Creative', 'Graphic design, video editing, photography', 'palette'),
('Writing & Content', 'Copywriting, translation, content creation', 'pen-tool'),
('Marketing & Sales', 'Digital marketing, social media, sales', 'megaphone'),
('Business & Finance', 'Accounting, consulting, administration', 'briefcase'),
('Tourism & Hospitality', 'Hotel, restaurant, tour guide jobs', 'plane'),
('Construction & Trades', 'Building, electrical, plumbing', 'hammer'),
('Agriculture & Fishing', 'Farming, fishing, agriculture work', 'sprout'),
('Education & Training', 'Teaching, tutoring, training', 'graduation-cap'),
('Healthcare', 'Medical, nursing, health services', 'heart-pulse'),
('Transportation', 'Driving, logistics, delivery', 'truck'),
('Retail & Customer Service', 'Sales, customer support, retail', 'shopping-bag'),
('Government & NGO', 'Public sector, non-profit work', 'building-2'),
('Manual Labor', 'General labor, cleaning, maintenance', 'hard-hat'),
('Other', 'Other job categories', 'briefcase')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_jobs_employer ON public.jobs(employer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON public.jobs(category_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON public.jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_jobs_island ON public.jobs(island);
CREATE INDEX IF NOT EXISTS idx_jobs_featured ON public.jobs(is_featured);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON public.jobs(posted_at);

CREATE INDEX IF NOT EXISTS idx_job_applications_job ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant ON public.job_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);

CREATE INDEX IF NOT EXISTS idx_job_saves_user ON public.job_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_job_saves_job ON public.job_saves(job_id);

CREATE INDEX IF NOT EXISTS idx_freelancer_profiles_user ON public.freelancer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_freelancer_profiles_status ON public.freelancer_profiles(status);
CREATE INDEX IF NOT EXISTS idx_freelancer_profiles_primary_skill ON public.freelancer_profiles(primary_skill);
CREATE INDEX IF NOT EXISTS idx_freelancer_profiles_island ON public.freelancer_profiles(island);
CREATE INDEX IF NOT EXISTS idx_freelancer_profiles_featured ON public.freelancer_profiles(is_featured);

CREATE INDEX IF NOT EXISTS idx_freelancer_services_freelancer ON public.freelancer_services(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_freelancer_services_category ON public.freelancer_services(category_id);

CREATE INDEX IF NOT EXISTS idx_freelancer_reviews_freelancer ON public.freelancer_reviews(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_freelancer_reviews_reviewer ON public.freelancer_reviews(reviewer_id);

CREATE INDEX IF NOT EXISTS idx_freelancer_projects_freelancer ON public.freelancer_projects(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_freelancer_projects_client ON public.freelancer_projects(client_id);
CREATE INDEX IF NOT EXISTS idx_freelancer_projects_status ON public.freelancer_projects(status);

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE public.job_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freelancer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freelancer_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freelancer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freelancer_projects ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - JOB CATEGORIES
-- ============================================

DROP POLICY IF EXISTS "Anyone can view active categories" ON public.job_categories;
CREATE POLICY "Anyone can view active categories"
  ON public.job_categories FOR SELECT
  USING (is_active = true);

-- ============================================
-- RLS POLICIES - JOBS
-- ============================================

DROP POLICY IF EXISTS "Anyone can view approved jobs" ON public.jobs;
CREATE POLICY "Anyone can view approved jobs"
  ON public.jobs FOR SELECT
  USING (status = 'approved');

DROP POLICY IF EXISTS "Employers can view own jobs" ON public.jobs;
CREATE POLICY "Employers can view own jobs"
  ON public.jobs FOR SELECT
  USING (employer_id = auth.uid());

DROP POLICY IF EXISTS "Users can create jobs" ON public.jobs;
CREATE POLICY "Users can create jobs"
  ON public.jobs FOR INSERT
  WITH CHECK (employer_id = auth.uid());

DROP POLICY IF EXISTS "Employers can update own jobs" ON public.jobs;
CREATE POLICY "Employers can update own jobs"
  ON public.jobs FOR UPDATE
  USING (employer_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all jobs" ON public.jobs;
CREATE POLICY "Admins can manage all jobs"
  ON public.jobs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ============================================
-- RLS POLICIES - JOB APPLICATIONS
-- ============================================

DROP POLICY IF EXISTS "Applicants can view own applications" ON public.job_applications;
CREATE POLICY "Applicants can view own applications"
  ON public.job_applications FOR SELECT
  USING (applicant_id = auth.uid());

DROP POLICY IF EXISTS "Employers can view applications for their jobs" ON public.job_applications;
CREATE POLICY "Employers can view applications for their jobs"
  ON public.job_applications FOR SELECT
  USING (job_id IN (SELECT id FROM public.jobs WHERE employer_id = auth.uid()));

DROP POLICY IF EXISTS "Users can apply for jobs" ON public.job_applications;
CREATE POLICY "Users can apply for jobs"
  ON public.job_applications FOR INSERT
  WITH CHECK (applicant_id = auth.uid());

DROP POLICY IF EXISTS "Applicants can update own applications" ON public.job_applications;
CREATE POLICY "Applicants can update own applications"
  ON public.job_applications FOR UPDATE
  USING (applicant_id = auth.uid());

DROP POLICY IF EXISTS "Employers can update applications for their jobs" ON public.job_applications;
CREATE POLICY "Employers can update applications for their jobs"
  ON public.job_applications FOR UPDATE
  USING (job_id IN (SELECT id FROM public.jobs WHERE employer_id = auth.uid()));

-- ============================================
-- RLS POLICIES - JOB SAVES
-- ============================================

DROP POLICY IF EXISTS "Users can view own saves" ON public.job_saves;
CREATE POLICY "Users can view own saves"
  ON public.job_saves FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can save jobs" ON public.job_saves;
CREATE POLICY "Users can save jobs"
  ON public.job_saves FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can unsave jobs" ON public.job_saves;
CREATE POLICY "Users can unsave jobs"
  ON public.job_saves FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- RLS POLICIES - FREELANCER PROFILES
-- ============================================

DROP POLICY IF EXISTS "Anyone can view approved freelancers" ON public.freelancer_profiles;
CREATE POLICY "Anyone can view approved freelancers"
  ON public.freelancer_profiles FOR SELECT
  USING (status = 'approved');

DROP POLICY IF EXISTS "Users can view own profile" ON public.freelancer_profiles;
CREATE POLICY "Users can view own profile"
  ON public.freelancer_profiles FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create freelancer profile" ON public.freelancer_profiles;
CREATE POLICY "Users can create freelancer profile"
  ON public.freelancer_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.freelancer_profiles;
CREATE POLICY "Users can update own profile"
  ON public.freelancer_profiles FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.freelancer_profiles;
CREATE POLICY "Admins can manage all profiles"
  ON public.freelancer_profiles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ============================================
-- RLS POLICIES - FREELANCER SERVICES
-- ============================================

DROP POLICY IF EXISTS "Anyone can view active services" ON public.freelancer_services;
CREATE POLICY "Anyone can view active services"
  ON public.freelancer_services FOR SELECT
  USING (is_active = true AND freelancer_id IN (SELECT id FROM public.freelancer_profiles WHERE status = 'approved'));

DROP POLICY IF EXISTS "Freelancers can manage own services" ON public.freelancer_services;
CREATE POLICY "Freelancers can manage own services"
  ON public.freelancer_services FOR ALL
  USING (freelancer_id IN (SELECT id FROM public.freelancer_profiles WHERE user_id = auth.uid()));

-- ============================================
-- RLS POLICIES - FREELANCER REVIEWS
-- ============================================

DROP POLICY IF EXISTS "Anyone can view reviews" ON public.freelancer_reviews;
CREATE POLICY "Anyone can view reviews"
  ON public.freelancer_reviews FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create reviews" ON public.freelancer_reviews;
CREATE POLICY "Users can create reviews"
  ON public.freelancer_reviews FOR INSERT
  WITH CHECK (reviewer_id = auth.uid());

DROP POLICY IF EXISTS "Freelancers can respond to reviews" ON public.freelancer_reviews;
CREATE POLICY "Freelancers can respond to reviews"
  ON public.freelancer_reviews FOR UPDATE
  USING (freelancer_id IN (SELECT id FROM public.freelancer_profiles WHERE user_id = auth.uid()));

-- ============================================
-- RLS POLICIES - FREELANCER PROJECTS
-- ============================================

DROP POLICY IF EXISTS "Clients can view own projects" ON public.freelancer_projects;
CREATE POLICY "Clients can view own projects"
  ON public.freelancer_projects FOR SELECT
  USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Freelancers can view own projects" ON public.freelancer_projects;
CREATE POLICY "Freelancers can view own projects"
  ON public.freelancer_projects FOR SELECT
  USING (freelancer_id IN (SELECT id FROM public.freelancer_profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Clients can create projects" ON public.freelancer_projects;
CREATE POLICY "Clients can create projects"
  ON public.freelancer_projects FOR INSERT
  WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "Project participants can update" ON public.freelancer_projects;
CREATE POLICY "Project participants can update"
  ON public.freelancer_projects FOR UPDATE
  USING (
    client_id = auth.uid() OR
    freelancer_id IN (SELECT id FROM public.freelancer_profiles WHERE user_id = auth.uid())
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Update job application count
CREATE OR REPLACE FUNCTION update_job_application_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.jobs SET applications_count = applications_count + 1 WHERE id = NEW.job_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.jobs SET applications_count = applications_count - 1 WHERE id = OLD.job_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_job_applications_trigger ON public.job_applications;
CREATE TRIGGER update_job_applications_trigger
  AFTER INSERT OR DELETE ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_job_application_count();

-- Update freelancer rating
CREATE OR REPLACE FUNCTION update_freelancer_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.freelancer_profiles
  SET
    avg_rating = (SELECT AVG(rating)::DECIMAL(3,2) FROM public.freelancer_reviews WHERE freelancer_id = NEW.freelancer_id),
    reviews_count = (SELECT COUNT(*) FROM public.freelancer_reviews WHERE freelancer_id = NEW.freelancer_id)
  WHERE id = NEW.freelancer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_freelancer_rating_trigger ON public.freelancer_reviews;
CREATE TRIGGER update_freelancer_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.freelancer_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_freelancer_rating();

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Sample Jobs (will be approved by admin)
INSERT INTO public.jobs (
  employer_id, title, description, category_id, company_name, company_description,
  job_type, experience_level, location_type, island, salary_min, salary_max, salary_period,
  requirements, responsibilities, skills_required, status, posted_at
)
SELECT
  (SELECT id FROM auth.users LIMIT 1),
  'Junior Web Developer',
  'We are looking for a passionate junior web developer to join our team. You will work on exciting projects for local and international clients, building modern web applications.',
  (SELECT id FROM public.job_categories WHERE name = 'Technology & IT'),
  'Pacific Digital Solutions',
  'Leading digital agency in Vanuatu providing web development and digital marketing services.',
  'full_time',
  'entry',
  'hybrid',
  'Efate',
  80000,
  120000,
  'month',
  ARRAY['Basic HTML, CSS, JavaScript knowledge', 'Willingness to learn', 'Good communication skills', 'Team player'],
  ARRAY['Build responsive websites', 'Maintain existing projects', 'Work with senior developers', 'Test and debug code'],
  ARRAY['HTML', 'CSS', 'JavaScript', 'Git'],
  'approved',
  NOW()
WHERE EXISTS (SELECT 1 FROM auth.users LIMIT 1)
ON CONFLICT DO NOTHING;

INSERT INTO public.jobs (
  employer_id, title, description, category_id, company_name, company_description,
  job_type, experience_level, location_type, island, salary_min, salary_max, salary_period,
  requirements, responsibilities, skills_required, status, posted_at, is_urgent
)
SELECT
  (SELECT id FROM auth.users LIMIT 1),
  'Hotel Receptionist',
  'Grand Vanuatu Resort is seeking a friendly and professional receptionist to be the first point of contact for our guests. Must be fluent in English and Bislama.',
  (SELECT id FROM public.job_categories WHERE name = 'Tourism & Hospitality'),
  'Grand Vanuatu Resort',
  'Five-star beachfront resort offering world-class hospitality.',
  'full_time',
  'entry',
  'onsite',
  'Efate',
  50000,
  70000,
  'month',
  ARRAY['High school diploma', 'Fluent in English and Bislama', 'Customer service experience preferred', 'Professional appearance'],
  ARRAY['Welcome and check-in guests', 'Handle reservations', 'Answer phone inquiries', 'Manage guest requests'],
  ARRAY['Customer Service', 'Communication', 'Computer Skills', 'Bislama', 'English'],
  'approved',
  NOW(),
  true
WHERE EXISTS (SELECT 1 FROM auth.users LIMIT 1)
ON CONFLICT DO NOTHING;

INSERT INTO public.jobs (
  employer_id, title, description, category_id, company_name, company_description,
  job_type, experience_level, location_type, island, salary_min, salary_max, salary_period,
  requirements, responsibilities, skills_required, status, posted_at
)
SELECT
  (SELECT id FROM auth.users LIMIT 1),
  'Social Media Manager',
  'Looking for a creative social media manager to grow our online presence. You will create content, manage campaigns, and engage with our community across all platforms.',
  (SELECT id FROM public.job_categories WHERE name = 'Marketing & Sales'),
  'Vanuatu Tourism Board',
  'Official tourism organization promoting Vanuatu as a travel destination.',
  'full_time',
  'mid',
  'hybrid',
  'Efate',
  90000,
  130000,
  'month',
  ARRAY['2+ years social media experience', 'Photography/videography skills', 'Understanding of tourism industry', 'Creative mindset'],
  ARRAY['Create engaging content', 'Manage social media accounts', 'Run advertising campaigns', 'Analyze performance metrics'],
  ARRAY['Social Media', 'Content Creation', 'Photography', 'Marketing', 'Analytics'],
  'approved',
  NOW()
WHERE EXISTS (SELECT 1 FROM auth.users LIMIT 1)
ON CONFLICT DO NOTHING;

INSERT INTO public.jobs (
  employer_id, title, description, category_id, company_name,
  job_type, experience_level, location_type, island, salary_min, salary_max, salary_period,
  requirements, responsibilities, skills_required, status, posted_at
)
SELECT
  (SELECT id FROM auth.users LIMIT 1),
  'Agricultural Field Officer',
  'Join our team to support local farmers with modern agricultural techniques. Travel to rural areas and provide hands-on training and support.',
  (SELECT id FROM public.job_categories WHERE name = 'Agriculture & Fishing'),
  'Vanuatu Agriculture Ministry',
  'contract',
  'mid',
  'onsite',
  'Espiritu Santo',
  70000,
  100000,
  'month',
  ARRAY['Degree in Agriculture or related field', 'Experience working with farmers', 'Valid drivers license', 'Willing to travel'],
  ARRAY['Train farmers on best practices', 'Monitor crop health', 'Provide technical support', 'Collect field data'],
  ARRAY['Agriculture', 'Training', 'Communication', 'Field Work'],
  'approved',
  NOW()
WHERE EXISTS (SELECT 1 FROM auth.users LIMIT 1)
ON CONFLICT DO NOTHING;

INSERT INTO public.jobs (
  employer_id, title, description, category_id, company_name,
  job_type, experience_level, location_type, island, salary_min, salary_max, salary_period,
  requirements, responsibilities, skills_required, status, posted_at
)
SELECT
  (SELECT id FROM auth.users LIMIT 1),
  'Delivery Rider',
  'Be part of VanuWay delivery team! Deliver food and packages across Port Vila. Flexible hours, competitive pay, and tips.',
  (SELECT id FROM public.job_categories WHERE name = 'Transportation'),
  'VanuWay',
  'casual',
  'any',
  'onsite',
  'Efate',
  300,
  500,
  'day',
  ARRAY['Own motorcycle or bicycle', 'Valid license', 'Smartphone', 'Know Port Vila well'],
  ARRAY['Pick up and deliver orders', 'Maintain delivery times', 'Provide excellent service', 'Handle payments'],
  ARRAY['Driving', 'Navigation', 'Customer Service', 'Time Management'],
  'approved',
  NOW()
WHERE EXISTS (SELECT 1 FROM auth.users LIMIT 1)
ON CONFLICT DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.job_categories IS 'Categories for job listings';
COMMENT ON TABLE public.jobs IS 'Job listings posted by employers';
COMMENT ON TABLE public.job_applications IS 'Applications submitted by job seekers';
COMMENT ON TABLE public.job_saves IS 'Jobs saved by users for later';
COMMENT ON TABLE public.freelancer_profiles IS 'Profiles for freelancers offering services';
COMMENT ON TABLE public.freelancer_services IS 'Services offered by freelancers';
COMMENT ON TABLE public.freelancer_reviews IS 'Reviews and ratings for freelancers';
COMMENT ON TABLE public.freelancer_projects IS 'Projects/orders between clients and freelancers';
