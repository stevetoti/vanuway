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
import { ArrowLeft, Briefcase, Building2, MapPin, DollarSign, CheckCircle2, Clock, Info, Plus, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { JobCategory, JOB_TYPES, EXPERIENCE_LEVELS, LOCATION_TYPES, SALARY_PERIODS, ISLANDS } from '@/types/jobs';

export default function PostJob() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ['job-categories'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('job_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as JobCategory[];
    },
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    company_name: '',
    company_description: '',
    company_website: '',
    job_type: 'full_time',
    experience_level: 'any',
    location_type: 'onsite',
    island: 'Efate',
    address: '',
    salary_min: '',
    salary_max: '',
    salary_period: 'month',
    show_salary: true,
    requirements: [''],
    responsibilities: [''],
    benefits: [''],
    skills_required: [''],
    education_required: '',
    years_experience: '',
    application_deadline: '',
    application_email: '',
    how_to_apply: '',
  });

  const addArrayItem = (field: 'requirements' | 'responsibilities' | 'benefits' | 'skills_required') => {
    setFormData({ ...formData, [field]: [...formData[field], ''] });
  };

  const removeArrayItem = (field: 'requirements' | 'responsibilities' | 'benefits' | 'skills_required', index: number) => {
    const newArray = formData[field].filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: newArray.length > 0 ? newArray : [''] });
  };

  const updateArrayItem = (field: 'requirements' | 'responsibilities' | 'benefits' | 'skills_required', index: number, value: string) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData({ ...formData, [field]: newArray });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({ title: 'Please sign in', description: 'You need to be logged in to post a job', variant: 'destructive' });
      return;
    }

    if (!formData.title || !formData.description || !formData.company_name) {
      toast({ title: 'Missing information', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      const jobData = {
        employer_id: user.id,
        title: formData.title,
        description: formData.description,
        category_id: formData.category_id || null,
        company_name: formData.company_name,
        company_description: formData.company_description || null,
        company_website: formData.company_website || null,
        job_type: formData.job_type,
        experience_level: formData.experience_level,
        location_type: formData.location_type,
        island: formData.location_type === 'remote' ? null : formData.island,
        address: formData.address || null,
        salary_min: formData.salary_min ? parseFloat(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseFloat(formData.salary_max) : null,
        salary_period: formData.salary_period,
        show_salary: formData.show_salary,
        requirements: formData.requirements.filter(r => r.trim()),
        responsibilities: formData.responsibilities.filter(r => r.trim()),
        benefits: formData.benefits.filter(r => r.trim()),
        skills_required: formData.skills_required.filter(r => r.trim()),
        education_required: formData.education_required || null,
        years_experience: formData.years_experience ? parseInt(formData.years_experience) : null,
        application_deadline: formData.application_deadline || null,
        application_email: formData.application_email || null,
        how_to_apply: formData.how_to_apply || null,
        status: 'pending',
      };

      const { error } = await (supabase as any).from('jobs').insert(jobData);
      if (error) throw error;

      setIsSubmitted(true);
    } catch (error: any) {
      console.error('Error posting job:', error);
      toast({ title: 'Error', description: error.message || 'Failed to post job', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white px-4 pt-4 pb-8">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 mb-4" onClick={() => navigate('/jobs')}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="text-center">
            <CheckCircle2 className="h-16 w-16 mx-auto mb-3" />
            <h1 className="text-2xl font-bold mb-2">Job Posted!</h1>
            <p className="text-white/80">Your job is pending review</p>
          </div>
        </div>
        <div className="px-4 -mt-4">
          <Card className="shadow-lg">
            <CardContent className="p-6 text-center space-y-4">
              <Alert className="bg-amber-50 border-amber-200">
                <Clock className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">Pending Review</AlertTitle>
                <AlertDescription className="text-amber-700">
                  Your job posting is being reviewed by our team. Once approved, it will be visible to job seekers.
                </AlertDescription>
              </Alert>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => navigate('/jobs/my-jobs')}>View My Jobs</Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => navigate('/jobs')}>Browse Jobs</Button>
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
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white px-4 pt-4 pb-8">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 mb-4" onClick={() => navigate('/jobs')}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold text-center">Post a Job</h1>
        </div>
        <div className="px-4 -mt-4">
          <Card className="shadow-lg p-8 text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-6">Please sign in to post job listings</p>
            <Button onClick={() => navigate('/login')} className="bg-blue-600 hover:bg-blue-700">Sign In</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white px-4 pt-4 pb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => navigate('/jobs')}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold">Post a Job</h1>
        </div>
        <p className="text-white/80 text-sm">Find the perfect candidate for your team</p>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-6">
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Admin Approval Required</AlertTitle>
          <AlertDescription className="text-blue-700">
            All job postings are reviewed before being published to ensure quality.
          </AlertDescription>
        </Alert>

        {/* Job Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-blue-600" />Job Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Job Title *</Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Senior Web Developer" required />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories?.map(cat => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Job Type *</Label>
                <Select value={formData.job_type} onValueChange={(value) => setFormData({ ...formData, job_type: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(JOB_TYPES).map(([key, label]) => (<SelectItem key={key} value={key}>{label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Experience Level</Label>
                <Select value={formData.experience_level} onValueChange={(value) => setFormData({ ...formData, experience_level: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(EXPERIENCE_LEVELS).map(([key, label]) => (<SelectItem key={key} value={key}>{label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="description">Job Description *</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe the role, daily activities, and what makes this position great..." rows={5} required />
            </div>
          </CardContent>
        </Card>

        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-blue-600" />Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="company_name">Company Name *</Label>
              <Input id="company_name" value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} placeholder="Your company name" required />
            </div>
            <div>
              <Label htmlFor="company_description">About the Company</Label>
              <Textarea id="company_description" value={formData.company_description} onChange={(e) => setFormData({ ...formData, company_description: e.target.value })} placeholder="Brief description of your company..." rows={3} />
            </div>
            <div>
              <Label htmlFor="company_website">Company Website</Label>
              <Input id="company_website" type="url" value={formData.company_website} onChange={(e) => setFormData({ ...formData, company_website: e.target.value })} placeholder="https://..." />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-blue-600" />Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Work Location</Label>
              <Select value={formData.location_type} onValueChange={(value) => setFormData({ ...formData, location_type: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(LOCATION_TYPES).map(([key, label]) => (<SelectItem key={key} value={key}>{label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            {formData.location_type !== 'remote' && (
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
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Street address or area" />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Salary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-blue-600" />Compensation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Show Salary</Label>
              <Switch checked={formData.show_salary} onCheckedChange={(checked) => setFormData({ ...formData, show_salary: checked })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="salary_min">Minimum (VUV)</Label>
                <Input id="salary_min" type="number" value={formData.salary_min} onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })} placeholder="0" min="0" />
              </div>
              <div>
                <Label htmlFor="salary_max">Maximum (VUV)</Label>
                <Input id="salary_max" type="number" value={formData.salary_max} onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })} placeholder="0" min="0" />
              </div>
            </div>
            <div>
              <Label>Pay Period</Label>
              <Select value={formData.salary_period} onValueChange={(value) => setFormData({ ...formData, salary_period: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SALARY_PERIODS).map(([key, label]) => (<SelectItem key={key} value={key}>{label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Requirements & Responsibilities */}
        <Card>
          <CardHeader><CardTitle>Requirements & Responsibilities</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Requirements</Label>
              {formData.requirements.map((req, idx) => (
                <div key={idx} className="flex gap-2 mt-2">
                  <Input value={req} onChange={(e) => updateArrayItem('requirements', idx, e.target.value)} placeholder="e.g., 2+ years experience" />
                  {formData.requirements.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeArrayItem('requirements', idx)}><X className="h-4 w-4" /></Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => addArrayItem('requirements')}><Plus className="h-4 w-4 mr-1" />Add</Button>
            </div>

            <div>
              <Label>Responsibilities</Label>
              {formData.responsibilities.map((item, idx) => (
                <div key={idx} className="flex gap-2 mt-2">
                  <Input value={item} onChange={(e) => updateArrayItem('responsibilities', idx, e.target.value)} placeholder="e.g., Lead development team" />
                  {formData.responsibilities.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeArrayItem('responsibilities', idx)}><X className="h-4 w-4" /></Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => addArrayItem('responsibilities')}><Plus className="h-4 w-4 mr-1" />Add</Button>
            </div>

            <div>
              <Label>Required Skills</Label>
              {formData.skills_required.map((skill, idx) => (
                <div key={idx} className="flex gap-2 mt-2">
                  <Input value={skill} onChange={(e) => updateArrayItem('skills_required', idx, e.target.value)} placeholder="e.g., JavaScript" />
                  {formData.skills_required.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeArrayItem('skills_required', idx)}><X className="h-4 w-4" /></Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => addArrayItem('skills_required')}><Plus className="h-4 w-4 mr-1" />Add</Button>
            </div>

            <div>
              <Label>Benefits (Optional)</Label>
              {formData.benefits.map((item, idx) => (
                <div key={idx} className="flex gap-2 mt-2">
                  <Input value={item} onChange={(e) => updateArrayItem('benefits', idx, e.target.value)} placeholder="e.g., Health insurance" />
                  {formData.benefits.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeArrayItem('benefits', idx)}><X className="h-4 w-4" /></Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => addArrayItem('benefits')}><Plus className="h-4 w-4 mr-1" />Add</Button>
            </div>
          </CardContent>
        </Card>

        {/* Application Settings */}
        <Card>
          <CardHeader><CardTitle>Application Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="application_deadline">Application Deadline</Label>
              <Input id="application_deadline" type="date" value={formData.application_deadline} onChange={(e) => setFormData({ ...formData, application_deadline: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="application_email">Application Email</Label>
              <Input id="application_email" type="email" value={formData.application_email} onChange={(e) => setFormData({ ...formData, application_email: e.target.value })} placeholder="hr@company.com" />
            </div>
            <div>
              <Label htmlFor="how_to_apply">How to Apply (Instructions)</Label>
              <Textarea id="how_to_apply" value={formData.how_to_apply} onChange={(e) => setFormData({ ...formData, how_to_apply: e.target.value })} placeholder="Special instructions for applicants..." rows={3} />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
          {isSubmitting ? 'Posting...' : 'Post Job for Review'}
        </Button>
      </form>
    </div>
  );
}
