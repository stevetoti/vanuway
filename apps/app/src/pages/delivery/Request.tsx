import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Package, Bike, MapPin, User, Phone, ArrowRight } from 'lucide-react';
import { createDeliveryBooking, getDeliveryPriceEstimate } from '@/lib/delivery/delivery-service';

const DeliveryRequest = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [vehicleType, setVehicleType] = useState<'moto' | 'bike'>('moto');
  
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupLat, setPickupLat] = useState(0);
  const [pickupLng, setPickupLng] = useState(0);
  
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [dropoffLat, setDropoffLat] = useState(0);
  const [dropoffLng, setDropoffLng] = useState(0);
  
  const [packageDescription, setPackageDescription] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');

  const priceEstimate = pickupLat && dropoffLat ? getDeliveryPriceEstimate(
    { lat: pickupLat, lng: pickupLng },
    { lat: dropoffLat, lng: dropoffLng },
    vehicleType
  ) : null;

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please log in to request a delivery');
      return;
    }

    if (!pickupLocation || !dropoffLocation) {
      toast.error('Please enter pickup and dropoff locations');
      return;
    }

    if (!packageDescription) {
      toast.error('Please describe your package');
      return;
    }

    if (!recipientName || !recipientPhone) {
      toast.error('Please enter recipient details');
      return;
    }

    setLoading(true);
    try {
      const result = await createDeliveryBooking(user.id, {
        pickupLocation: { lat: pickupLat, lng: pickupLng, address: pickupLocation },
        dropoffLocation: { lat: dropoffLat, lng: dropoffLng, address: dropoffLocation },
        packageDescription,
        recipientName,
        recipientPhone,
        vehicleType,
        paymentMethodType: 'cash',
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success('Delivery booked! Finding a driver...');
      navigate(`/rides/track/${result.bookingId}`);
    } catch (error: unknown) {
      toast.error(error.message || 'Failed to book delivery');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Send a Package</h1>
          <p className="text-muted-foreground">Fast courier delivery with VanuRide</p>
        </div>

        {/* Vehicle Type Selection */}
        <Card className="p-4">
          <Label className="text-base font-semibold mb-3 block">Choose Vehicle Type</Label>
          <RadioGroup value={vehicleType} onValueChange={(v) => setVehicleType(v as 'moto' | 'bike')} className="grid grid-cols-2 gap-4">
            <div>
              <RadioGroupItem value="moto" id="moto" className="peer sr-only" />
              <Label
                htmlFor="moto"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <Package className="mb-3 h-6 w-6" />
                <span className="font-medium">Motorcycle</span>
                <span className="text-xs text-muted-foreground">Faster delivery</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="bike" id="bike" className="peer sr-only" />
              <Label
                htmlFor="bike"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <Bike className="mb-3 h-6 w-6" />
                <span className="font-medium">Bicycle</span>
                <span className="text-xs text-muted-foreground">Eco-friendly</span>
              </Label>
            </div>
          </RadioGroup>
        </Card>

        {/* Locations */}
        <Card className="p-4 space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Pickup Location
            </Label>
            <Input
              value={pickupLocation}
              onChange={(e) => {
                setPickupLocation(e.target.value);
                // Set default coordinates for Port Vila if not using Places API
                if (e.target.value && !pickupLat) {
                  setPickupLat(-17.7333);
                  setPickupLng(168.3167);
                }
              }}
              placeholder="Where to pick up the package?"
            />
          </div>

          <div className="flex justify-center">
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-destructive" />
              Dropoff Location
            </Label>
            <Input
              value={dropoffLocation}
              onChange={(e) => {
                setDropoffLocation(e.target.value);
                // Set slightly different coordinates for dropoff
                if (e.target.value && !dropoffLat) {
                  setDropoffLat(-17.7400);
                  setDropoffLng(168.3200);
                }
              }}
              placeholder="Where to deliver?"
            />
          </div>
        </Card>

        {/* Package Details */}
        <Card className="p-4 space-y-4">
          <Label className="text-base font-semibold">Package Details</Label>
          <div className="space-y-2">
            <Label>What are you sending?</Label>
            <Textarea
              value={packageDescription}
              onChange={(e) => setPackageDescription(e.target.value)}
              placeholder="e.g., Small box with documents, food package, etc."
              rows={2}
            />
          </div>
        </Card>

        {/* Recipient Details */}
        <Card className="p-4 space-y-4">
          <Label className="text-base font-semibold">Recipient Details</Label>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Recipient Name
            </Label>
            <Input
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Who will receive the package?"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Recipient Phone
            </Label>
            <Input
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="+678 XXXXXXX"
              type="tel"
            />
          </div>
        </Card>

        {/* Price Estimate */}
        {priceEstimate && (
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Estimated Price</p>
                <p className="text-2xl font-bold text-primary">
                  VUV {priceEstimate.totalPrice.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Base: VUV {priceEstimate.basePrice} + Distance: VUV {priceEstimate.distancePrice} + Handling: VUV {priceEstimate.handlingFee}
                </p>
              </div>
              <Package className="h-10 w-10 text-primary/50" />
            </div>
          </Card>
        )}

        {/* Submit Button */}
        <Button 
          className="w-full" 
          size="lg" 
          onClick={handleSubmit}
          disabled={loading || !pickupLocation || !dropoffLocation}
        >
          {loading ? 'Finding Driver...' : 'Request Delivery'}
        </Button>
      </div>
    </Layout>
  );
};

export default DeliveryRequest;
