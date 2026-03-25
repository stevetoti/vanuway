import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft, ArrowRight, Car, Utensils, Building2, MapPin,
  Package, Briefcase, ShoppingBag, Heart, Compass, Ship,
  Check, ChevronRight, Sparkles
} from 'lucide-react';

const interests = [
  { id: 'rides', name: 'Rides', icon: Car, color: 'bg-blue-500' },
  { id: 'food', name: 'Food Delivery', icon: Utensils, color: 'bg-red-500' },
  { id: 'hotels', name: 'Hotels', icon: Building2, color: 'bg-purple-500' },
  { id: 'delivery', name: 'Delivery', icon: Package, color: 'bg-green-500' },
  { id: 'tours', name: 'Tours', icon: Compass, color: 'bg-teal-500' },
  { id: 'shopping', name: 'Shopping', icon: ShoppingBag, color: 'bg-orange-500' },
  { id: 'jobs', name: 'Jobs', icon: Briefcase, color: 'bg-indigo-500' },
  { id: 'health', name: 'Health', icon: Heart, color: 'bg-pink-500' },
  { id: 'ferry', name: 'Ferry', icon: Ship, color: 'bg-cyan-500' },
];

const steps = [
  { id: 1, title: 'Welcome' },
  { id: 2, title: 'Interests' },
  { id: 3, title: 'Location' },
  { id: 4, title: 'Complete' },
];

export default function OnboardingIndex() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [location, setLocation] = useState('');

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const progress = (step / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-indigo-700 text-white">
      {/* Progress */}
      <div className="px-4 pt-4">
        <Progress value={progress} className="h-1.5 bg-white/20" />
        <div className="flex items-center justify-between mt-2">
          {steps.map(s => (
            <div
              key={s.id}
              className={`text-xs ${s.id <= step ? 'text-white' : 'text-white/40'}`}
            >
              {s.title}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Welcome */}
      {step === 1 && (
        <div className="px-6 pt-16 text-center">
          <Sparkles className="h-16 w-16 mx-auto mb-6 animate-pulse" />
          <h1 className="text-3xl font-bold mb-3">Welcome to VanuWay!</h1>
          <p className="text-white/80 text-lg mb-2">Your one-stop app for everything in Vanuatu</p>
          <p className="text-white/60 text-sm mb-12">
            Rides, food, hotels, tours, shopping, jobs and more — all in one place.
          </p>

          <div className="space-y-3">
            <Button
              className="w-full h-14 text-lg bg-white text-blue-600 hover:bg-gray-100"
              onClick={() => setStep(2)}
            >
              Get Started
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Button
              variant="ghost"
              className="w-full text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => navigate('/')}
            >
              Skip for now
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Select Interests */}
      {step === 2 && (
        <div className="px-4 pt-8">
          <h2 className="text-2xl font-bold text-center mb-2">What interests you?</h2>
          <p className="text-white/70 text-center text-sm mb-8">Select services you'd like to use</p>

          <div className="grid grid-cols-3 gap-3 mb-8">
            {interests.map(interest => {
              const Icon = interest.icon;
              const selected = selectedInterests.includes(interest.id);
              return (
                <button
                  key={interest.id}
                  onClick={() => toggleInterest(interest.id)}
                  className={`relative p-4 rounded-2xl flex flex-col items-center gap-2 transition-all ${
                    selected
                      ? 'bg-white text-blue-600 shadow-lg scale-105'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {selected && (
                    <div className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                  <Icon className="h-7 w-7" />
                  <span className="text-xs font-medium">{interest.name}</span>
                </button>
              );
            })}
          </div>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              className="flex-1 text-white/70 hover:bg-white/10"
              onClick={() => setStep(1)}
            >
              Back
            </Button>
            <Button
              className="flex-1 bg-white text-blue-600 hover:bg-gray-100"
              onClick={() => setStep(3)}
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Location */}
      {step === 3 && (
        <div className="px-4 pt-8">
          <h2 className="text-2xl font-bold text-center mb-2">Set Your Location</h2>
          <p className="text-white/70 text-center text-sm mb-8">
            We'll show you relevant services nearby
          </p>

          <Card className="bg-white/95 backdrop-blur shadow-xl mb-6">
            <CardContent className="p-4">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Enter your area or neighborhood..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10 h-12 text-gray-900"
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-2 mb-8">
            {['Port Vila', 'Tassiriki', 'Nambatu', 'Freshwota', 'Malapoa', 'Elluk'].map(area => (
              <Button
                key={area}
                variant="ghost"
                size="sm"
                className={`border border-white/20 ${
                  location === area ? 'bg-white text-blue-600' : 'text-white hover:bg-white/10'
                }`}
                onClick={() => setLocation(area)}
              >
                {area}
              </Button>
            ))}
          </div>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              className="flex-1 text-white/70 hover:bg-white/10"
              onClick={() => setStep(2)}
            >
              Back
            </Button>
            <Button
              className="flex-1 bg-white text-blue-600 hover:bg-gray-100"
              onClick={() => setStep(4)}
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Complete */}
      {step === 4 && (
        <div className="px-6 pt-16 text-center">
          <div className="h-20 w-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-3">You're All Set!</h2>
          <p className="text-white/80 text-lg mb-2">Welcome to VanuWay</p>
          <p className="text-white/60 text-sm mb-12">
            Explore all the services Vanuatu has to offer
          </p>

          <Button
            className="w-full h-14 text-lg bg-white text-blue-600 hover:bg-gray-100"
            onClick={() => navigate('/')}
          >
            Explore VanuWay
            <ChevronRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
