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
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Users, User, Briefcase, MapPin, DollarSign, CheckCircle2, Clock, Info, Plus, X, Globe, Phone, Mail } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { JobCategory, AVAILABILITY_OPTIONS, ISLANDS } from '@/types/jobs';

const SKILL_SUGGESTIONS = [
  'Web Development', 'Mobile App Development', 'Graphic Design', 'Video Editing',
  'Photography', 'Content Writing', 'Translation', 'Digital Marketing',
  'Social Media Management', 'Data Entry', 'Virtual Assistant', 'Accounting',
  'Tutoring', 'Music Production', 'Animation', 'UI/UX Design'
];

export default function BecomeFreelancer() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { data: existingProfile } = useQuery({
    queryKey: ['my-freelancer-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await (supabase as unknown)
        .from('freelancer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const [formData, setFormData] = useState({
    display_name: '',
    tagline: '',
    bio: '',
    primary_skill: '',
    skills: [''],
    experience_years: '',
    education: '',
    certifications: [''],
    hourly_rate: '',
    min_project_rate: '',
    availability: 'full_time',
    available_hours_per_week: '',
    island: 'Efate',
    location: '',
    is_remote_only: false,
    willing_to_travel: false,
    portfolio_url: '',
    github_url: '',
    linkedin_url: '',
    website_url: '',
    contact_email: '',
    contact_phone: '',
    preferred_contact: 'email',
  });

  const addArrayItem = (field: 'skills' | 'certifications') => {
    setFormData({ ...formData, [field]: [...formData[field], ''] });
  };

  const removeArrayItem = (field: 'skills' | 'certifications', index: number) => {
    const newArray = formData[field].filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: newArray.length > 0 ? newArray : [''] });
  };

  const updateArrayItem = (field: 'skills' | 'certifications', index: number, value: string) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData({ ...formData, [field]: newArray });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({ title: 'Please sign in', description: 'You need to be logged in to create a profile', variant: 'destructive' });
      return;
    }

    if (!formData.display_name || !formData.primary_skill || formData.skills.filter(s => s.trim()).length === 0) {
      toast({ title: 'Missing information', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      const profileData = {
        user_id: user.id,
        display_name: formData.display_name,
        tagline: formData.tagline || null,
        bio: formData.bio || null,
        primary_skill: formData.primary_skill,
        skills: formData.skills.filter(s => s.trim()),
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
        education: formData.education || null,
        certifications: formData.certifications.filter(c => c.trim()).length > 0 ? formData.certifications.filter(c => c.trim()) : null,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        min_project_rate: formData.min_project_rate ? parseFloat(formData.min_project_rate) : null,
        availability: formData.availability,
        available_hours_per_week: formData.available_hours_per_week ? parseInt(formData.available_hours_per_week) : null,
        island: formData.is_remote_only ? null : formData.island,
        location: formData.location || null,
        is_remote_only: formData.is_remote_only,
        willing_to_travel: formData.willing_to_travel,
        portfolio_url: formData.portfolio_url || null,
        github_url: formData.github_url || null,
        linkedin_url: formData.linkedin_url || null,
        website_url: formData.website_url || null,
        contact_email: formData.contact_email || null,
        contact_phone: formData.contact_phone || null,
        preferred_contact: formData.preferred_contact,
        status: 'pending',
      };

      const { error } = await (supabase as unknown).from('freelancer_profiles').insert(profileData);
      if (error) throw error;

      setIsSubmitted(true);
    } catch (error: unknown) {
      console.error('Error creating profile:', error);
      toast({ title: 'Error', description: error.message || 'Failed to create profile', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (existingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600 text-white px-4 pt-4 pb-8">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 mb-4" onClick={() => navigate('/jobs')}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold text-center">Freelancer Profile</h1>
        </div>
        <div className="px-4 -mt-4">
          <Card className="shadow-lg p-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">You Already Have a Profile!</h2>
            <p className="text-muted-foreground mb-2">
              Status: <Badge className={existingProfile.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                {existingProfile.status === 'approved' ? 'Approved' : 'Pending Review'}
              </Badge>
            </p>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => navigate('/jobs/freelancers')}>Browse Freelancers</Button>
              <Button className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={() => navigate(`/jobs/freelancer/${existingProfile.id}`)}>View My Profile</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600 text-white px-4 pt-4 pb-8">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 mb-4" onClick={() => navigate('/jobs')}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="text-center">
            <CheckCircle2 className="h-16 w-16 mx-auto mb-3" />
            <h1 className="text-2xl font-bold mb-2">Profile Submitted!</h1>
            <p className="text-white/80">Your profile is pending review</p>
          </div>
        </div>
        <div className="px-4 -mt-4">
          <Card className="shadow-lg">
            <CardContent className="p-6 text-center space-y-4">
              <Alert className="bg-amber-50 border-amber-200">
                <Clock className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">Pending Review</AlertTitle>
                <AlertDescription className="text-amber-700">
                  Our team will review your profile. Once approved, you'll be visible to potential clients.
                </AlertDescription>
              </Alert>
              <div className="pt-4 space-y-3">
                <h3 className="font-semibold text-lg">What's Next?</h3>
                <ul className="text-left text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="bg-purple-100 text-purple-700 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">1</span>
                    Profile review (usually 24-48 hours)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-purple-100 text-purple-700 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">2</span>
                    Add services you offer to attract clients
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-purple-100 text-purple-700 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">3</span>
                    Start receiving project requests
                  </li>
                </ul>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => navigate('/jobs/freelancers')}>Browse Freelancers</Button>
                <Button className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={() => navigate('/jobs')}>Back to Jobs</Button>
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
        <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600 text-white px-4 pt-4 pb-8">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 mb-4" onClick={() => navigate('/jobs')}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold text-center">Become a Freelancer</h1>
        </div>
        <div className="px-4 -mt-4">
          <Card className="shadow-lg p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-6">Please sign in to create your freelancer profile</p>
            <Button onClick={() => navigate('/login')} className="bg-purple-600 hover:bg-purple-700">Sign In</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600 text-white px-4 pt-4 pb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => navigate('/jobs')}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold">Become a Freelancer</h1>
        </div>
        <p className="text-white/80 text-sm">Create your profile and start earning</p>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-6">
        <Alert className="bg-purple-50 border-purple-200">
          <Info className="h-4 w-4 text-purple-600" />
          <AlertTitle className="text-purple-800">Profile Review</AlertTitle>
          <AlertDescription className="text-purple-700">
            Your profile will be reviewed before being published. Make sure to fill in accurate information.
          </AlertDescription>
        </Alert>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-purple-600" />Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="display_name">Display Name *</Label>
              <Input id="display_name" value={formData.display_name} onChange={(e) => setFormData({ ...formData, display_name: e.target.value })} placeholder="Your professional name" required />
            </div>
            <div>
              <Label htmlFor="tagline">Tagline</Label>
              <Input id="tagline" value={formData.tagline} onChange={(e) => setFormData({ ...formData, tagline: e.target.value })} placeholder="e.g., Expert Web Developer with 5+ years experience" maxLength={100} />
            </div>
            <div>
              <Label htmlFor="bio">About You</Label>
              <Textarea id="bio" value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} placeholder="Tell potential clients about yourself, your experience, and what makes you unique..." rows={4} />
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-purple-600" />Skills & Expertise</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="primary_skill">Primary Skill *</Label>
              <Input id="primary_skill" value={formData.primary_skill} onChange={(e) => setFormData({ ...formData, primary_skill: e.target.value })} placeholder="Your main expertise" required />
              <div className="flex flex-wrap gap-1 mt-2">
                {SKILL_SUGGESTIONS.slice(0, 6).map(skill => (
                  <Badge key={skill} variant="outline" className="cursor-pointer hover:bg-purple-100" onClick={() => setFormData({ ...formData, primary_skill: skill })}>
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label>Additional Skills *</Label>
              {formData.skills.map((skill, idx) => (
                <div key={idx} className="flex gap-2 mt-2">
                  <Input value={skill} onChange={(e) => updateArrayItem('skills', idx, e.target.value)} placeholder="e.g., React, Node.js, Photoshop" />
                  {formData.skills.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeArrayItem('skills', idx)}><X className="h-4 w-4" /></Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => addArrayItem('skills')}><Plus className="h-4 w-4 mr-1" />Add Skill</Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="experience_years">Years of Experience</Label>
                <Input id="experience_years" type="number" value={formData.experience_years} onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })} placeholder="0" min="0" />
              </div>
              <div>
                <Label htmlFor="education">Education</Label>
                <Input id="education" value={formData.education} onChange={(e) => setFormData({ ...formData, education: e.target.value })} placeholder="Degree, school" />
              </div>
            </div>
            <div>
              <Label>Certifications (Optional)</Label>
              {formData.certifications.map((cert, idx) => (
                <div key={idx} className="flex gap-2 mt-2">
                  <Input value={cert} onChange={(e) => updateArrayItem('certifications', idx, e.target.value)} placeholder="e.g., AWS Certified" />
                  {formData.certifications.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeArrayItem('certifications', idx)}><X className="h-4 w-4" /></Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => addArrayItem('certifications')}><Plus className="h-4 w-4 mr-1" />Add</Button>
            </div>
          </CardContent>
        </Card>

        {/* Location & Availability */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-purple-600" />Location & Availability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Remote Only</Label>
              <Switch checked={formData.is_remote_only} onCheckedChange={(checked) => setFormData({ ...formData, is_remote_only: checked })} />
            </div>
            {!formData.is_remote_only && (
              <>
                <div>
                  <Label>Island</Label>
                  <Select value={formData.island} onValueChange={(value) => setFormData({ ...formData, island: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ISLANDS.map(island => (<SelectItem key={island} value={island}>{island}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Willing to Travel</Label>
                  <Switch checked={formData.willing_to_travel} onCheckedChange={(checked) => setFormData({ ...formData, willing_to_travel: checked })} />
                </div>
              </>
            )}
            <div>
              <Label>Availability</Label>
              <Select value={formData.availability} onValueChange={(value) => setFormData({ ...formData, availability: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(AVAILABILITY_OPTIONS).map(([key, label]) => (<SelectItem key={key} value={key}>{label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Rates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-purple-600" />Your Rates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hourly_rate">Hourly Rate (VUV)</Label>
                <Input id="hourly_rate" type="number" value={formData.hourly_rate} onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })} placeholder="0" min="0" />
              </div>
              <div>
                <Label htmlFor="min_project_rate">Min Project Rate (VUV)</Label>
                <Input id="min_project_rate" type="number" value={formData.min_project_rate} onChange={(e) => setFormData({ ...formData, min_project_rate: e.target.value })} placeholder="0" min="0" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-purple-600" />Online Presence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="portfolio_url">Portfolio URL</Label>
              <Input id="portfolio_url" type="url" value={formData.portfolio_url} onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <Label htmlFor="website_url">Personal Website</Label>
              <Input id="website_url" type="url" value={formData.website_url} onChange={(e) => setFormData({ ...formData, website_url: e.target.value })} placeholder="https://..." />
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-purple-600" />Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input id="contact_email" type="email" value={formData.contact_email} onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })} placeholder="your@email.com" />
            </div>
            <div>
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input id="contact_phone" type="tel" value={formData.contact_phone} onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })} placeholder="+678..." />
            </div>
            <div>
              <Label>Preferred Contact Method</Label>
              <Select value={formData.preferred_contact} onValueChange={(value) => setFormData({ ...formData, preferred_contact: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="platform">In-App Message</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full h-12 bg-purple-600 hover:bg-purple-700" disabled={isSubmitting}>
          {isSubmitting ? 'Creating Profile...' : 'Create My Freelancer Profile'}
        </Button>
      </form>
    </div>
  );
}

function Badge({ children, className, variant = 'default', onClick }: { children: React.ReactNode; className?: string; variant?: 'default' | 'outline' | 'secondary'; onClick?: () => void }) {
  const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';
  const variantStyles = {
    default: 'bg-primary text-primary-foreground',
    outline: 'border border-input bg-background',
    secondary: 'bg-secondary text-secondary-foreground',
  };
  return <span className={`${baseStyles} ${variantStyles[variant]} ${className}`} onClick={onClick}>{children}</span>;
}
