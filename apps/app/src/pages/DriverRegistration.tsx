import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import {
  createDriverProfile,
  addDriverVehicle,
  uploadDriverDocument,
  submitDriverApplication,
  type VehicleType,
  type DocumentType,
} from '@/lib/driver/driver-service';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ArrowRight, Check, Upload } from 'lucide-react';

const TOTAL_STEPS = 5;

export const DriverRegistration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [driverId, setDriverId] = useState<string | null>(null);

  // Step 1: Personal Information
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    dateOfBirth: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      province: '',
    },
  });

  // Step 2: Driver's License
  const [licenseInfo, setLicenseInfo] = useState({
    licenseNumber: '',
    licenseType: '',
    issueDate: '',
    expiryDate: '',
  });

  // Step 3: Vehicle Information
  const [vehicleInfo, setVehicleInfo] = useState({
    vehicleType: 'car' as VehicleType,
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    licensePlate: '',
    passengerCapacity: 4,
    wheelchairAccessible: false,
  });

  // Step 4: Document Uploads
  const [documents, setDocuments] = useState<{
    [key in DocumentType]?: File | null;
  }>({});

  const handlePersonalInfoSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Error',
          description: 'Please sign in to continue',
          variant: 'destructive',
        });
        return;
      }

      const result = await createDriverProfile({
        userId: user.id,
        ...personalInfo,
        licenseNumber: licenseInfo.licenseNumber || 'PENDING',
      });

      if (result.success && result.data) {
        setDriverId(result.data.driver.id);
        setCurrentStep(2);
        toast({
          title: 'Success',
          description: 'Personal information saved',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to save personal information',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLicenseInfoSubmit = () => {
    if (!licenseInfo.licenseNumber || !licenseInfo.expiryDate) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required license fields',
        variant: 'destructive',
      });
      return;
    }
    setCurrentStep(3);
  };

  const handleVehicleInfoSubmit = async () => {
    if (!driverId) return;

    setLoading(true);
    try {
      const result = await addDriverVehicle({
        driverId,
        ...vehicleInfo,
        isPrimary: true,
      });

      if (result.success) {
        setCurrentStep(4);
        toast({
          title: 'Success',
          description: 'Vehicle information saved',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to save vehicle information',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = async (
    documentType: DocumentType,
    file: File | null
  ) => {
    if (!file) return;

    setDocuments((prev) => ({ ...prev, [documentType]: file }));
    toast({
      title: 'File Selected',
      description: `${file.name} selected for ${documentType}`,
    });
  };

  const handleDocumentsSubmit = async () => {
    if (!driverId) return;

    setLoading(true);
    try {
      // Upload all documents
      const requiredDocs: DocumentType[] = [
        'drivers_license_front',
        'drivers_license_back',
        'vehicle_registration',
        'vehicle_insurance',
        'profile_photo',
      ];

      const missingDocs = requiredDocs.filter((doc) => !documents[doc]);
      if (missingDocs.length > 0) {
        toast({
          title: 'Missing Documents',
          description: `Please upload: ${missingDocs.join(', ')}`,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      for (const [docType, file] of Object.entries(documents)) {
        if (file) {
          await uploadDriverDocument({
            driverId,
            documentType: docType as DocumentType,
            file,
            expiresAt:
              docType === 'drivers_license_front' ||
              docType === 'drivers_license_back'
                ? licenseInfo.expiryDate
                : undefined,
          });
        }
      }

      setCurrentStep(5);
      toast({
        title: 'Success',
        description: 'Documents uploaded successfully',
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload documents',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!driverId) return;

    setLoading(true);
    try {
      const result = await submitDriverApplication(driverId);

      if (result.success) {
        toast({
          title: 'Application Submitted!',
          description: result.message || 'Your application has been submitted for review',
        });
        navigate('/driver/dashboard');
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to submit application',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const progress = (currentStep / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Become a VanuWay Driver</h1>
          <p className="text-muted-foreground">
            Complete the registration process to start earning
          </p>
        </div>

        <div className="mb-6">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            Step {currentStep} of {TOTAL_STEPS}
          </p>
        </div>

        <Card className="p-6">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold mb-4">Personal Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={personalInfo.firstName}
                    onChange={(e) =>
                      setPersonalInfo({ ...personalInfo, firstName: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={personalInfo.lastName}
                    onChange={(e) =>
                      setPersonalInfo({ ...personalInfo, lastName: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={personalInfo.phoneNumber}
                    onChange={(e) =>
                      setPersonalInfo({ ...personalInfo, phoneNumber: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={personalInfo.email}
                    onChange={(e) =>
                      setPersonalInfo({ ...personalInfo, email: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={personalInfo.dateOfBirth}
                    onChange={(e) =>
                      setPersonalInfo({ ...personalInfo, dateOfBirth: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="addressLine1">Address Line 1</Label>
                <Input
                  id="addressLine1"
                  value={personalInfo.address.line1}
                  onChange={(e) =>
                    setPersonalInfo({
                      ...personalInfo,
                      address: { ...personalInfo.address, line1: e.target.value },
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={personalInfo.address.city}
                    onChange={(e) =>
                      setPersonalInfo({
                        ...personalInfo,
                        address: { ...personalInfo.address, city: e.target.value },
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="province">Province</Label>
                  <Select
                    value={personalInfo.address.province}
                    onValueChange={(value) =>
                      setPersonalInfo({
                        ...personalInfo,
                        address: { ...personalInfo.address, province: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Shefa">Shefa</SelectItem>
                      <SelectItem value="Sanma">Sanma</SelectItem>
                      <SelectItem value="Tafea">Tafea</SelectItem>
                      <SelectItem value="Malampa">Malampa</SelectItem>
                      <SelectItem value="Penama">Penama</SelectItem>
                      <SelectItem value="Torba">Torba</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handlePersonalInfoSubmit} disabled={loading}>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Driver's License */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold mb-4">Driver's License</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="licenseNumber">License Number *</Label>
                  <Input
                    id="licenseNumber"
                    value={licenseInfo.licenseNumber}
                    onChange={(e) =>
                      setLicenseInfo({ ...licenseInfo, licenseNumber: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="licenseType">License Type/Class</Label>
                  <Input
                    id="licenseType"
                    value={licenseInfo.licenseType}
                    onChange={(e) =>
                      setLicenseInfo({ ...licenseInfo, licenseType: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="issueDate">Issue Date</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={licenseInfo.issueDate}
                    onChange={(e) =>
                      setLicenseInfo({ ...licenseInfo, issueDate: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="expiryDate">Expiry Date *</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={licenseInfo.expiryDate}
                    onChange={(e) =>
                      setLicenseInfo({ ...licenseInfo, expiryDate: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  disabled={loading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={handleLicenseInfoSubmit} disabled={loading}>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Vehicle Information */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold mb-4">Vehicle Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vehicleType">Vehicle Type *</Label>
                  <Select
                    value={vehicleInfo.vehicleType}
                    onValueChange={(value: VehicleType) =>
                      setVehicleInfo({ ...vehicleInfo, vehicleType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="car">Car</SelectItem>
                      <SelectItem value="suv">SUV</SelectItem>
                      <SelectItem value="van">Van</SelectItem>
                      <SelectItem value="moto">Motorcycle</SelectItem>
                      <SelectItem value="bike">Bike</SelectItem>
                      <SelectItem value="wheelchair_van">Wheelchair Van</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="make">Make *</Label>
                  <Input
                    id="make"
                    value={vehicleInfo.make}
                    onChange={(e) =>
                      setVehicleInfo({ ...vehicleInfo, make: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    value={vehicleInfo.model}
                    onChange={(e) =>
                      setVehicleInfo({ ...vehicleInfo, model: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="year">Year *</Label>
                  <Input
                    id="year"
                    type="number"
                    value={vehicleInfo.year}
                    onChange={(e) =>
                      setVehicleInfo({ ...vehicleInfo, year: parseInt(e.target.value) })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={vehicleInfo.color}
                    onChange={(e) =>
                      setVehicleInfo({ ...vehicleInfo, color: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="licensePlate">License Plate *</Label>
                  <Input
                    id="licensePlate"
                    value={vehicleInfo.licensePlate}
                    onChange={(e) =>
                      setVehicleInfo({ ...vehicleInfo, licensePlate: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="passengerCapacity">Passenger Capacity</Label>
                  <Input
                    id="passengerCapacity"
                    type="number"
                    value={vehicleInfo.passengerCapacity}
                    onChange={(e) =>
                      setVehicleInfo({
                        ...vehicleInfo,
                        passengerCapacity: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  disabled={loading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={handleVehicleInfoSubmit} disabled={loading}>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Document Uploads */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold mb-4">Upload Documents</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Please upload clear photos of the following documents:
              </p>

              <div className="space-y-4">
                {[
                  { key: 'drivers_license_front', label: "Driver's License (Front)" },
                  { key: 'drivers_license_back', label: "Driver's License (Back)" },
                  { key: 'vehicle_registration', label: 'Vehicle Registration' },
                  { key: 'vehicle_insurance', label: 'Vehicle Insurance' },
                  { key: 'profile_photo', label: 'Profile Photo' },
                ].map(({ key, label }) => (
                  <div key={key} className="border rounded-lg p-4">
                    <Label htmlFor={key} className="mb-2 block">
                      {label} *
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={key}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) =>
                          handleDocumentUpload(
                            key as DocumentType,
                            e.target.files?.[0] || null
                          )
                        }
                        className="flex-1"
                      />
                      {documents[key as DocumentType] && (
                        <Check className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(3)}
                  disabled={loading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={handleDocumentsSubmit} disabled={loading}>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Review & Submit */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold mb-4">Review & Submit</h2>

              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Personal Information</h3>
                  <p>
                    {personalInfo.firstName} {personalInfo.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {personalInfo.phoneNumber}
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Driver's License</h3>
                  <p>{licenseInfo.licenseNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    Expires: {licenseInfo.expiryDate}
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Vehicle</h3>
                  <p>
                    {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {vehicleInfo.licensePlate} • {vehicleInfo.vehicleType}
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm">
                    By submitting this application, I confirm that all information
                    provided is accurate and I agree to VanuWay's terms and conditions
                    for drivers.
                  </p>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(4)}
                  disabled={loading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={handleFinalSubmit} disabled={loading}>
                  <Check className="mr-2 h-4 w-4" /> Submit Application
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
