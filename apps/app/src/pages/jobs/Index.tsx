import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  ArrowLeft, Search, Briefcase, MapPin, Clock, DollarSign, Building2,
  Laptop, Users, Plus, Bookmark, Star, Zap, Filter, ChevronRight
} from 'lucide-react';
import { Job, JobCategory, JOB_TYPES, LOCATION_TYPES, SALARY_PERIODS, ISLANDS } from '@/types/jobs';
import { formatDistanceToNow, parseISO } from 'date-fns';

export default function JobsIndex() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedIsland, setSelectedIsland] = useState('all');
  const [activeTab, setActiveTab] = useState('jobs');

  const { data: categories } = useQuery({
    queryKey: ['job-categories'],
    queryFn: async () => {
      const { data, error } = await (supabase as unknown)
        .from('job_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as JobCategory[];
    },
  });

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const { data, error } = await (supabase as unknown)
        .from('jobs')
        .select('*, category:job_categories(*)')
        .eq('status', 'approved')
        .order('is_urgent', { ascending: false })
        .order('is_featured', { ascending: false })
        .order('posted_at', { ascending: false });

      if (error) throw error;
      return data as Job[];
    },
  });

  const { data: savedJobs } = useQuery({
    queryKey: ['saved-jobs', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase as unknown)
        .from('job_saves')
        .select('job_id')
        .eq('user_id', user.id);

      if (error) throw error;
      return data.map((s: unknown) => s.job_id);
    },
    enabled: !!user,
  });

  const filteredJobs = jobs?.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.skills_required || []).some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || job.category_id === selectedCategory;
    const matchesType = selectedType === 'all' || job.job_type === selectedType;
    const matchesIsland = selectedIsland === 'all' || job.island === selectedIsland;

    return matchesSearch && matchesCategory && matchesType && matchesIsland;
  }) || [];

  const featuredJobs = jobs?.filter(j => j.is_featured) || [];
  const urgentJobs = jobs?.filter(j => j.is_urgent) || [];

  const formatSalary = (job: Job) => {
    if (!job.show_salary || (!job.salary_min && !job.salary_max)) return null;
    const format = (n: number) => new Intl.NumberFormat('en-VU').format(n);
    if (job.salary_min && job.salary_max) {
      return `${format(job.salary_min)} - ${format(job.salary_max)} VUV ${SALARY_PERIODS[job.salary_period]}`;
    }
    if (job.salary_min) return `From ${format(job.salary_min)} VUV ${SALARY_PERIODS[job.salary_period]}`;
    return `Up to ${format(job.salary_max!)} VUV ${SALARY_PERIODS[job.salary_period]}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="px-4 pt-4 pb-6">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => navigate('/services')}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold">VanuJobs</h1>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => navigate('/jobs/post')}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>

          <div className="text-center mb-6">
            <Briefcase className="h-12 w-12 mx-auto mb-2" />
            <h2 className="text-2xl font-bold">Find Your Next Opportunity</h2>
            <p className="text-white/80 text-sm">Jobs & Freelance work in Vanuatu</p>
          </div>

          {/* Search */}
          <Card className="bg-white/95 backdrop-blur shadow-xl">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search jobs, skills, companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 border-gray-200"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4 pt-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="jobs" className="gap-1">
            <Briefcase className="h-4 w-4" />
            Jobs
          </TabsTrigger>
          <TabsTrigger value="freelancers" className="gap-1">
            <Users className="h-4 w-4" />
            Freelancers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-4 mt-4">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100"
              onClick={() => navigate('/jobs/my-applications')}
            >
              <CardContent className="p-4">
                <Briefcase className="h-8 w-8 text-blue-600 mb-2" />
                <h3 className="font-semibold text-sm">My Applications</h3>
                <p className="text-xs text-muted-foreground">Track your job applications</p>
              </CardContent>
            </Card>
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-green-50 to-emerald-50 border-green-100"
              onClick={() => navigate('/jobs/post')}
            >
              <CardContent className="p-4">
                <Plus className="h-8 w-8 text-green-600 mb-2" />
                <h3 className="font-semibold text-sm">Post a Job</h3>
                <p className="text-xs text-muted-foreground">Hire talented people</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-36 flex-shrink-0">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-32 flex-shrink-0">
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(JOB_TYPES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedIsland} onValueChange={setSelectedIsland}>
              <SelectTrigger className="w-32 flex-shrink-0">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Islands</SelectItem>
                {ISLANDS.map(island => (
                  <SelectItem key={island} value={island}>{island}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Urgent Jobs */}
          {urgentJobs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-5 w-5 text-amber-500" />
                <h3 className="font-semibold">Urgent Hiring</h3>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {urgentJobs.slice(0, 5).map(job => (
                  <Card
                    key={job.id}
                    className="flex-shrink-0 w-72 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow border-amber-200 bg-amber-50/50"
                    onClick={() => navigate(`/jobs/${job.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge className="bg-amber-500 text-white">
                          <Zap className="h-3 w-3 mr-1" />
                          Urgent
                        </Badge>
                        <Badge variant="outline" className="text-xs">{JOB_TYPES[job.job_type]}</Badge>
                      </div>
                      <h4 className="font-semibold line-clamp-1">{job.title}</h4>
                      <p className="text-sm text-muted-foreground">{job.company_name}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{job.island || 'Remote'}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Jobs List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{filteredJobs.length} Jobs Found</h3>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
                      <div className="h-4 bg-gray-200 rounded w-1/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredJobs.length === 0 ? (
              <Card className="p-8 text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h4 className="font-medium text-lg mb-1">No jobs found</h4>
                <p className="text-muted-foreground text-sm">Try adjusting your filters or search terms</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredJobs.map(job => {
                  const isSaved = savedJobs?.includes(job.id);
                  const salary = formatSalary(job);
                  return (
                    <Card
                      key={job.id}
                      className={`overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5 ${job.is_featured ? 'border-blue-200 bg-blue-50/30' : ''}`}
                      onClick={() => navigate(`/jobs/${job.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {/* Company Logo */}
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                              {job.company_logo ? (
                                <img src={job.company_logo} alt={job.company_name} className="w-10 h-10 rounded" />
                              ) : (
                                <Building2 className="h-6 w-6 text-blue-600" />
                              )}
                            </div>
                          </div>

                          {/* Job Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  {job.is_featured && (
                                    <Badge className="bg-blue-600 text-xs">
                                      <Star className="h-3 w-3 mr-1" />
                                      Featured
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="text-xs">{JOB_TYPES[job.job_type]}</Badge>
                                  <Badge variant="outline" className="text-xs">{LOCATION_TYPES[job.location_type]}</Badge>
                                </div>
                                <h4 className="font-semibold line-clamp-1">{job.title}</h4>
                                <p className="text-sm text-muted-foreground">{job.company_name}</p>
                              </div>
                              {isSaved && (
                                <Bookmark className="h-5 w-5 text-blue-600 fill-blue-600 flex-shrink-0" />
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                              {job.island && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" />
                                  <span>{job.island}</span>
                                </div>
                              )}
                              {salary && (
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-3.5 w-3.5" />
                                  <span>{salary}</span>
                                </div>
                              )}
                            </div>

                            {job.skills_required && job.skills_required.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {job.skills_required.slice(0, 3).map((skill, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">{skill}</Badge>
                                ))}
                                {job.skills_required.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">+{job.skills_required.length - 3}</Badge>
                                )}
                              </div>
                            )}

                            <div className="flex items-center justify-between mt-3 pt-2 border-t text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {job.posted_at ? formatDistanceToNow(parseISO(job.posted_at), { addSuffix: true }) : 'Recently'}
                              </span>
                              <span>{job.applications_count} applicants</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="freelancers" className="space-y-4 mt-4">
          {/* Quick Actions for Freelancers */}
          <div className="grid grid-cols-2 gap-3">
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100"
              onClick={() => navigate('/jobs/freelancers')}
            >
              <CardContent className="p-4">
                <Users className="h-8 w-8 text-purple-600 mb-2" />
                <h3 className="font-semibold text-sm">Browse Freelancers</h3>
                <p className="text-xs text-muted-foreground">Find skilled professionals</p>
              </CardContent>
            </Card>
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100"
              onClick={() => navigate('/jobs/become-freelancer')}
            >
              <CardContent className="p-4">
                <Laptop className="h-8 w-8 text-orange-600 mb-2" />
                <h3 className="font-semibold text-sm">Become a Freelancer</h3>
                <p className="text-xs text-muted-foreground">Offer your skills</p>
              </CardContent>
            </Card>
          </div>

          {/* Freelancer Categories */}
          <div>
            <h3 className="font-semibold mb-3">Popular Categories</h3>
            <div className="grid grid-cols-2 gap-3">
              {categories?.slice(0, 8).map(cat => (
                <Card
                  key={cat.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/jobs/freelancers?category=${cat.id}`)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <span className="font-medium text-sm">{cat.name}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* CTA */}
          <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">Have Skills to Offer?</h4>
                <p className="text-white/80 text-sm">Create your freelancer profile today</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="bg-white text-purple-600 hover:bg-gray-100"
                onClick={() => navigate('/jobs/become-freelancer')}
              >
                Get Started
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
