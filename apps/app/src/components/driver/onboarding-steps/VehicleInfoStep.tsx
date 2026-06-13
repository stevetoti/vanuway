import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { VehicleInfoData } from '@/types/driver-onboarding';
import { ArrowLeft, ArrowRight, Car, Bike, Truck } from 'lucide-react';

interface VehicleInfoStepProps {
  initialData?: VehicleInfoData;
  onNext: (data: VehicleInfoData) => void;
  onBack: () => void;
}

export const VehicleInfoStep = ({
  initialData,
  onNext,
  onBack,
}: VehicleInfoStepProps) => {
  const [formData, setFormData] = useState<VehicleInfoData>(
    initialData || {
      vehicle_type: 'car',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      color: '',
      license_plate: '',
      registration_number: '',
      registration_expiry: '',
      insurance_provider: '',
      insurance_policy_number: '',
      insurance_expiry: '',
      passenger_capacity: 4,
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  };

  const vehicleTypes = [
    { value: 'car', label: 'Car', icon: Car, capacity: 4 },
    { value: 'suv', label: 'SUV', icon: Car, capacity: 7 },
    { value: 'van', label: 'Van', icon: Truck, capacity: 13 },
    { value: 'moto', label: 'Motorcycle', icon: Bike, capacity: 1 },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Vehicle Information</h2>
        <p className="text-muted-foreground">
          Tell us about the vehicle you'll be driving
        </p>
      </div>

      {/* Vehicle Type */}
      <div className="space-y-3">
        <Label>Vehicle Type *</Label>
        <RadioGroup
          value={formData.vehicle_type}
          onValueChange={(value) => {
            const selectedType = vehicleTypes.find((t) => t.value === value);
            setFormData({
              ...formData,
              vehicle_type: value as VehicleInfoData['vehicle_type'],
              passenger_capacity: selectedType?.capacity || 4,
            });
          }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {vehicleTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Label
                  key={type.value}
                  htmlFor={type.value}
                  className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.vehicle_type === type.value
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem
                    value={type.value}
                    id={type.value}
                    className="sr-only"
                  />
                  <Icon className="h-8 w-8" />
                  <div className="text-center">
                    <div className="font-semibold">{type.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {type.capacity} {type.capacity === 1 ? 'passenger' : 'passengers'}
                    </div>
                  </div>
                </Label>
              );
            })}
          </div>
        </RadioGroup>
      </div>

      {/* Vehicle Details */}
      <div className="space-y-4">
        <h3 className="font-semibold">Vehicle Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="make">Make *</Label>
            <Input
              id="make"
              placeholder="e.g., Toyota"
              required
              value={formData.make}
              onChange={(e) => setFormData({ ...formData, make: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Model *</Label>
            <Input
              id="model"
              placeholder="e.g., Corolla"
              required
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="year">Year *</Label>
            <Input
              id="year"
              type="number"
              min="1990"
              max={new Date().getFullYear() + 1}
              required
              value={formData.year}
              onChange={(e) =>
                setFormData({ ...formData, year: parseInt(e.target.value) })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">Color *</Label>
            <Input
              id="color"
              placeholder="e.g., White"
              required
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="license_plate">License Plate *</Label>
            <Input
              id="license_plate"
              placeholder="ABC123"
              required
              value={formData.license_plate}
              onChange={(e) =>
                setFormData({ ...formData, license_plate: e.target.value.toUpperCase() })
              }
            />
          </div>
        </div>
      </div>

      {/* Registration */}
      <div className="space-y-4">
        <h3 className="font-semibold">Vehicle Registration</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="registration_number">Registration Number</Label>
            <Input
              id="registration_number"
              placeholder="Registration #"
              value={formData.registration_number}
              onChange={(e) =>
                setFormData({ ...formData, registration_number: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="registration_expiry">Registration Expiry</Label>
            <Input
              id="registration_expiry"
              type="date"
              value={formData.registration_expiry}
              onChange={(e) =>
                setFormData({ ...formData, registration_expiry: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      {/* Insurance */}
      <div className="space-y-4">
        <h3 className="font-semibold">Vehicle Insurance *</h3>
        <div className="space-y-2">
          <Label htmlFor="insurance_provider">Insurance Provider *</Label>
          <Input
            id="insurance_provider"
            placeholder="e.g., Vanuatu Insurance"
            required
            value={formData.insurance_provider}
            onChange={(e) =>
              setFormData({ ...formData, insurance_provider: e.target.value })
            }
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="insurance_policy_number">Policy Number *</Label>
            <Input
              id="insurance_policy_number"
              placeholder="Policy #"
              required
              value={formData.insurance_policy_number}
              onChange={(e) =>
                setFormData({ ...formData, insurance_policy_number: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="insurance_expiry">Expiry Date *</Label>
            <Input
              id="insurance_expiry"
              type="date"
              required
              value={formData.insurance_expiry}
              onChange={(e) =>
                setFormData({ ...formData, insurance_expiry: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button type="submit" className="flex-1">
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};
