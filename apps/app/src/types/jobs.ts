// VanuJobs - Job Portal & Freelancing Types

export interface JobCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Job {
  id: string;
  employer_id: string;
  title: string;
  description: string;
  category_id: string | null;
  category?: JobCategory;
  company_name: string;
  company_logo: string | null;
  company_website: string | null;
  company_description: string | null;
  job_type: JobType;
  experience_level: ExperienceLevel | null;
  location_type: LocationType;
  island: string | null;
  address: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_period: SalaryPeriod;
  currency: string;
  show_salary: boolean;
  requirements: string[] | null;
  responsibilities: string[] | null;
  benefits: string[] | null;
  skills_required: string[] | null;
  education_required: string | null;
  years_experience: number | null;
  application_deadline: string | null;
  application_email: string | null;
  application_link: string | null;
  how_to_apply: string | null;
  status: JobStatus;
  is_featured: boolean;
  is_urgent: boolean;
  views_count: number;
  applications_count: number;
  posted_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobApplication {
  id: string;
  job_id: string;
  job?: Job;
  applicant_id: string;
  cover_letter: string | null;
  resume_url: string | null;
  portfolio_url: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  current_location: string | null;
  years_of_experience: number | null;
  expected_salary: number | null;
  available_start_date: string | null;
  why_interested: string | null;
  status: ApplicationStatus;
  rejection_reason: string | null;
  employer_notes: string | null;
  rating: number | null;
  applied_at: string;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobSave {
  id: string;
  job_id: string;
  user_id: string;
  created_at: string;
}

export interface FreelancerProfile {
  id: string;
  user_id: string;
  display_name: string;
  tagline: string | null;
  bio: string | null;
  profile_image: string | null;
  primary_skill: string;
  skills: string[];
  experience_years: number | null;
  education: string | null;
  certifications: string[] | null;
  hourly_rate: number | null;
  min_project_rate: number | null;
  currency: string;
  availability: Availability | null;
  available_hours_per_week: number | null;
  island: string | null;
  location: string | null;
  is_remote_only: boolean;
  willing_to_travel: boolean;
  portfolio_url: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  portfolio_images: string[] | null;
  contact_email: string | null;
  contact_phone: string | null;
  preferred_contact: PreferredContact | null;
  status: FreelancerStatus;
  is_featured: boolean;
  is_verified: boolean;
  completed_projects: number;
  total_earnings: number;
  avg_rating: number;
  reviews_count: number;
  profile_views: number;
  created_at: string;
  updated_at: string;
}

export interface FreelancerService {
  id: string;
  freelancer_id: string;
  freelancer?: FreelancerProfile;
  title: string;
  description: string;
  category_id: string | null;
  category?: JobCategory;
  price_type: PriceType;
  price: number;
  currency: string;
  delivery_time_days: number | null;
  revisions_included: number;
  features: string[] | null;
  images: string[] | null;
  is_active: boolean;
  orders_count: number;
  created_at: string;
  updated_at: string;
}

export interface FreelancerReview {
  id: string;
  freelancer_id: string;
  reviewer_id: string;
  service_id: string | null;
  rating: number;
  title: string | null;
  review: string | null;
  communication_rating: number | null;
  quality_rating: number | null;
  delivery_rating: number | null;
  value_rating: number | null;
  freelancer_response: string | null;
  responded_at: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface FreelancerProject {
  id: string;
  freelancer_id: string;
  freelancer?: FreelancerProfile;
  client_id: string;
  service_id: string | null;
  service?: FreelancerService;
  title: string;
  description: string | null;
  agreed_price: number;
  currency: string;
  start_date: string | null;
  deadline: string | null;
  completed_at: string | null;
  status: ProjectStatus;
  deliverables_url: string[] | null;
  requirements_url: string[] | null;
  client_notes: string | null;
  freelancer_notes: string | null;
  created_at: string;
  updated_at: string;
}

// Enums as union types
export type JobType = 'full_time' | 'part_time' | 'contract' | 'internship' | 'casual' | 'temporary';
export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'executive' | 'any';
export type LocationType = 'onsite' | 'remote' | 'hybrid';
export type SalaryPeriod = 'hour' | 'day' | 'week' | 'month' | 'year' | 'project';
export type JobStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'closed' | 'filled';
export type ApplicationStatus = 'pending' | 'reviewed' | 'shortlisted' | 'interview' | 'offered' | 'hired' | 'rejected' | 'withdrawn';
export type Availability = 'full_time' | 'part_time' | 'weekends' | 'evenings' | 'not_available';
export type PreferredContact = 'email' | 'phone' | 'whatsapp' | 'platform';
export type FreelancerStatus = 'pending' | 'approved' | 'suspended' | 'inactive';
export type PriceType = 'fixed' | 'hourly' | 'starting_at';
export type ProjectStatus = 'pending' | 'accepted' | 'in_progress' | 'delivered' | 'revision' | 'completed' | 'cancelled' | 'disputed';

// Display labels
export const JOB_TYPES: Record<JobType, string> = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contract: 'Contract',
  internship: 'Internship',
  casual: 'Casual',
  temporary: 'Temporary',
};

export const EXPERIENCE_LEVELS: Record<ExperienceLevel, string> = {
  entry: 'Entry Level',
  mid: 'Mid Level',
  senior: 'Senior Level',
  executive: 'Executive',
  any: 'Any Level',
};

export const LOCATION_TYPES: Record<LocationType, string> = {
  onsite: 'On-site',
  remote: 'Remote',
  hybrid: 'Hybrid',
};

export const SALARY_PERIODS: Record<SalaryPeriod, string> = {
  hour: 'per hour',
  day: 'per day',
  week: 'per week',
  month: 'per month',
  year: 'per year',
  project: 'per project',
};

export const APPLICATION_STATUSES: Record<ApplicationStatus, string> = {
  pending: 'Pending Review',
  reviewed: 'Reviewed',
  shortlisted: 'Shortlisted',
  interview: 'Interview',
  offered: 'Offer Made',
  hired: 'Hired',
  rejected: 'Not Selected',
  withdrawn: 'Withdrawn',
};

export const AVAILABILITY_OPTIONS: Record<Availability, string> = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  weekends: 'Weekends Only',
  evenings: 'Evenings Only',
  not_available: 'Not Available',
};

export const ISLANDS = [
  'Efate', 'Espiritu Santo', 'Malekula', 'Tanna', 'Pentecost',
  'Ambae', 'Ambrym', 'Epi', 'Erromango', 'Aneityum', 'Other'
];
