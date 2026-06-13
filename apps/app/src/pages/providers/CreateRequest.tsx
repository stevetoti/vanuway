import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, Calendar as CalendarIcon, Clock, MapPin, DollarSign,
  AlertTriangle, Loader2, Check, Camera
} from 'lucide-react';
import { format } from 'date-fns';
import { ServiceCategory, VANUATU_ISLANDS, URGENCY_LEVELS } from '@/types/serviceProvider';
import { cn } from '@/lib/utils';

export default function CreateRequest() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedProvider = searchParams.get('provider');
  const { user } = useAuth();
  const { toast } = useToast();

  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [island, setIsland] = useState('Efate');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [urgency, setUrgency] = useState<'normal' | 'urgent' | 'emergency'>('normal');
  const [preferredDate, setPreferredDate] = useState<Date | undefined>();
  const [isFlexible, setIsFlexible] = useState(true);
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['service-categories'],
    queryFn: async () => {
      const { data, error } = await (supabase as unknown)
        .from('service_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return data as ServiceCategory[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Please login to create a request');
      if (!category) throw new Error('Please select a category');
      if (!title) throw new Error('Please enter a title');
      if (!description) throw new Error('Please describe what you need');
      if (!address) throw new Error('Please enter your address');
      if (!contactName) throw new Error('Please enter your name');
      if (!contactPhone) throw new Error('Please enter your phone number');

      const { data, error } = await (supabase as unknown)
        .from('service_requests')
        .insert({
          user_id: user.id,
          provider_id: preselectedProvider || null,
          category,
          title,
          description,
          island,
          address,
          area: area || null,
          urgency,
          preferred_date: preferredDate ? format(preferredDate, 'yyyy-MM-dd') : null,
          is_flexible: isFlexible,
          budget_min: budgetMin ? parseFloat(budgetMin) : null,
          budget_max: budgetMax ? parseFloat(budgetMax) : null,
          contact_name: contactName,
          contact_phone: contactPhone,
          contact_email: contactEmail || null,
          status: preselectedProvider ? 'assigned' : 'open',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Request Posted!',
        description: preselectedProvider
          ? 'The provider has been notified of your request'
          : 'Your request is now visible to service providers',
      });
      navigate('/providers/my-requests');
    },
    onError: (error: unknown) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create request',
        variant: 'destructive',
      });
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 to-yellow-500 text-white">
        <div className="px-4 pt-4 pb-6">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold">Post Service Request</h1>
          </div>
          <p className="text-white/80 text-sm">
            Describe what you need and get quotes from local professionals
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="p-4 space-y-6">
        {/* Category & Title */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What do you need?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Service Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map(cat => (
                    <SelectItem key={cat.slug} value={cat.slug}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Fix leaking tap in kitchen"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the job in detail. What's the problem? What needs to be done?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="island">Island *</Label>
              <Select value={island} onValueChange={setIsland}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VANUATU_ISLANDS.map(i => (
                    <SelectItem key={i} value={i}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                placeholder="Street address or location description"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">Area/Suburb</Label>
              <Input
                id="area"
                placeholder="e.g., Nambatu, Tagabe"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Urgency & Timing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              When do you need it?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Urgency</Label>
              <RadioGroup value={urgency} onValueChange={(v) => setUrgency(v as unknown)}>
                {Object.entries(URGENCY_LEVELS).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <RadioGroupItem value={key} id={key} />
                    <Label htmlFor={key} className="flex-1 cursor-pointer">
                      <span className={cn(
                        "font-medium",
                        key === 'emergency' && "text-red-600",
                        key === 'urgent' && "text-orange-600"
                      )}>{value.label}</span>
                      <span className="text-sm text-muted-foreground ml-2">{value.description}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Preferred Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left",
                      !preferredDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {preferredDate ? format(preferredDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={preferredDate}
                    onSelect={setPreferredDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="flexible">I'm flexible with timing</Label>
                <p className="text-xs text-muted-foreground">Provider can suggest alternative times</p>
              </div>
              <Switch
                id="flexible"
                checked={isFlexible}
                onCheckedChange={setIsFlexible}
              />
            </div>
          </CardContent>
        </Card>

        {/* Budget */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Budget (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <div className="flex-1 space-y-2">
                <Label htmlFor="budget-min">Min (VUV)</Label>
                <Input
                  id="budget-min"
                  type="number"
                  placeholder="0"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="budget-max">Max (VUV)</Label>
                <Input
                  id="budget-max"
                  type="number"
                  placeholder="0"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Leave blank if you want to receive all quotes
            </p>
          </CardContent>
        </Card>

        {/* Contact Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact-name">Your Name *</Label>
              <Input
                id="contact-name"
                placeholder="Full name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-phone">Phone Number *</Label>
              <Input
                id="contact-phone"
                placeholder="+678 1234567"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-email">Email (Optional)</Label>
              <Input
                id="contact-email"
                type="email"
                placeholder="your@email.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Emergency Notice */}
        {urgency === 'emergency' && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Emergency Request</p>
                <p className="text-sm text-red-700">
                  Emergency requests may incur additional fees. Providers available for emergencies will respond quickly.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <Button
          className="w-full bg-orange-500 hover:bg-orange-600 h-12"
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Posting...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Post Request
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
