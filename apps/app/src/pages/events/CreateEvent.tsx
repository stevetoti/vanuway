import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Calendar, AlertCircle, CheckCircle2, Clock, MapPin, Users, DollarSign, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const CATEGORIES = [
  { value: 'cultural', label: 'Cultural' },
  { value: 'music', label: 'Music & Entertainment' },
  { value: 'sports', label: 'Sports' },
  { value: 'food', label: 'Food & Dining' },
  { value: 'market', label: 'Market' },
  { value: 'festival', label: 'Festival' },
  { value: 'religious', label: 'Religious' },
  { value: 'community', label: 'Community' },
  { value: 'business', label: 'Business & Networking' },
  { value: 'educational', label: 'Educational' },
  { value: 'tourism', label: 'Tourism' },
  { value: 'other', label: 'Other' },
];

const ISLANDS = [
  'Efate', 'Espiritu Santo', 'Malekula', 'Tanna', 'Pentecost',
  'Ambae', 'Ambrym', 'Epi', 'Erromango', 'Aneityum', 'Other'
];

export default function CreateEvent() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    short_description: '',
    category: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    is_all_day: false,
    venue_name: '',
    address: '',
    island: 'Efate',
    is_online: false,
    online_link: '',
    is_free: true,
    price_adult: '',
    price_child: '',
    organizer_name: '',
    organizer_email: '',
    organizer_phone: '',
    max_attendees: '',
    requires_registration: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: 'Please sign in',
        description: 'You need to be logged in to create an event',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.title || !formData.description || !formData.category || !formData.start_date || !formData.venue_name || !formData.organizer_name) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const eventData = {
        title: formData.title,
        description: formData.description,
        short_description: formData.short_description || null,
        category: formData.category,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        is_all_day: formData.is_all_day,
        venue_name: formData.venue_name,
        address: formData.address || null,
        island: formData.island,
        is_online: formData.is_online,
        online_link: formData.is_online ? formData.online_link : null,
        is_free: formData.is_free,
        price_adult: formData.is_free ? null : parseFloat(formData.price_adult) || null,
        price_child: formData.is_free ? null : parseFloat(formData.price_child) || null,
        organizer_id: user.id,
        organizer_name: formData.organizer_name,
        organizer_email: formData.organizer_email || null,
        organizer_phone: formData.organizer_phone || null,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
        requires_registration: formData.requires_registration,
        status: 'pending', // All events start as pending for admin approval
      };

      const { error } = await (supabase as unknown)
        .from('community_events')
        .insert(eventData);

      if (error) throw error;

      setIsSubmitted(true);
    } catch (error: unknown) {
      console.error('Error creating event:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create event',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 text-white px-4 pt-4 pb-8">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 mb-4"
            onClick={() => navigate('/events')}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="text-center">
            <CheckCircle2 className="h-16 w-16 mx-auto mb-3" />
            <h1 className="text-2xl font-bold mb-2">Event Submitted!</h1>
            <p className="text-white/80">Your event is pending approval</p>
          </div>
        </div>

        <div className="px-4 -mt-4">
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <Alert className="bg-amber-50 border-amber-200">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800">Pending Review</AlertTitle>
                  <AlertDescription className="text-amber-700">
                    Your event "{formData.title}" has been submitted and is awaiting admin approval.
                    You will be notified once it's approved and published.
                  </AlertDescription>
                </Alert>

                <div className="pt-4 space-y-3">
                  <h3 className="font-semibold text-lg">What happens next?</h3>
                  <ul className="text-left text-sm text-muted-foreground space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="bg-purple-100 text-purple-700 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">1</span>
                      Our team will review your event details
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-purple-100 text-purple-700 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">2</span>
                      Once approved, your event will be visible to everyone
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-purple-100 text-purple-700 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">3</span>
                      You can track registrations from your profile
                    </li>
                  </ul>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate('/events/my-events')}
                  >
                    View My Events
                  </Button>
                  <Button
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                    onClick={() => navigate('/events')}
                  >
                    Browse Events
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 text-white px-4 pt-4 pb-8">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 mb-4"
            onClick={() => navigate('/events')}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold text-center">Create Event</h1>
        </div>

        <div className="px-4 -mt-4">
          <Card className="shadow-lg p-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-6">Please sign in to create and manage events</p>
            <Button onClick={() => navigate('/auth')} className="bg-purple-600 hover:bg-purple-700">
              Sign In
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 text-white px-4 pt-4 pb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => navigate('/events')}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold">Create Event</h1>
        </div>
        <p className="text-white/80 text-sm">Share your event with the Vanuatu community</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-6">
        {/* Admin Approval Notice */}
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Admin Approval Required</AlertTitle>
          <AlertDescription className="text-blue-700">
            All events are reviewed by our team before being published. This helps ensure quality and safety for our community.
          </AlertDescription>
        </Alert>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Event Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Community Beach Cleanup"
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="short_description">Short Description</Label>
              <Input
                id="short_description"
                value={formData.short_description}
                onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                placeholder="Brief one-liner about your event"
                maxLength={150}
              />
            </div>

            <div>
              <Label htmlFor="description">Full Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your event in detail..."
                rows={4}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Date & Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              Date & Time
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  min={formData.start_date}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_all_day">All Day Event</Label>
              <Switch
                id="is_all_day"
                checked={formData.is_all_day}
                onCheckedChange={(checked) => setFormData({ ...formData, is_all_day: checked })}
              />
            </div>

            {!formData.is_all_day && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-purple-600" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="is_online">Online Event</Label>
              <Switch
                id="is_online"
                checked={formData.is_online}
                onCheckedChange={(checked) => setFormData({ ...formData, is_online: checked })}
              />
            </div>

            {formData.is_online ? (
              <div>
                <Label htmlFor="online_link">Event Link</Label>
                <Input
                  id="online_link"
                  type="url"
                  value={formData.online_link}
                  onChange={(e) => setFormData({ ...formData, online_link: e.target.value })}
                  placeholder="https://zoom.us/..."
                />
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="venue_name">Venue Name *</Label>
                  <Input
                    id="venue_name"
                    value={formData.venue_name}
                    onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
                    placeholder="e.g., Independence Park"
                    required={!formData.is_online}
                  />
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Street address or directions"
                  />
                </div>

                <div>
                  <Label htmlFor="island">Island *</Label>
                  <Select
                    value={formData.island}
                    onValueChange={(value) => setFormData({ ...formData, island: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ISLANDS.map(island => (
                        <SelectItem key={island} value={island}>{island}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="is_free">Free Event</Label>
              <Switch
                id="is_free"
                checked={formData.is_free}
                onCheckedChange={(checked) => setFormData({ ...formData, is_free: checked })}
              />
            </div>

            {!formData.is_free && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price_adult">Adult Price (VUV)</Label>
                  <Input
                    id="price_adult"
                    type="number"
                    value={formData.price_adult}
                    onChange={(e) => setFormData({ ...formData, price_adult: e.target.value })}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="price_child">Child Price (VUV)</Label>
                  <Input
                    id="price_child"
                    type="number"
                    value={formData.price_child}
                    onChange={(e) => setFormData({ ...formData, price_child: e.target.value })}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Registration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Registration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="requires_registration">Require Registration</Label>
                <p className="text-xs text-muted-foreground">Attendees must register to attend</p>
              </div>
              <Switch
                id="requires_registration"
                checked={formData.requires_registration}
                onCheckedChange={(checked) => setFormData({ ...formData, requires_registration: checked })}
              />
            </div>

            <div>
              <Label htmlFor="max_attendees">Maximum Attendees</Label>
              <Input
                id="max_attendees"
                type="number"
                value={formData.max_attendees}
                onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
                placeholder="Leave empty for unlimited"
                min="1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Organizer Info */}
        <Card>
          <CardHeader>
            <CardTitle>Organizer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="organizer_name">Organizer Name *</Label>
              <Input
                id="organizer_name"
                value={formData.organizer_name}
                onChange={(e) => setFormData({ ...formData, organizer_name: e.target.value })}
                placeholder="Your name or organization"
                required
              />
            </div>

            <div>
              <Label htmlFor="organizer_email">Contact Email</Label>
              <Input
                id="organizer_email"
                type="email"
                value={formData.organizer_email}
                onChange={(e) => setFormData({ ...formData, organizer_email: e.target.value })}
                placeholder="contact@example.com"
              />
            </div>

            <div>
              <Label htmlFor="organizer_phone">Contact Phone</Label>
              <Input
                id="organizer_phone"
                type="tel"
                value={formData.organizer_phone}
                onChange={(e) => setFormData({ ...formData, organizer_phone: e.target.value })}
                placeholder="+678..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full h-12 bg-purple-600 hover:bg-purple-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Event for Approval'}
        </Button>
      </form>
    </div>
  );
}
