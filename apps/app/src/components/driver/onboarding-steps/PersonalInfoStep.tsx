import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PersonalInfoData } from '@/types/driver-onboarding';
import { ArrowRight } from 'lucide-react';

interface PersonalInfoStepProps {
  initialData?: PersonalInfoData;
  onNext: (data: PersonalInfoData) => void;
}

export const PersonalInfoStep = ({ initialData, onNext }: PersonalInfoStepProps) => {
  const [formData, setFormData] = useState<PersonalInfoData>(
    initialData || {
      first_name: '',
      last_name: '',
      date_of_birth: '',
      gender: 'prefer_not_to_say',
      phone_number: '',
      email: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      address_line1: '',
      address_line2: '',
      city: '',
      province: '',
      postal_code: '',
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Personal Information</h2>
        <p className="text-muted-foreground">
          Let's start with your basic information
        </p>
      </div>

      {/* Name */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">First Name *</Label>
          <Input
            id="first_name"
            required
            value={formData.first_name}
            onChange={(e) =>
              setFormData({ ...formData, first_name: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name *</Label>
          <Input
            id="last_name"
            required
            value={formData.last_name}
            onChange={(e) =>
              setFormData({ ...formData, last_name: e.target.value })
            }
          />
        </div>
      </div>

      {/* DOB & Gender */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date_of_birth">Date of Birth *</Label>
          <Input
            id="date_of_birth"
            type="date"
            required
            value={formData.date_of_birth}
            onChange={(e) =>
              setFormData({ ...formData, date_of_birth: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Gender</Label>
          <RadioGroup
            value={formData.gender}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                gender: value as PersonalInfoData['gender'],
              })
            }
          >
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="male" />
                <Label htmlFor="male" className="font-normal">
                  Male
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="female" />
                <Label htmlFor="female" className="font-normal">
                  Female
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other" className="font-normal">
                  Other
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>
      </div>

      {/* Contact */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone_number">Phone Number *</Label>
          <Input
            id="phone_number"
            type="tel"
            placeholder="+678 ..."
            required
            value={formData.phone_number}
            onChange={(e) =>
              setFormData({ ...formData, phone_number: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
        </div>
      </div>

      {/* Address */}
      <div className="space-y-4">
        <h3 className="font-semibold">Address</h3>
        <div className="space-y-2">
          <Label htmlFor="address_line1">Address Line 1 *</Label>
          <Input
            id="address_line1"
            placeholder="Street address"
            required
            value={formData.address_line1}
            onChange={(e) =>
              setFormData({ ...formData, address_line1: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address_line2">Address Line 2</Label>
          <Input
            id="address_line2"
            placeholder="Apartment, suite, etc. (optional)"
            value={formData.address_line2}
            onChange={(e) =>
              setFormData({ ...formData, address_line2: e.target.value })
            }
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              required
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="province">Province *</Label>
            <Input
              id="province"
              required
              value={formData.province}
              onChange={(e) =>
                setFormData({ ...formData, province: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postal_code">Postal Code</Label>
            <Input
              id="postal_code"
              value={formData.postal_code}
              onChange={(e) =>
                setFormData({ ...formData, postal_code: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="space-y-4">
        <h3 className="font-semibold">Emergency Contact</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emergency_contact_name">Contact Name *</Label>
            <Input
              id="emergency_contact_name"
              required
              value={formData.emergency_contact_name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  emergency_contact_name: e.target.value,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergency_contact_phone">Contact Phone *</Label>
            <Input
              id="emergency_contact_phone"
              type="tel"
              placeholder="+678 ..."
              required
              value={formData.emergency_contact_phone}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  emergency_contact_phone: e.target.value,
                })
              }
            />
          </div>
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full">
        Continue
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </form>
  );
};
