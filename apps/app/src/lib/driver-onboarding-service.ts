import { supabase } from '@/integrations/supabase/client';
import { DriverOnboardingData } from '@/types/driver-onboarding';

export class DriverOnboardingService {
  /**
   * Upload a document to Supabase Storage
   */
  static async uploadDocument(
    userId: string,
    file: File,
    documentType: string
  ): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${documentType}_${Date.now()}.${fileExt}`;
    const filePath = `driver-documents/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Failed to upload ${documentType}: ${uploadError.message}`);
    }

    // Return the file path (not public URL) for private bucket
    // Signed URLs will be generated on-demand when viewing documents
    return filePath;
  }

  /**
   * Create or update driver profile
   */
  static async createDriver(
    userId: string,
    data: DriverOnboardingData
  ): Promise<string> {
    // Check for existing driver first
    const { data: existingDriver } = await supabase
      .from('drivers')
      .select('id')
      .eq('user_id', userId)
      .single();

    const driverPayload = {
      user_id: userId,
      first_name: data.personal.first_name,
      last_name: data.personal.last_name,
      date_of_birth: data.personal.date_of_birth,
      gender: data.personal.gender,
      phone_number: data.personal.phone_number,
      email: data.personal.email,
      emergency_contact_name: data.personal.emergency_contact_name,
      emergency_contact_phone: data.personal.emergency_contact_phone,
      address_line1: data.personal.address_line1,
      address_line2: data.personal.address_line2,
      city: data.personal.city,
      province: data.personal.province,
      postal_code: data.personal.postal_code,
      country: 'Vanuatu',
      license_number: data.license.license_number,
      license_type: data.license.license_type,
      license_issue_date: data.license.license_issue_date,
      license_expiry_date: data.license.license_expiry_date,
      bank_name: data.banking.bank_name,
      bank_account_number: data.banking.bank_account_number,
      bank_account_name: data.banking.bank_account_name,
      mobile_money_provider: data.banking.mobile_money_provider,
      mobile_money_number: data.banking.mobile_money_number,
      application_status: 'pending',
      verification_status: 'unverified',
      is_active: true,
      is_online: false,
      is_available: false,
      license_plate: data.vehicle.license_plate,
      vehicle_model: data.vehicle.make + ' ' + data.vehicle.model,
      vehicle_type: data.vehicle.vehicle_type,
    } as any;

    if (existingDriver) {
      // Update existing driver
      const { error } = await supabase
        .from('drivers')
        .update(driverPayload)
        .eq('id', existingDriver.id);

      if (error) {
        throw new Error(`Failed to update driver profile: ${error.message}`);
      }
      return existingDriver.id;
    }

    // Create new driver
    const { data: driverData, error } = await supabase
      .from('drivers')
      .insert(driverPayload)
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create driver profile: ${error.message}`);
    }

    return driverData.id;
  }

  /**
   * Create or update vehicle record
   */
  static async createVehicle(
    driverId: string,
    data: DriverOnboardingData
  ): Promise<void> {
    // Check for existing vehicle
    const { data: existingVehicle } = await supabase
      .from('driver_vehicles')
      .select('id')
      .eq('driver_id', driverId)
      .eq('license_plate', data.vehicle.license_plate)
      .single();

    const vehiclePayload = {
      driver_id: driverId,
      vehicle_type: data.vehicle.vehicle_type,
      make: data.vehicle.make,
      model: data.vehicle.model,
      year: data.vehicle.year,
      color: data.vehicle.color,
      license_plate: data.vehicle.license_plate,
      registration_number: data.vehicle.registration_number,
      registration_expiry: data.vehicle.registration_expiry,
      insurance_provider: data.vehicle.insurance_provider,
      insurance_policy_number: data.vehicle.insurance_policy_number,
      insurance_expiry: data.vehicle.insurance_expiry,
      passenger_capacity: data.vehicle.passenger_capacity,
      is_primary: true,
      is_active: true,
      verification_status: 'pending',
    };

    if (existingVehicle) {
      const { error } = await supabase
        .from('driver_vehicles')
        .update(vehiclePayload)
        .eq('id', existingVehicle.id);

      if (error) {
        throw new Error(`Failed to update vehicle record: ${error.message}`);
      }
      return;
    }

    const { error } = await supabase.from('driver_vehicles').insert(vehiclePayload);

    if (error) {
      throw new Error(`Failed to create vehicle record: ${error.message}`);
    }
  }

  /**
   * Upload and save document records
   */
  static async saveDocuments(
    userId: string,
    driverId: string,
    documents: DriverOnboardingData['documents']
  ): Promise<void> {
    const documentTypes = [
      { key: 'license_front', type: 'drivers_license_front' },
      { key: 'license_back', type: 'drivers_license_back' },
      { key: 'national_id_front', type: 'national_id_front' },
      { key: 'vehicle_registration', type: 'vehicle_registration' },
      { key: 'vehicle_insurance', type: 'vehicle_insurance' },
      { key: 'profile_photo', type: 'profile_photo' },
    ] as const;

    const uploadPromises = documentTypes
      .filter((doc) => documents[doc.key as keyof typeof documents])
      .map(async (doc) => {
        const file = documents[doc.key as keyof typeof documents] as File;
        const fileUrl = await this.uploadDocument(userId, file, doc.type);

        // Save document record
        await supabase.from('driver_documents').insert({
          driver_id: driverId,
          document_type: doc.type,
          file_name: file.name,
          file_url: fileUrl,
          file_size: file.size,
          file_type: file.type,
          verification_status: 'pending',
        });
      });

    await Promise.all(uploadPromises);
  }

  /**
   * Create or update driver application record
   */
  static async createApplication(
    userId: string,
    driverId: string,
    data: DriverOnboardingData
  ): Promise<void> {
    // Check for existing application
    const { data: existingApp } = await supabase
      .from('driver_applications')
      .select('id')
      .eq('driver_id', driverId)
      .single();

    const appPayload = {
      driver_id: driverId,
      user_id: userId,
      step_personal_info: true,
      step_license: true,
      step_vehicle: true,
      step_documents: true,
      step_background_check: false,
      current_step: 5,
      total_steps: 5,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      application_data: data,
    } as any;

    if (existingApp) {
      const { error } = await supabase
        .from('driver_applications')
        .update(appPayload)
        .eq('id', existingApp.id);

      if (error) {
        throw new Error(`Failed to update application: ${error.message}`);
      }
      return;
    }

    const { error } = await supabase.from('driver_applications').insert(appPayload);

    if (error) {
      throw new Error(`Failed to create application: ${error.message}`);
    }
  }

  /**
   * Assign driver role to user (handles duplicates gracefully)
   */
  static async assignDriverRole(userId: string): Promise<void> {
    // Check if role already exists
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role', 'driver')
      .single();

    if (existingRole) {
      return; // Role already exists, nothing to do
    }

    const { error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'driver',
      });

    // Ignore duplicate key errors (race condition safety)
    if (error && !error.message.includes('duplicate')) {
      throw new Error(`Failed to assign driver role: ${error.message}`);
    }
  }

  /**
   * Complete driver onboarding process
   */
  static async completeOnboarding(
    userId: string,
    data: DriverOnboardingData
  ): Promise<void> {
    try {
      // 1. Assign driver role
      await this.assignDriverRole(userId);

      // 2. Create driver profile
      const driverId = await this.createDriver(userId, data);

      // 3. Create vehicle record
      await this.createVehicle(driverId, data);

      // 4. Upload and save documents
      await this.saveDocuments(userId, driverId, data.documents);

      // 5. Create application record
      await this.createApplication(userId, driverId, data);

    } catch (error) {
      console.error('Onboarding error:', error);
      throw error;
    }
  }
}
