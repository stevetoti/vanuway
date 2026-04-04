import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, Camera, MapPin, Loader2, Shield, Flame, Heart,
  Car, CloudRain, Wrench, AlertTriangle, Send, CheckCircle2
} from 'lucide-react';

const categories = [
  { id: 'fire', name: 'Fire', icon: Flame, color: 'bg-orange-100 text-orange-600' },
  { id: 'accident', name: 'Accident', icon: Car, color: 'bg-red-100 text-red-600' },
  { id: 'crime', name: 'Crime', icon: Shield, color: 'bg-purple-100 text-purple-600' },
  { id: 'medical', name: 'Medical', icon: Heart, color: 'bg-pink-100 text-pink-600' },
  { id: 'natural_disaster', name: 'Disaster', icon: CloudRain, color: 'bg-blue-100 text-blue-600' },
  { id: 'infrastructure', name: 'Infrastructure', icon: Wrench, color: 'bg-gray-100 text-gray-600' },
  { id: 'other', name: 'Other', icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-600' },
];

export default function ReportEmergency() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [island, setIsland] = useState('Efate');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const getLocation = () => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsGettingLocation(false);
          toast({
            title: "Location captured",
            description: "Your current location has been added to the report"
          });
        },
        (error) => {
          console.error('Location error:', error);
          setIsGettingLocation(false);
          toast({
            title: "Location unavailable",
            description: "Please enter your location manually",
            variant: "destructive"
          });
        }
      );
    } else {
      setIsGettingLocation(false);
      toast({
        title: "Location not supported",
        description: "Please enter your location manually",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to report an emergency",
        variant: "destructive"
      });
      return;
    }

    if (!category || !title || !description) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await (supabase as any).from('emergency_reports').insert({
        user_id: user.id,
        category,
        title,
        description,
        address,
        island,
        latitude: location?.lat,
        longitude: location?.lng,
        status: 'pending'
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast({
        title: "Report submitted",
        description: "Emergency services have been notified"
      });
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: "Submission failed",
        description: "Please try again or call emergency services directly",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">Report Submitted</h2>
          <p className="text-muted-foreground mb-6">
            Your emergency report has been submitted. Emergency services will respond as soon as possible.
          </p>
          <div className="space-y-3">
            <Button
              className="w-full bg-red-600 hover:bg-red-700"
              onClick={() => window.location.href = 'tel:111'}
            >
              Call Police (111)
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/emergency')}
            >
              Return to Emergency Services
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-red-600 to-red-500 text-white">
        <div className="px-4 pt-4 pb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => navigate('/emergency')}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold">Report Emergency</h1>
          </div>
          <p className="text-white/80 text-sm">
            For immediate emergencies, please call 111 (Police), 112 (Fire), or 115 (Ambulance)
          </p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Category Selection */}
        <div>
          <Label className="text-base font-semibold mb-3 block">What type of emergency?</Label>
          <div className="grid grid-cols-4 gap-2">
            {categories.map(cat => {
              const Icon = cat.icon;
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  className={`p-3 rounded-lg flex flex-col items-center gap-1 transition-all ${
                    isSelected
                      ? 'bg-red-600 text-white ring-2 ring-red-600 ring-offset-2'
                      : `${cat.color} hover:ring-2 hover:ring-red-200`
                  }`}
                  onClick={() => setCategory(cat.id)}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Title */}
        <div>
          <Label htmlFor="title" className="text-base font-semibold">Brief Title *</Label>
          <Input
            id="title"
            placeholder="e.g., Building fire on Main Street"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-2"
          />
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description" className="text-base font-semibold">Description *</Label>
          <Textarea
            id="description"
            placeholder="Describe the emergency situation, any injuries, and immediate dangers..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-2 min-h-[120px]"
          />
        </div>

        {/* Location */}
        <div>
          <Label className="text-base font-semibold mb-2 block">Location</Label>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={getLocation}
              disabled={isGettingLocation}
            >
              {isGettingLocation ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <MapPin className="h-4 w-4 mr-2" />
              )}
              {location ? 'Location captured' : 'Use my current location'}
              {location && <CheckCircle2 className="h-4 w-4 ml-auto text-green-600" />}
            </Button>
            <Input
              placeholder="Address or landmark"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <RadioGroup value={island} onValueChange={setIsland} className="flex flex-wrap gap-4">
              {['Efate', 'Santo', 'Tanna', 'Malekula', 'Other'].map(islandName => (
                <div key={islandName} className="flex items-center space-x-2">
                  <RadioGroupItem value={islandName} id={islandName} />
                  <Label htmlFor={islandName} className="font-normal cursor-pointer">{islandName}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        {/* Photo Upload Placeholder */}
        <Card className="border-dashed border-2">
          <CardContent className="p-6 text-center">
            <Camera className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Tap to add a photo of the situation
            </p>
          </CardContent>
        </Card>

        {/* Important Notice */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-yellow-800">Important</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  This report supplements but does not replace calling emergency services.
                  For life-threatening emergencies, always call 111, 112, or 115 first.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <Button
          className="w-full bg-red-600 hover:bg-red-700 h-12"
          onClick={handleSubmit}
          disabled={isSubmitting || !category || !title || !description}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-5 w-5 mr-2" />
              Submit Emergency Report
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
