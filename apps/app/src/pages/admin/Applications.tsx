import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DriverApplication } from '@/types/admin';
import { Search, Eye, Clock, CheckCircle, XCircle, Filter } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const AdminApplications = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<DriverApplication[]>([]);
  const [filteredApps, setFilteredApps] = useState<DriverApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [searchTerm, statusFilter, applications]);

  const loadApplications = async () => {
    try {
      // First get all applications
      const { data: appsData, error: appsError } = await supabase
        .from('driver_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (appsError) throw appsError;

      if (!appsData || appsData.length === 0) {
        setApplications([]);
        return;
      }

      // Get unique driver IDs
      const driverIds = [...new Set(appsData.map(app => app.driver_id).filter(Boolean))];

      // Fetch drivers separately
      const { data: driversData, error: driversError } = await supabase
        .from('drivers')
        .select('id, first_name, last_name, email, phone_number, application_status, verification_status, profile_photo_url')
        .in('id', driverIds);

      if (driversError) {
        console.error('Error loading drivers:', driversError);
      }

      // Create a map of drivers by ID
      const driversMap = new Map(
        (driversData || []).map(driver => [driver.id, driver])
      );

      // Combine applications with drivers
      const applicationsWithDrivers = appsData.map(app => ({
        ...app,
        driver: driversMap.get(app.driver_id) || null,
      }));

      setApplications(applicationsWithDrivers as any);
    } catch (error: any) {
      console.error('Error loading applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = applications;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.driver?.first_name?.toLowerCase().includes(term) ||
          app.driver?.last_name?.toLowerCase().includes(term) ||
          app.driver?.email?.toLowerCase().includes(term)
      );
    }

    setFilteredApps(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { className: string; label: string; icon: typeof Clock }> = {
      in_progress: { className: 'bg-gray-100 text-gray-700 border-gray-200', label: 'In Progress', icon: Clock },
      submitted: { className: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Submitted', icon: Clock },
      under_review: { className: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Under Review', icon: Eye },
      approved: { className: 'bg-green-100 text-green-700 border-green-200', label: 'Approved', icon: CheckCircle },
      rejected: { className: 'bg-red-100 text-red-700 border-red-200', label: 'Rejected', icon: XCircle },
      withdrawn: { className: 'bg-gray-100 text-gray-500 border-gray-200', label: 'Withdrawn', icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig.in_progress;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={`flex items-center gap-1 w-fit ${config.className}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Driver Applications</h1>
            <p className="text-muted-foreground">
              Review and manage driver onboarding applications
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/admin/dashboard')}>
            Back to Dashboard
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-64">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Applications List */}
        <div className="space-y-4">
          {loading ? (
            <Card className="p-12">
              <p className="text-center text-muted-foreground">
                Loading applications...
              </p>
            </Card>
          ) : filteredApps.length === 0 ? (
            <Card className="p-12">
              <p className="text-center text-muted-foreground">
                No applications found
              </p>
            </Card>
          ) : (
            filteredApps.map((app) => (
              <Card key={app.id} className="p-5 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/admin/applications/${app.driver_id}`)}>
                <div className="flex items-center gap-4">
                  {/* Profile Photo */}
                  <div className="flex-shrink-0">
                    {app.driver?.profile_photo_url ? (
                      <img
                        src={app.driver.profile_photo_url}
                        alt=""
                        className="h-14 w-14 rounded-full object-cover border-2 border-gray-100"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-white text-lg font-bold">
                        {(app.driver?.first_name?.[0] || '?')}{(app.driver?.last_name?.[0] || '')}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold truncate">
                        {app.driver?.first_name} {app.driver?.last_name}
                      </h3>
                      {getStatusBadge(app.status)}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {app.driver?.email} · {app.driver?.phone_number}
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                      <span>Submitted: <strong>{app.submitted_at ? formatDate(app.submitted_at) : 'Pending'}</strong></span>
                      <span>Steps: <strong>{app.current_step}/{app.total_steps}</strong></span>
                    </div>
                  </div>

                  {/* Review Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/applications/${app.driver_id}`);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Review
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Summary */}
        {!loading && filteredApps.length > 0 && (
          <Card className="p-4">
            <p className="text-sm text-muted-foreground text-center">
              Showing {filteredApps.length} of {applications.length} applications
            </p>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default AdminApplications;
