import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, Save, MapPin, Clock, Users, DollarSign, Calendar,
  Plus, X, Image, Star, Info
} from 'lucide-react';
import { TOUR_CATEGORIES, VANUATU_ISLANDS } from '@/types/tourOperator';

const DAYS_OF_WEEK = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

const DEFAULT_TIMES = ['07:00', '08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

export default function AddTour() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [operator, setOperator] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    short_description: '',
    description: '',
    category: '',
    location: '',
    island: '',
    price_adult: '',
    price_child: '',
    duration_hours: '',
    difficulty_level: 'easy',
    max_group_size: '10',
    min_age: '0',
    available_days: [...DAYS_OF_WEEK],
    start_times: ['09:00'],
    highlights: [''],
    includes: [''],
    excludes: [''],
    what_to_bring: [''],
    is_active: true,
  });

  useEffect(() => {
    if (user) {
      loadOperator();
    }
  }, [user]);

  const loadOperator = async () => {
    if (!user) return;

    const { data, error } = await (supabase as any)
      .from('tour_operators')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !data || data.application_status !== 'approved') {
      navigate('/tours/operator/register');
      return;
    }

    setOperator(data);
    setFormData(prev => ({
      ...prev,
      island: data.island,
      location: data.island,
    }));
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      available_days: prev.available_days.includes(day)
        ? prev.available_days.filter(d => d !== day)
        : [...prev.available_days, day],
    }));
  };

  const toggleTime = (time: string) => {
    setFormData(prev => ({
      ...prev,
      start_times: prev.start_times.includes(time)
        ? prev.start_times.filter(t => t !== time)
        : [...prev.start_times, time],
    }));
  };

  const addArrayItem = (field: 'highlights' | 'includes' | 'excludes' | 'what_to_bring') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ''],
    }));
  };

  const updateArrayItem = (field: 'highlights' | 'includes' | 'excludes' | 'what_to_bring', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item),
    }));
  };

  const removeArrayItem = (field: 'highlights' | 'includes' | 'excludes' | 'what_to_bring', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!operator) return;

    // Validation
    if (!formData.name || !formData.description || !formData.category || !formData.price_adult || !formData.duration_hours) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const tourData = {
        operator_id: operator.id,
        provider_id: user?.id,
        provider_name: operator.business_name,
        name: formData.name,
        short_description: formData.short_description || formData.description.substring(0, 150),
        description: formData.description,
        category: formData.category,
        location: formData.location,
        island: formData.island,
        price_adult: parseFloat(formData.price_adult),
        price_child: formData.price_child ? parseFloat(formData.price_child) : null,
        duration_hours: parseFloat(formData.duration_hours),
        difficulty_level: formData.difficulty_level,
        max_group_size: parseInt(formData.max_group_size),
        min_age: parseInt(formData.min_age),
        available_days: formData.available_days,
        start_times: formData.start_times,
        highlights: formData.highlights.filter(h => h.trim()),
        includes: formData.includes.filter(i => i.trim()),
        excludes: formData.excludes.filter(e => e.trim()),
        what_to_bring: formData.what_to_bring.filter(w => w.trim()),
        is_active: formData.is_active,
        approval_status: 'pending',
        rating: 5.0,
        review_count: 0,
      };

      const { error } = await (supabase as any)
        .from('tours')
        .insert(tourData);

      if (error) throw error;

      toast({
        title: 'Tour Submitted!',
        description: 'Your tour has been submitted for approval. We will review it shortly.',
      });

      navigate('/tours/operator/dashboard');
    } catch (error: any) {
      console.error('Error adding tour:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add tour',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!operator) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white px-4 py-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => navigate('/tours/operator/dashboard')}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Add New Tour</h1>
            <p className="text-sm text-white/80">Create a tour listing</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Tour Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g., Blue Hole Adventure Tour"
              />
            </div>

            <div>
              <Label htmlFor="short_description">Short Description</Label>
              <Input
                id="short_description"
                value={formData.short_description}
                onChange={(e) => updateField('short_description', e.target.value)}
                placeholder="Brief tagline (max 150 characters)"
                maxLength={150}
              />
            </div>

            <div>
              <Label htmlFor="description">Full Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Detailed description of your tour experience..."
                rows={5}
              />
            </div>

            <div>
              <Label>Category *</Label>
              <Select value={formData.category} onValueChange={(v) => updateField('category', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {TOUR_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-emerald-600" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Island *</Label>
                <Select value={formData.island} onValueChange={(v) => updateField('island', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select island" />
                  </SelectTrigger>
                  <SelectContent>
                    {VANUATU_ISLANDS.map((island) => (
                      <SelectItem key={island} value={island}>{island}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="location">Specific Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  placeholder="e.g., Luganville"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              Pricing (VUV)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price_adult">Adult Price *</Label>
                <Input
                  id="price_adult"
                  type="number"
                  value={formData.price_adult}
                  onChange={(e) => updateField('price_adult', e.target.value)}
                  placeholder="5000"
                />
              </div>
              <div>
                <Label htmlFor="price_child">Child Price</Label>
                <Input
                  id="price_child"
                  type="number"
                  value={formData.price_child}
                  onChange={(e) => updateField('price_child', e.target.value)}
                  placeholder="3000"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tour Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald-600" />
              Tour Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration_hours">Duration (hours) *</Label>
                <Input
                  id="duration_hours"
                  type="number"
                  step="0.5"
                  value={formData.duration_hours}
                  onChange={(e) => updateField('duration_hours', e.target.value)}
                  placeholder="3"
                />
              </div>
              <div>
                <Label>Difficulty</Label>
                <Select value={formData.difficulty_level} onValueChange={(v) => updateField('difficulty_level', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="challenging">Challenging</SelectItem>
                    <SelectItem value="extreme">Extreme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="max_group_size">Max Group Size</Label>
                <Input
                  id="max_group_size"
                  type="number"
                  value={formData.max_group_size}
                  onChange={(e) => updateField('max_group_size', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="min_age">Minimum Age</Label>
                <Input
                  id="min_age"
                  type="number"
                  value={formData.min_age}
                  onChange={(e) => updateField('min_age', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Availability */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600" />
              Availability
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Available Days</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {DAYS_OF_WEEK.map((day) => (
                  <Badge
                    key={day}
                    variant={formData.available_days.includes(day) ? 'default' : 'outline'}
                    className={`cursor-pointer capitalize ${formData.available_days.includes(day) ? 'bg-emerald-600' : ''}`}
                    onClick={() => toggleDay(day)}
                  >
                    {day.slice(0, 3)}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Start Times</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {DEFAULT_TIMES.map((time) => (
                  <Badge
                    key={time}
                    variant={formData.start_times.includes(time) ? 'default' : 'outline'}
                    className={`cursor-pointer ${formData.start_times.includes(time) ? 'bg-emerald-600' : ''}`}
                    onClick={() => toggleTime(time)}
                  >
                    {time}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Highlights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-emerald-600" />
              Tour Highlights
            </CardTitle>
            <CardDescription>Key experiences guests will enjoy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {formData.highlights.map((highlight, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={highlight}
                  onChange={(e) => updateArrayItem('highlights', index, e.target.value)}
                  placeholder="e.g., Swim in crystal-clear waters"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeArrayItem('highlights', index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addArrayItem('highlights')}>
              <Plus className="h-4 w-4 mr-1" /> Add Highlight
            </Button>
          </CardContent>
        </Card>

        {/* What's Included */}
        <Card>
          <CardHeader>
            <CardTitle>What's Included</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {formData.includes.map((item, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={item}
                  onChange={(e) => updateArrayItem('includes', index, e.target.value)}
                  placeholder="e.g., Lunch, Transport"
                />
                <Button variant="ghost" size="icon" onClick={() => removeArrayItem('includes', index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addArrayItem('includes')}>
              <Plus className="h-4 w-4 mr-1" /> Add Item
            </Button>
          </CardContent>
        </Card>

        {/* What's Not Included */}
        <Card>
          <CardHeader>
            <CardTitle>What's Not Included</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {formData.excludes.map((item, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={item}
                  onChange={(e) => updateArrayItem('excludes', index, e.target.value)}
                  placeholder="e.g., Flights, Personal expenses"
                />
                <Button variant="ghost" size="icon" onClick={() => removeArrayItem('excludes', index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addArrayItem('excludes')}>
              <Plus className="h-4 w-4 mr-1" /> Add Item
            </Button>
          </CardContent>
        </Card>

        {/* What to Bring */}
        <Card>
          <CardHeader>
            <CardTitle>What to Bring</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {formData.what_to_bring.map((item, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={item}
                  onChange={(e) => updateArrayItem('what_to_bring', index, e.target.value)}
                  placeholder="e.g., Swimsuit, Sunscreen"
                />
                <Button variant="ghost" size="icon" onClick={() => removeArrayItem('what_to_bring', index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addArrayItem('what_to_bring')}>
              <Plus className="h-4 w-4 mr-1" /> Add Item
            </Button>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Make Active After Approval</Label>
                <p className="text-sm text-muted-foreground">Tour will be visible to customers once approved</p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => updateField('is_active', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Approval Process</p>
            <p>Your tour will be reviewed by our team before it goes live. This usually takes 1-2 business days. You can add photos after the tour is created.</p>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          className="w-full bg-emerald-600 hover:bg-emerald-700 h-12"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          <Save className="h-5 w-5 mr-2" />
          {isSubmitting ? 'Submitting...' : 'Submit Tour for Approval'}
        </Button>
      </div>
    </div>
  );
}
