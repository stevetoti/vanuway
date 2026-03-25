import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, Bookmark, BookmarkCheck, Share2, Building2, MapPin, Clock,
  DollarSign, Briefcase, GraduationCap, Calendar, ExternalLink, Mail,
  Phone, Globe, Users, CheckCircle2, AlertCircle, Send
} from 'lucide-react';
import { Job, JOB_TYPES, LOCATION_TYPES, EXPERIENCE_LEVELS, SALARY_PERIODS } from '@/types/jobs';
import { format, parseISO, formatDistanceToNow } from 'date-fns';

export default function JobDetails() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [applicationData, setApplicationData] = useState({
    full_name: '',
    email: '',
    phone: '',
    cover_letter: '',
    portfolio_url: '',
    years_of_experience: '',
    expected_salary: '',
    why_interested: '',
  });

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('jobs')
        .select('*, category:job_categories(*)')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      return data as Job;
    },
  });

  const { data: isSaved } = useQuery({
    queryKey: ['job-saved', jobId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await (supabase as any)
        .from('job_saves')
        .select('id')
        .eq('job_id', jobId)
        .eq('user_id', user.id)
        .single();

      return !!data;
    },
    enabled: !!user,
  });

  const { data: existingApplication } = useQuery({
    queryKey: ['job-application', jobId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await (supabase as any)
        .from('job_applications')
        .select('*')
        .eq('job_id', jobId)
        .eq('applicant_id', user.id)
        .single();

      return data;
    },
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Please sign in');
      if (isSaved) {
        const { error } = await (supabase as any)
          .from('job_saves')
          .delete()
          .eq('job_id', jobId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('job_saves')
          .insert({ job_id: jobId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-saved', jobId] });
      queryClient.invalidateQueries({ queryKey: ['saved-jobs'] });
      toast({
        title: isSaved ? 'Job unsaved' : 'Job saved',
        description: isSaved ? 'Removed from your saved jobs' : 'Added to your saved jobs',
      });
    },
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Please sign in');
      if (!applicationData.full_name || !applicationData.email) {
        throw new Error('Please fill in required fields');
      }

      const { error } = await (supabase as any)
        .from('job_applications')
        .insert({
          job_id: jobId,
          applicant_id: user.id,
          full_name: applicationData.full_name,
          email: applicationData.email,
          phone: applicationData.phone || null,
          cover_letter: applicationData.cover_letter || null,
          portfolio_url: applicationData.portfolio_url || null,
          years_of_experience: applicationData.years_of_experience ? parseInt(applicationData.years_of_experience) : null,
          expected_salary: applicationData.expected_salary ? parseFloat(applicationData.expected_salary) : null,
          why_interested: applicationData.why_interested || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-application', jobId] });
      setShowApplyDialog(false);
      toast({
        title: 'Application submitted!',
        description: 'Your application has been sent to the employer',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit application',
        variant: 'destructive',
      });
    },
  });

  const formatSalary = (job: Job) => {
    if (!job.show_salary || (!job.salary_min && !job.salary_max)) return null;
    const format = (n: number) => new Intl.NumberFormat('en-VU').format(n);
    if (job.salary_min && job.salary_max) {
      return `${format(job.salary_min)} - ${format(job.salary_max)} VUV ${SALARY_PERIODS[job.salary_period]}`;
    }
    if (job.salary_min) return `From ${format(job.salary_min)} VUV ${SALARY_PERIODS[job.salary_period]}`;
    return `Up to ${format(job.salary_max!)} VUV ${SALARY_PERIODS[job.salary_period]}`;
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: job?.title,
        text: `${job?.title} at ${job?.company_name}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link copied to clipboard' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-blue-600 text-white px-4 pt-4 pb-6">
          <Button variant="ghost" size="icon" className="text-white" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </div>
        <div className="px-4 py-6 space-y-4 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Job Not Found</h2>
          <p className="text-muted-foreground mb-4">This job posting may have been removed or expired</p>
          <Button onClick={() => navigate('/jobs')}>Browse Jobs</Button>
        </Card>
      </div>
    );
  }

  const salary = formatSalary(job);

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => saveMutation.mutate()}
            >
              {isSaved ? (
                <BookmarkCheck className="h-5 w-5 fill-white" />
              ) : (
                <Bookmark className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={handleShare}
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Company & Job Title */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            {job.company_logo ? (
              <img src={job.company_logo} alt={job.company_name} className="w-14 h-14 rounded-lg" />
            ) : (
              <Building2 className="h-8 w-8 text-white" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold">{job.title}</h1>
            <p className="text-white/80">{job.company_name}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge className="bg-white/20 text-white">{JOB_TYPES[job.job_type]}</Badge>
              <Badge className="bg-white/20 text-white">{LOCATION_TYPES[job.location_type]}</Badge>
              {job.is_urgent && <Badge className="bg-amber-500 text-white">Urgent</Badge>}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-4">
        {/* Quick Info */}
        <Card>
          <CardContent className="p-4 grid grid-cols-2 gap-4">
            {job.island && (
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="font-medium text-sm">{job.island}</p>
                </div>
              </div>
            )}
            {salary && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Salary</p>
                  <p className="font-medium text-sm">{salary}</p>
                </div>
              </div>
            )}
            {job.experience_level && (
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Experience</p>
                  <p className="font-medium text-sm">{EXPERIENCE_LEVELS[job.experience_level]}</p>
                </div>
              </div>
            )}
            {job.application_deadline && (
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Deadline</p>
                  <p className="font-medium text-sm">{format(parseISO(job.application_deadline), 'MMM d, yyyy')}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Job Description */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">About the Role</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground whitespace-pre-line">{job.description}</p>
          </CardContent>
        </Card>

        {/* Responsibilities */}
        {job.responsibilities && job.responsibilities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Responsibilities</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {job.responsibilities.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Requirements */}
        {job.requirements && job.requirements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Requirements</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {job.requirements.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Skills */}
        {job.skills_required && job.skills_required.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Required Skills</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2">
                {job.skills_required.map((skill, idx) => (
                  <Badge key={idx} variant="secondary">{skill}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Benefits */}
        {job.benefits && job.benefits.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Benefits</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {job.benefits.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Company Info */}
        {job.company_description && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About {job.company_name}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">{job.company_description}</p>
              {job.company_website && (
                <a
                  href={job.company_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 mt-2 hover:underline"
                >
                  <Globe className="h-4 w-4" />
                  Visit Website
                </a>
              )}
            </CardContent>
          </Card>
        )}

        {/* How to Apply */}
        {job.how_to_apply && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How to Apply</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">{job.how_to_apply}</p>
              {job.application_email && (
                <a
                  href={`mailto:${job.application_email}`}
                  className="inline-flex items-center gap-1 text-sm text-blue-600 mt-2 hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  {job.application_email}
                </a>
              )}
              {job.application_link && (
                <a
                  href={job.application_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 mt-2 ml-4 hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Apply Online
                </a>
              )}
            </CardContent>
          </Card>
        )}

        {/* Posted Info */}
        <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Posted {job.posted_at ? formatDistanceToNow(parseISO(job.posted_at), { addSuffix: true }) : 'recently'}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {job.applications_count} applicants
          </span>
        </div>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
        {existingApplication ? (
          <div className="text-center">
            <Badge className="bg-green-100 text-green-800 mb-2">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Application Submitted
            </Badge>
            <p className="text-sm text-muted-foreground">
              You applied on {format(parseISO(existingApplication.applied_at), 'MMM d, yyyy')}
            </p>
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => navigate('/jobs/my-applications')}
            >
              View My Applications
            </Button>
          </div>
        ) : (
          <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
            <DialogTrigger asChild>
              <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700">
                <Send className="h-4 w-4 mr-2" />
                Apply Now
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Apply for {job.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {!user && (
                  <Card className="bg-amber-50 border-amber-200 p-4">
                    <p className="text-sm text-amber-800">
                      Please sign in to apply for this job
                    </p>
                    <Button
                      className="mt-2"
                      onClick={() => navigate('/login')}
                    >
                      Sign In
                    </Button>
                  </Card>
                )}

                {user && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="full_name">Full Name *</Label>
                        <Input
                          id="full_name"
                          value={applicationData.full_name}
                          onChange={(e) => setApplicationData({ ...applicationData, full_name: e.target.value })}
                          placeholder="Your full name"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={applicationData.email}
                          onChange={(e) => setApplicationData({ ...applicationData, email: e.target.value })}
                          placeholder="your@email.com"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={applicationData.phone}
                        onChange={(e) => setApplicationData({ ...applicationData, phone: e.target.value })}
                        placeholder="+678..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="years_of_experience">Years of Experience</Label>
                        <Input
                          id="years_of_experience"
                          type="number"
                          value={applicationData.years_of_experience}
                          onChange={(e) => setApplicationData({ ...applicationData, years_of_experience: e.target.value })}
                          placeholder="0"
                          min="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="expected_salary">Expected Salary (VUV)</Label>
                        <Input
                          id="expected_salary"
                          type="number"
                          value={applicationData.expected_salary}
                          onChange={(e) => setApplicationData({ ...applicationData, expected_salary: e.target.value })}
                          placeholder="0"
                          min="0"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="portfolio_url">Portfolio / LinkedIn URL</Label>
                      <Input
                        id="portfolio_url"
                        type="url"
                        value={applicationData.portfolio_url}
                        onChange={(e) => setApplicationData({ ...applicationData, portfolio_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="why_interested">Why are you interested in this role?</Label>
                      <Textarea
                        id="why_interested"
                        value={applicationData.why_interested}
                        onChange={(e) => setApplicationData({ ...applicationData, why_interested: e.target.value })}
                        placeholder="Tell us why you're a good fit..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="cover_letter">Cover Letter</Label>
                      <Textarea
                        id="cover_letter"
                        value={applicationData.cover_letter}
                        onChange={(e) => setApplicationData({ ...applicationData, cover_letter: e.target.value })}
                        placeholder="Introduce yourself and highlight your relevant experience..."
                        rows={5}
                      />
                    </div>

                    <Button
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                      onClick={() => applyMutation.mutate()}
                      disabled={applyMutation.isPending}
                    >
                      {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
                    </Button>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
