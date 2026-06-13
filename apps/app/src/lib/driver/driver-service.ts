import { supabase } from '@/integrations/supabase/client';

export type DriverApplicationStatus =
  | 'draft'
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'suspended'
  | 'deactivated';

export type VehicleType = 'car' | 'suv' | 'van' | 'moto' | 'bike' | 'truck' | 'wheelchair_van';

export type DocumentType =
  | 'drivers_license_front'
  | 'drivers_license_back'
  | 'national_id_front'
  | 'national_id_back'
  | 'passport'
  | 'vehicle_registration'
  | 'vehicle_insurance'
  | 'background_check'
  | 'profile_photo'
  | 'vehicle_photo'
  | 'bank_statement'
  | 'proof_of_address'
  | 'other';

export interface Driver {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  email?: string;
  license_number: string;
  application_status: DriverApplicationStatus;
  verification_status: 'unverified' | 'partially_verified' | 'verified';
  is_active: boolean;
  is_online: boolean;
  is_available: boolean;
  average_rating: number;
  total_rides: number;
  created_at: string;
}

export interface DriverVehicle {
  id: string;
  driver_id: string;
  vehicle_type: VehicleType;
  make: string;
  model: string;
  year: number;
  color?: string;
  license_plate: string;
  passenger_capacity: number;
  wheelchair_accessible: boolean;
  is_primary: boolean;
  is_active: boolean;
  verification_status: 'pending' | 'approved' | 'rejected';
}

export interface DriverDocument {
  id: string;
  driver_id: string;
  document_type: DocumentType;
  file_name: string;
  file_url: string;
  verification_status: 'pending' | 'approved' | 'rejected' | 'expired';
  expires_at?: string;
  created_at: string;
}

export interface DriverApplication {
  id: string;
  driver_id: string;
  user_id: string;
  current_step: number;
  total_steps: number;
  status: 'in_progress' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'withdrawn';
  step_personal_info: boolean;
  step_license: boolean;
  step_vehicle: boolean;
  step_documents: boolean;
  step_background_check: boolean;
}

/**
 * Create a new driver profile
 */
export const createDriverProfile = async (params: {
  userId: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  licenseNumber: string;
  dateOfBirth?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    province?: string;
  };
}) => {
  try {
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .insert({
        user_id: params.userId,
        first_name: params.firstName,
        last_name: params.lastName,
        phone_number: params.phoneNumber,
        email: params.email,
        license_number: params.licenseNumber,
        license_plate: 'TBD', // Required field, will be updated later
        vehicle_model: 'TBD', // Required field, will be updated later
        vehicle_type: 'car', // Required field, will be updated later
        date_of_birth: params.dateOfBirth,
        address_line1: params.address?.line1,
        address_line2: params.address?.line2,
        city: params.address?.city,
        province: params.address?.province,
        application_status: 'draft',
        verification_status: 'unverified',
      } as unknown)
      .select()
      .single();

    if (driverError) {
      console.error('Error creating driver profile:', driverError);
      return { success: false, error: driverError.message };
    }

    // Create driver application
    const { data: application, error: appError } = await supabase
      .from('driver_applications')
      .insert({
        driver_id: driver.id,
        user_id: params.userId,
        current_step: 1,
        total_steps: 5,
        status: 'in_progress',
      })
      .select()
      .single();

    if (appError) {
      console.error('Error creating driver application:', appError);
      return { success: false, error: appError.message };
    }

    return {
      success: true,
      data: { driver, application },
      message: 'Driver profile created successfully',
    };
  } catch (error: unknown) {
    console.error('Error in createDriverProfile:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get driver profile by user ID
 */
export const getDriverProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { success: true, data: null };
    }
    console.error('Error fetching driver profile:', error);
    return { success: false, error: error.message, data: null };
  }

  return { success: true, data: data as Driver };
};

/**
 * Update driver profile
 */
export const updateDriverProfile = async (
  driverId: string,
  updates: Partial<Driver>
) => {
  const { data, error } = await supabase
    .from('drivers')
    .update(updates)
    .eq('id', driverId)
    .select()
    .single();

  if (error) {
    console.error('Error updating driver profile:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data: data as Driver };
};

/**
 * Add a vehicle to driver profile
 */
export const addDriverVehicle = async (params: {
  driverId: string;
  vehicleType: VehicleType;
  make: string;
  model: string;
  year: number;
  color?: string;
  licensePlate: string;
  passengerCapacity?: number;
  wheelchairAccessible?: boolean;
  isPrimary?: boolean;
}) => {
  try {
    const { data, error } = await supabase
      .from('driver_vehicles')
      .insert({
        driver_id: params.driverId,
        vehicle_type: params.vehicleType,
        make: params.make,
        model: params.model,
        year: params.year,
        color: params.color,
        license_plate: params.licensePlate,
        passenger_capacity: params.passengerCapacity || 4,
        wheelchair_accessible: params.wheelchairAccessible || false,
        is_primary: params.isPrimary || false,
        verification_status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding vehicle:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: data as DriverVehicle,
      message: 'Vehicle added successfully',
    };
  } catch (error: unknown) {
    console.error('Error in addDriverVehicle:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all vehicles for a driver
 */
export const getDriverVehicles = async (driverId: string) => {
  const { data, error } = await supabase
    .from('driver_vehicles')
    .select('*')
    .eq('driver_id', driverId)
    .order('is_primary', { ascending: false });

  if (error) {
    console.error('Error fetching driver vehicles:', error);
    return { success: false, error: error.message, data: [] };
  }

  return { success: true, data: data as DriverVehicle[] };
};

/**
 * Upload a driver document
 */
export const uploadDriverDocument = async (params: {
  driverId: string;
  documentType: DocumentType;
  file: File;
  expiresAt?: string;
}) => {
  try {
    // Upload file to Supabase Storage
    const fileExt = params.file.name.split('.').pop();
    const fileName = `${params.driverId}/${params.documentType}_${Date.now()}.${fileExt}`;
    const filePath = `driver-documents/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, params.file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return { success: false, error: uploadError.message };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('documents').getPublicUrl(filePath);

    // Create document record
    const { data: document, error: docError } = await supabase
      .from('driver_documents')
      .insert({
        driver_id: params.driverId,
        document_type: params.documentType,
        file_name: params.file.name,
        file_url: publicUrl,
        file_size: params.file.size,
        file_type: params.file.type,
        expires_at: params.expiresAt,
        verification_status: 'pending',
      })
      .select()
      .single();

    if (docError) {
      console.error('Error creating document record:', docError);
      return { success: false, error: docError.message };
    }

    return {
      success: true,
      data: document as DriverDocument,
      message: 'Document uploaded successfully',
    };
  } catch (error: unknown) {
    console.error('Error in uploadDriverDocument:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all documents for a driver
 */
export const getDriverDocuments = async (driverId: string) => {
  const { data, error } = await supabase
    .from('driver_documents')
    .select('*')
    .eq('driver_id', driverId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching driver documents:', error);
    return { success: false, error: error.message, data: [] };
  }

  return { success: true, data: data as DriverDocument[] };
};

/**
 * Get driver application status
 */
export const getDriverApplication = async (driverId: string) => {
  const { data, error } = await supabase
    .from('driver_applications')
    .select('*')
    .eq('driver_id', driverId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { success: true, data: null };
    }
    console.error('Error fetching driver application:', error);
    return { success: false, error: error.message, data: null };
  }

  return { success: true, data: data as DriverApplication };
};

/**
 * Update driver application step
 */
export const updateApplicationStep = async (
  applicationId: string,
  step: number,
  stepData: Partial<DriverApplication>
) => {
  const { data, error } = await supabase
    .from('driver_applications')
    .update({
      current_step: step,
      ...stepData,
    })
    .eq('id', applicationId)
    .select()
    .single();

  if (error) {
    console.error('Error updating application step:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data: data as DriverApplication };
};

/**
 * Submit driver application for review
 */
export const submitDriverApplication = async (driverId: string) => {
  try {
    // Update driver status
    const { error: driverError } = await supabase
      .from('drivers')
      .update({
        application_status: 'pending',
      })
      .eq('id', driverId);

    if (driverError) {
      console.error('Error updating driver status:', driverError);
      return { success: false, error: driverError.message };
    }

    // Update application status
    const { data, error: appError } = await supabase
      .from('driver_applications')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('driver_id', driverId)
      .select()
      .single();

    if (appError) {
      console.error('Error updating application:', appError);
      return { success: false, error: appError.message };
    }

    return {
      success: true,
      data,
      message:
        'Application submitted successfully! We will review it within 24-48 hours.',
    };
  } catch (error: unknown) {
    console.error('Error in submitDriverApplication:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update driver online/available status
 */
export const updateDriverStatus = async (params: {
  driverId: string;
  isOnline?: boolean;
  isAvailable?: boolean;
}) => {
  const updates: unknown = {};
  if (params.isOnline !== undefined) updates.is_online = params.isOnline;
  if (params.isAvailable !== undefined) updates.is_available = params.isAvailable;
  updates.last_active_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('drivers')
    .update(updates)
    .eq('id', params.driverId)
    .select()
    .single();

  if (error) {
    console.error('Error updating driver status:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
};

/**
 * Update driver location
 */
export const updateDriverLocation = async (params: {
  driverId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
}) => {
  try {
    const { data, error } = await supabase.from('driver_locations').insert({
      driver_id: params.driverId,
      latitude: params.latitude,
      longitude: params.longitude,
      location: `POINT(${params.longitude} ${params.latitude})`,
      heading: params.heading,
      speed: params.speed,
      accuracy: params.accuracy,
      recorded_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error updating driver location:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: unknown) {
    console.error('Error in updateDriverLocation:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get driver earnings summary
 */
export const getDriverEarnings = async (params: {
  driverId: string;
  startDate?: string;
  endDate?: string;
}) => {
  let query = supabase
    .from('driver_earnings')
    .select('*')
    .eq('driver_id', params.driverId);

  if (params.startDate) {
    query = query.gte('earned_at', params.startDate);
  }
  if (params.endDate) {
    query = query.lte('earned_at', params.endDate);
  }

  const { data, error } = await query.order('earned_at', { ascending: false });

  if (error) {
    console.error('Error fetching driver earnings:', error);
    return { success: false, error: error.message, data: [] };
  }

  // Calculate totals
  const totalEarnings = data.reduce((sum, e) => sum + Number(e.net_earning), 0);
  const pendingEarnings = data
    .filter((e) => e.payment_status === 'pending')
    .reduce((sum, e) => sum + Number(e.net_earning), 0);
  const paidEarnings = data
    .filter((e) => e.payment_status === 'paid')
    .reduce((sum, e) => sum + Number(e.net_earning), 0);

  return {
    success: true,
    data,
    summary: {
      totalEarnings,
      pendingEarnings,
      paidEarnings,
      totalRides: data.length,
    },
  };
};

/**
 * Find nearby available drivers
 */
export const findNearbyDrivers = async (params: {
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  vehicleType?: VehicleType;
  limit?: number;
}) => {
  try {
    const { data, error } = await supabase.rpc('find_nearby_drivers', {
      p_latitude: params.latitude,
      p_longitude: params.longitude,
      p_radius_meters: params.radiusMeters || 5000,
      p_vehicle_type: params.vehicleType || null,
      p_limit: params.limit || 10,
    });

    if (error) {
      console.error('Error finding nearby drivers:', error);
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data };
  } catch (error: unknown) {
    console.error('Error in findNearbyDrivers:', error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Get driver statistics
 */
export const getDriverStats = async (driverId: string) => {
  const { data: driver, error } = await supabase
    .from('drivers')
    .select(
      `
      total_rides,
      completed_rides,
      cancelled_rides,
      acceptance_rate,
      cancellation_rate,
      average_rating,
      total_ratings,
      total_earnings,
      pending_earnings,
      paid_earnings
    `
    )
    .eq('id', driverId)
    .single();

  if (error) {
    console.error('Error fetching driver stats:', error);
    return { success: false, error: error.message, data: null };
  }

  return { success: true, data: driver };
};
