import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  ArrowLeft, Briefcase, Building2, Clock, MapPin, CheckCircle2, XCircle,
  AlertCircle, Eye, MessageSquare, Calendar
} from 'lucide-react';
import { JobApplication, APPLICATION_STATUSES, JOB_TYPES } from '@/types/jobs';
import { format, parseISO, formatDistanceToNow } from 'date-fns';

export default function MyApplications() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: applications, isLoading } = useQuery({
    queryKey: ['my-applications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from('job_applications')
        .select('*, job:jobs(*, category:job_categories(*))')
        .eq('applicant_id', user.id)
        .order('applied_at', { ascending: false });

      if (error) throw error;
      return data as (JobApplication & { job: any })[];
    },
    enabled: !!user,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'reviewed': return <Eye className="h-4 w-4" />;
      case 'shortlisted': return <CheckCircle2 className="h-4 w-4" />;
      case 'interview': return <MessageSquare className="h-4 w-4" />;
      case 'offered': return <CheckCircle2 className="h-4 w-4" />;
      case 'hired': return <CheckCircle2 className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'reviewed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shortlisted': return 'bg-green-100 text-green-800 border-green-200';
      case 'interview': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'offered': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'hired': return 'bg-green-600 text-white';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const pendingApplications = applications?.filter(a => a.status === 'pending') || [];
  const activeApplications = applications?.filter(a => ['reviewed', 'shortlisted', 'interview', 'offered'].includes(a.status)) || [];
  const closedApplications = applications?.filter(a => ['hired', 'rejected', 'withdrawn'].includes(a.status)) || [];

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white px-4 pt-4 pb-8">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 mb-4" onClick={() => navigate('/jobs')}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold text-center">My Applications</h1>
        </div>
        <div className="px-4 -mt-4">
          <Card className="shadow-lg p-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-6">Please sign in to view your job applications</p>
            <Button onClick={() => navigate('/login')} className="bg-blue-600 hover:bg-blue-700">Sign In</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white px-4 pt-4 pb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => navigate('/jobs')}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold">My Applications</h1>
        </div>
        <p className="text-white/80 text-sm">Track your job applications</p>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
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
        ) : applications?.length === 0 ? (
          <Card className="p-8 text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h4 className="font-medium text-lg mb-1">No applications yet</h4>
            <p className="text-muted-foreground text-sm mb-4">Start applying to jobs to see them here</p>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => navigate('/jobs')}>Browse Jobs</Button>
          </Card>
        ) : (
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({applications?.length || 0})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({pendingApplications.length})</TabsTrigger>
              <TabsTrigger value="active">Active ({activeApplications.length})</TabsTrigger>
              <TabsTrigger value="closed">Closed ({closedApplications.length})</TabsTrigger>
            </TabsList>

            {['all', 'pending', 'active', 'closed'].map(tab => (
              <TabsContent key={tab} value={tab} className="space-y-4">
                {(tab === 'all' ? applications : tab === 'pending' ? pendingApplications : tab === 'active' ? activeApplications : closedApplications)?.map(app => (
                  <Card
                    key={app.id}
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-all"
                    onClick={() => navigate(`/jobs/${app.job_id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                            {app.job?.company_logo ? (
                              <img src={app.job.company_logo} alt={app.job.company_name} className="w-10 h-10 rounded" />
                            ) : (
                              <Building2 className="h-6 w-6 text-blue-600" />
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div>
                              <h4 className="font-semibold line-clamp-1">{app.job?.title || 'Job'}</h4>
                              <p className="text-sm text-muted-foreground">{app.job?.company_name}</p>
                            </div>
                            <Badge className={getStatusColor(app.status)}>
                              {getStatusIcon(app.status)}
                              <span className="ml-1">{APPLICATION_STATUSES[app.status as keyof typeof APPLICATION_STATUSES]}</span>
                            </Badge>
                          </div>

                          <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                            {app.job?.island && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                <span>{app.job.island}</span>
                              </div>
                            )}
                            {app.job?.job_type && (
                              <Badge variant="outline" className="text-xs">{JOB_TYPES[app.job.job_type as keyof typeof JOB_TYPES]}</Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-1 mt-3 pt-2 border-t text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>Applied {formatDistanceToNow(parseISO(app.applied_at), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(tab === 'pending' && pendingApplications.length === 0) ||
                 (tab === 'active' && activeApplications.length === 0) ||
                 (tab === 'closed' && closedApplications.length === 0) ? (
                  <Card className="p-6 text-center">
                    <p className="text-muted-foreground">No applications in this category</p>
                  </Card>
                ) : null}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
}
