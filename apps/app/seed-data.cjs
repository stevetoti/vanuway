#!/usr/bin/env node
// VanuWay Seed Script v2 - Fixed
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ljervgzsovamehnlztxf.supabase.co';
const SERVICE_KEY = process.env.VANUWAY_SERVICE_KEY;

if (!SERVICE_KEY) { console.error('Missing VANUWAY_SERVICE_KEY'); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const ADMIN_USER_ID = 'fc57de43-6f25-4970-9a5b-b039bdebcb6a'; // toti.assistant

async function seedShops() {
  console.log('\n=== SEEDING SHOPS ===');
  const { data: existing } = await supabase.from('shops').select('id');
  if (existing && existing.length > 0) {
    console.log(`Shops already has ${existing.length} records, skipping`);
    return;
  }

  const shops = [
    {
      owner_id: ADMIN_USER_ID,
      name: 'Vila Fresh Market',
      description: 'Fresh local produce straight from Vanuatu farms. Fruits, vegetables, root crops, and organic produce daily.',
      category: 'produce',
      phone_number: '+678 22345',
      address: 'Port Vila Market, Main Street',
      island: 'Efate',
      area: 'Port Vila',
      opening_time: '06:00',
      closing_time: '17:00',
      open_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      offers_delivery: true,
      delivery_fee: 300,
      free_delivery_minimum: 3000,
      delivery_radius_km: 10,
      estimated_delivery_time: 45,
      is_verified: true,
      is_active: true,
      average_rating: 4.6,
      total_reviews: 89,
      total_orders: 456
    },
    {
      owner_id: ADMIN_USER_ID,
      name: 'Nambawan Electronics',
      description: 'Your go-to store for electronics, gadgets, phones, and accessories. Authorized dealer for Samsung and Apple.',
      category: 'electronics',
      phone_number: '+678 23456',
      address: 'Lini Highway, Port Vila',
      island: 'Efate',
      area: 'Port Vila',
      opening_time: '08:00',
      closing_time: '18:00',
      open_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      offers_delivery: true,
      delivery_fee: 500,
      delivery_radius_km: 15,
      estimated_delivery_time: 60,
      is_verified: true,
      is_active: true,
      average_rating: 4.3,
      total_reviews: 45,
      total_orders: 234
    },
    {
      owner_id: ADMIN_USER_ID,
      name: 'Island Style Clothing',
      description: 'Trendy island fashion, local designs, and tropical wear for men, women and children.',
      category: 'convenience',
      phone_number: '+678 24567',
      address: 'Town Centre, Port Vila',
      island: 'Efate',
      area: 'Port Vila',
      opening_time: '09:00',
      closing_time: '17:30',
      open_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      offers_delivery: true,
      delivery_fee: 400,
      delivery_radius_km: 10,
      estimated_delivery_time: 60,
      is_verified: true,
      is_active: true,
      average_rating: 4.4,
      total_reviews: 56,
      total_orders: 178
    },
    {
      owner_id: ADMIN_USER_ID,
      name: 'Vanuatu Handcraft Shop',
      description: 'Authentic Vanuatu handcrafts, souvenirs, and cultural artifacts. Wood carvings, woven baskets, shell jewelry.',
      category: 'convenience',
      phone_number: '+678 25678',
      address: 'Waterfront, Port Vila',
      island: 'Efate',
      area: 'Port Vila',
      opening_time: '08:00',
      closing_time: '17:00',
      open_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      offers_delivery: true,
      delivery_fee: 500,
      delivery_radius_km: 10,
      estimated_delivery_time: 90,
      is_verified: true,
      is_active: true,
      average_rating: 4.8,
      total_reviews: 123,
      total_orders: 567
    },
    {
      owner_id: ADMIN_USER_ID,
      name: 'Pacific Hardware',
      description: 'Tools, building materials, plumbing, electrical supplies, and home improvement products.',
      category: 'hardware',
      phone_number: '+678 26789',
      address: 'Nambatu Area, Port Vila',
      island: 'Efate',
      area: 'Port Vila',
      opening_time: '07:30',
      closing_time: '17:00',
      open_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      offers_delivery: true,
      delivery_fee: 800,
      delivery_radius_km: 20,
      estimated_delivery_time: 90,
      is_verified: true,
      is_active: true,
      average_rating: 4.2,
      total_reviews: 34,
      total_orders: 145
    },
    {
      owner_id: ADMIN_USER_ID,
      name: "Mama's Kitchen Supplies",
      description: 'Kitchenware, cooking utensils, local pots, and everything for your kitchen. Traditional and modern.',
      category: 'convenience',
      phone_number: '+678 27890',
      address: 'Main Street, Port Vila',
      island: 'Efate',
      area: 'Port Vila',
      opening_time: '08:00',
      closing_time: '17:00',
      open_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      offers_delivery: true,
      delivery_fee: 400,
      delivery_radius_km: 10,
      estimated_delivery_time: 60,
      is_verified: true,
      is_active: true,
      average_rating: 4.5,
      total_reviews: 67,
      total_orders: 289
    },
    {
      owner_id: ADMIN_USER_ID,
      name: 'Wan Smolbag Bookshop',
      description: 'Books, stationery, educational materials, and local publications. Supporting literacy in Vanuatu.',
      category: 'office',
      phone_number: '+678 28901',
      address: 'Wan Smolbag Centre, Port Vila',
      island: 'Efate',
      area: 'Port Vila',
      opening_time: '08:30',
      closing_time: '16:30',
      open_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      offers_delivery: true,
      delivery_fee: 300,
      delivery_radius_km: 10,
      estimated_delivery_time: 60,
      is_verified: true,
      is_active: true,
      average_rating: 4.7,
      total_reviews: 45,
      total_orders: 123
    },
    {
      owner_id: ADMIN_USER_ID,
      name: 'Digicel Store',
      description: 'Mobile phones, SIM cards, data plans, and telecom accessories. Recharge and mobile money.',
      category: 'electronics',
      phone_number: '+678 29012',
      address: 'Lini Highway, Port Vila',
      island: 'Efate',
      area: 'Port Vila',
      opening_time: '08:00',
      closing_time: '18:00',
      open_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      offers_delivery: true,
      delivery_fee: 0,
      free_delivery_minimum: 5000,
      delivery_radius_km: 15,
      estimated_delivery_time: 45,
      is_verified: true,
      is_active: true,
      average_rating: 4.1,
      total_reviews: 78,
      total_orders: 890
    }
  ];

  const { data, error } = await supabase.from('shops').insert(shops).select('id, name');
  console.log(error ? `Shops error: ${error.message}` : `Inserted ${data.length} shops`);
}

async function seedProviders() {
  console.log('\n=== SEEDING SERVICE PROVIDERS ===');
  const { data: existing } = await supabase.from('service_providers').select('id');
  if (existing && existing.length > 0) {
    console.log(`Providers already has ${existing.length} records, skipping`);
    return;
  }

  const providers = [
    {
      user_id: ADMIN_USER_ID,
      business_name: 'Island Plumbing Services',
      provider_type: 'company',
      description: 'Professional plumbing services. Emergency repairs, installations, and maintenance.',
      contact_name: 'James Kaltamat',
      phone_number: '+678 77123',
      island: 'Efate',
      area: 'Port Vila',
      service_radius_km: 25,
      categories: ['plumbing'],
      languages_spoken: ['English', 'Bislama'],
      is_available: true,
      availability_hours: {},
      accepts_emergency: true,
      emergency_fee_percentage: 50,
      hourly_rate: 3500,
      min_charge: 5000,
      accepts_negotiation: true,
      years_experience: 12,
      verification_status: 'verified',
      is_active: true,
      average_rating: 4.6,
      total_reviews: 45,
      total_jobs: 234,
      response_rate: 95,
      response_time_hours: 1
    },
    {
      user_id: ADMIN_USER_ID,
      business_name: 'Pacific Electrical Solutions',
      provider_type: 'company',
      description: 'Licensed electricians. Wiring, solar installations, generator maintenance.',
      contact_name: 'Tom Nauka',
      phone_number: '+678 77234',
      island: 'Efate',
      area: 'Port Vila',
      service_radius_km: 30,
      categories: ['electrical'],
      languages_spoken: ['English', 'Bislama', 'French'],
      is_available: true,
      availability_hours: {},
      accepts_emergency: true,
      emergency_fee_percentage: 75,
      hourly_rate: 4000,
      min_charge: 6000,
      accepts_negotiation: false,
      years_experience: 15,
      verification_status: 'verified',
      is_active: true,
      average_rating: 4.8,
      total_reviews: 67,
      total_jobs: 345,
      response_rate: 98,
      response_time_hours: 1
    },
    {
      user_id: ADMIN_USER_ID,
      business_name: 'Vila Cleaning Services',
      provider_type: 'company',
      description: 'Professional cleaning for homes, offices, and commercial properties.',
      contact_name: 'Marie Tari',
      phone_number: '+678 77345',
      island: 'Efate',
      area: 'Port Vila',
      service_radius_km: 20,
      categories: ['cleaning'],
      languages_spoken: ['English', 'Bislama'],
      is_available: true,
      availability_hours: {},
      accepts_emergency: false,
      emergency_fee_percentage: 0,
      hourly_rate: 2000,
      min_charge: 4000,
      accepts_negotiation: true,
      years_experience: 8,
      verification_status: 'verified',
      is_active: true,
      average_rating: 4.5,
      total_reviews: 89,
      total_jobs: 567,
      response_rate: 92,
      response_time_hours: 2
    },
    {
      user_id: ADMIN_USER_ID,
      business_name: 'Coconut Tree Landscaping',
      provider_type: 'company',
      description: 'Garden design, lawn maintenance, tree trimming, and landscaping.',
      contact_name: 'Peter Wari',
      phone_number: '+678 77456',
      island: 'Efate',
      area: 'Port Vila',
      service_radius_km: 25,
      categories: ['landscaping'],
      languages_spoken: ['Bislama', 'English'],
      is_available: true,
      availability_hours: {},
      accepts_emergency: false,
      emergency_fee_percentage: 0,
      hourly_rate: 2500,
      min_charge: 5000,
      accepts_negotiation: true,
      years_experience: 10,
      verification_status: 'verified',
      is_active: true,
      average_rating: 4.7,
      total_reviews: 34,
      total_jobs: 189,
      response_rate: 88,
      response_time_hours: 3
    },
    {
      user_id: ADMIN_USER_ID,
      business_name: 'Vanuatu Auto Repair',
      provider_type: 'company',
      description: 'Complete auto repair and maintenance. Engine diagnostics, brakes, 4WD specialists.',
      contact_name: 'John Moli',
      phone_number: '+678 77567',
      island: 'Efate',
      area: 'Port Vila',
      service_radius_km: 15,
      categories: ['auto-repair'],
      languages_spoken: ['English', 'Bislama'],
      is_available: true,
      availability_hours: {},
      accepts_emergency: true,
      emergency_fee_percentage: 50,
      hourly_rate: 4500,
      min_charge: 7000,
      accepts_negotiation: true,
      years_experience: 18,
      verification_status: 'verified',
      is_active: true,
      average_rating: 4.4,
      total_reviews: 56,
      total_jobs: 423,
      response_rate: 90,
      response_time_hours: 2
    },
    {
      user_id: ADMIN_USER_ID,
      business_name: 'Island IT Support',
      provider_type: 'individual',
      description: 'Computer repair, network setup, website development, and IT consulting.',
      contact_name: 'David Kali',
      phone_number: '+678 77678',
      island: 'Efate',
      area: 'Port Vila',
      service_radius_km: 20,
      categories: ['it-services'],
      languages_spoken: ['English', 'Bislama', 'French'],
      is_available: true,
      availability_hours: {},
      accepts_emergency: true,
      emergency_fee_percentage: 100,
      hourly_rate: 5000,
      min_charge: 8000,
      accepts_negotiation: true,
      years_experience: 7,
      verification_status: 'verified',
      is_active: true,
      average_rating: 4.6,
      total_reviews: 23,
      total_jobs: 156,
      response_rate: 97,
      response_time_hours: 1
    },
    {
      user_id: ADMIN_USER_ID,
      business_name: 'Paradise Beauty Salon',
      provider_type: 'company',
      description: 'Hair styling, nails, facials, massage, and bridal packages.',
      contact_name: 'Sarah Kalsakau',
      phone_number: '+678 77789',
      island: 'Efate',
      area: 'Port Vila',
      service_radius_km: 10,
      categories: ['beauty'],
      languages_spoken: ['English', 'Bislama', 'French'],
      is_available: true,
      availability_hours: {},
      accepts_emergency: false,
      emergency_fee_percentage: 0,
      hourly_rate: 3000,
      min_charge: 2000,
      accepts_negotiation: false,
      years_experience: 9,
      verification_status: 'verified',
      is_active: true,
      average_rating: 4.8,
      total_reviews: 98,
      total_jobs: 678,
      response_rate: 96,
      response_time_hours: 1
    },
    {
      user_id: ADMIN_USER_ID,
      business_name: 'Pacific Moving Services',
      provider_type: 'company',
      description: 'House moves, office relocations, furniture delivery, and inter-island shipping.',
      contact_name: 'Robert Toa',
      phone_number: '+678 77890',
      island: 'Efate',
      area: 'Port Vila',
      service_radius_km: 50,
      categories: ['moving'],
      languages_spoken: ['Bislama', 'English'],
      is_available: true,
      availability_hours: {},
      accepts_emergency: false,
      emergency_fee_percentage: 0,
      hourly_rate: 3000,
      min_charge: 10000,
      accepts_negotiation: true,
      years_experience: 14,
      verification_status: 'verified',
      is_active: true,
      average_rating: 4.3,
      total_reviews: 42,
      total_jobs: 267,
      response_rate: 85,
      response_time_hours: 4
    },
    {
      user_id: ADMIN_USER_ID,
      business_name: 'Vila Accounting Services',
      provider_type: 'individual',
      description: 'Professional accounting, bookkeeping, and tax compliance for businesses.',
      contact_name: 'Grace Nalo',
      phone_number: '+678 77901',
      island: 'Efate',
      area: 'Port Vila',
      service_radius_km: 20,
      categories: ['it-services'],
      languages_spoken: ['English', 'Bislama'],
      is_available: true,
      availability_hours: {},
      accepts_emergency: false,
      emergency_fee_percentage: 0,
      hourly_rate: 6000,
      min_charge: 10000,
      accepts_negotiation: true,
      years_experience: 11,
      verification_status: 'verified',
      is_active: true,
      average_rating: 4.9,
      total_reviews: 19,
      total_jobs: 89,
      response_rate: 100,
      response_time_hours: 2
    },
    {
      user_id: ADMIN_USER_ID,
      business_name: 'Reef Photography',
      provider_type: 'individual',
      description: 'Weddings, events, portraits, drone, and underwater photography.',
      contact_name: 'Luke Matautia',
      phone_number: '+678 77012',
      island: 'Efate',
      area: 'Port Vila',
      service_radius_km: 50,
      categories: ['photography'],
      languages_spoken: ['English', 'Bislama', 'French'],
      is_available: true,
      availability_hours: {},
      accepts_emergency: false,
      emergency_fee_percentage: 0,
      hourly_rate: 8000,
      min_charge: 15000,
      accepts_negotiation: true,
      years_experience: 6,
      verification_status: 'verified',
      is_active: true,
      average_rating: 4.9,
      total_reviews: 76,
      total_jobs: 345,
      response_rate: 94,
      response_time_hours: 1
    }
  ];

  const { data, error } = await supabase.from('service_providers').insert(providers).select('id, business_name');
  console.log(error ? `Providers error: ${error.message}` : `Inserted ${data.length} providers`);
}

async function seedEmergencyServices() {
  console.log('\n=== SEEDING EMERGENCY SERVICES ===');
  const { data: existing } = await supabase.from('emergency_services').select('id');
  if (existing && existing.length >= 5) {
    console.log(`Emergency services already has ${existing.length} records, skipping`);
    return;
  }
  
  // Delete old data first to avoid dupes
  if (existing && existing.length > 0) {
    await supabase.from('emergency_services').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('Cleared old emergency services data');
  }

  const contacts = [
    {
      name: 'Vanuatu Police Force',
      category: 'police',
      phone_number: '111',
      alternate_phone: '+678 22222',
      address: 'Police Headquarters, Port Vila',
      island: 'All Islands',
      description: 'National emergency police number. For all crime and safety emergencies.',
      is_24_hours: true,
      priority: 1,
      is_active: true
    },
    {
      name: 'Fire Service',
      category: 'fire',
      phone_number: '112',
      address: 'Port Vila Fire Station',
      island: 'All Islands',
      description: 'National fire emergency number. For fire and rescue emergencies.',
      is_24_hours: true,
      priority: 2,
      is_active: true
    },
    {
      name: 'Ambulance Service',
      category: 'medical',
      phone_number: '115',
      address: 'Vila Central Hospital',
      island: 'All Islands',
      description: 'National ambulance emergency number. For medical emergencies.',
      is_24_hours: true,
      priority: 3,
      is_active: true
    },
    {
      name: 'Vila Central Hospital',
      category: 'medical',
      phone_number: '+678 22100',
      alternate_phone: '+678 22101',
      address: 'Hospital Road, Port Vila',
      island: 'Efate',
      description: 'Main public hospital. Emergency, general ward, maternity, outpatient.',
      is_24_hours: true,
      priority: 4,
      is_active: true
    },
    {
      name: 'ProMedical',
      category: 'medical',
      phone_number: '+678 25566',
      alternate_phone: '+678 25567',
      address: 'Lini Highway, Port Vila',
      island: 'Efate',
      description: 'Private medical clinic. GP consultations, lab tests, and pharmacy.',
      is_24_hours: false,
      priority: 5,
      is_active: true
    },
    {
      name: 'Vanuatu Red Cross',
      category: 'medical',
      phone_number: '+678 27418',
      address: 'Red Cross House, Port Vila',
      island: 'All Islands',
      description: 'Disaster response, first aid, community health, emergency shelter.',
      is_24_hours: false,
      priority: 6,
      is_active: true
    },
    {
      name: 'Tourist Police',
      category: 'police',
      phone_number: '+678 22222',
      address: 'Port Vila Town Centre',
      island: 'Efate',
      description: 'Dedicated police for tourist safety. Report theft, scams, or safety concerns.',
      is_24_hours: true,
      priority: 7,
      is_active: true
    }
  ];

  const { data, error } = await supabase.from('emergency_services').insert(contacts).select('id, name');
  console.log(error ? `Emergency services error: ${error.message}` : `Inserted ${data.length} emergency services`);
}

async function main() {
  console.log('VanuWay Seed Script v2\n');
  await seedShops();
  await seedProviders();
  await seedEmergencyServices();

  console.log('\n=== FINAL COUNTS ===');
  for (const t of ['tours', 'shops', 'service_providers', 'emergency_services', 'community_events', 'properties']) {
    const { data, error } = await supabase.from(t).select('id');
    console.log(`${t}: ${error ? 'ERROR: ' + error.message : data.length + ' records'}`);
  }
}

main();
