import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Search, Eye, CheckCircle, XCircle, Clock, Building2, MapPin,
  Phone, Mail, Star, Calendar, Users, Filter, ArrowLeft
} from 'lucide-react';
import { TourOperator, Tour } from '@/types/tourOperator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function AdminTourOperators() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [operators, setOperators] = useState<TourOperator[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOperator, setSelectedOperator] = useState<TourOperator | null>(null);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load operators
      const { data: operatorsData, error: operatorsError } = await (supabase as any)
        .from('tour_operators')
        .select('*')
        .order('created_at', { ascending: false });

      if (operatorsError) throw operatorsError;
      setOperators(operatorsData || []);

      // Load tours pending approval
      const { data: toursData, error: toursError } = await (supabase as any)
        .from('tours')
        .select('*')
        .order('created_at', { ascending: false });

      if (toursError) throw toursError;
      setTours(toursData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({ title: 'Error loading data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const updateOperatorStatus = async (operatorId: string, status: string, reason?: string) => {
    try {
      const updateData: any = {
        application_status: status,
        reviewed_at: new Date().toISOString(),
      };

      if (status === 'approved') {
        updateData.is_active = true;
      } else if (status === 'rejected') {
        updateData.rejection_reason = reason;
        updateData.is_active = false;
      }

      const { error } = await (supabase as any)
        .from('tour_operators')
        .update(updateData)
        .eq('id', operatorId);

      if (error) throw error;

      toast({ title: `Operator ${status}` });
      setSelectedOperator(null);
      setRejectionReason('');
      loadData();
    } catch (error) {
      console.error('Error updating operator:', error);
      toast({ title: 'Error updating operator', variant: 'destructive' });
    }
  };

  const updateTourStatus = async (tourId: string, status: string) => {
    try {
      const updateData: any = {
        approval_status: status,
      };

      if (status === 'approved') {
        updateData.is_active = true;
      }

      const { error } = await (supabase as any)
        .from('tours')
        .update(updateData)
        .eq('id', tourId);

      if (error) throw error;

      toast({ title: `Tour ${status}` });
      setSelectedTour(null);
      loadData();
    } catch (error) {
      console.error('Error updating tour:', error);
      toast({ title: 'Error updating tour', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; label: string; icon: any }> = {
      pending: { variant: 'secondary', label: 'Pending', icon: Clock },
      submitted: { variant: 'default', label: 'Submitted', icon: Clock },
      under_review: { variant: 'default', label: 'Under Review', icon: Eye },
      approved: { variant: 'default', label: 'Approved', icon: CheckCircle },
      rejected: { variant: 'destructive', label: 'Rejected', icon: XCircle },
      suspended: { variant: 'destructive', label: 'Suspended', icon: XCircle },
    };

    const statusConfig = config[status] || config.pending;
    const Icon = statusConfig.icon;

    return (
      <Badge variant={statusConfig.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {statusConfig.label}
      </Badge>
    );
  };

  const filteredOperators = operators.filter(op => {
    const matchesSearch = op.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || op.application_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingOperators = operators.filter(op => ['submitted', 'under_review'].includes(op.application_status));
  const pendingTours = tours.filter(t => t.approval_status === 'pending');

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tour Operators</h1>
            <p className="text-muted-foreground">
              Manage tour operator applications and tours
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/admin/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-emerald-600" />
                <div>
                  <p className="text-2xl font-bold">{operators.length}</p>
                  <p className="text-sm text-muted-foreground">Total Operators</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold">{pendingOperators.length}</p>
                  <p className="text-sm text-muted-foreground">Pending Approval</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{tours.length}</p>
                  <p className="text-sm text-muted-foreground">Total Tours</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Eye className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{pendingTours.length}</p>
                  <p className="text-sm text-muted-foreground">Tours Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="operators">
          <TabsList>
            <TabsTrigger value="operators">
              Operators ({operators.length})
            </TabsTrigger>
            <TabsTrigger value="pending-operators">
              Pending Operators ({pendingOperators.length})
            </TabsTrigger>
            <TabsTrigger value="pending-tours">
              Pending Tours ({pendingTours.length})
            </TabsTrigger>
          </TabsList>

          {/* All Operators Tab */}
          <TabsContent value="operators" className="mt-6">
            {/* Filters */}
            <Card className="p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
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
            </Card>

            {loading ? (
              <Card className="p-12 text-center text-muted-foreground">Loading...</Card>
            ) : filteredOperators.length === 0 ? (
              <Card className="p-12 text-center text-muted-foreground">No operators found</Card>
            ) : (
              <div className="space-y-4">
                {filteredOperators.map((operator) => (
                  <OperatorCard
                    key={operator.id}
                    operator={operator}
                    getStatusBadge={getStatusBadge}
                    onReview={() => setSelectedOperator(operator)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Pending Operators Tab */}
          <TabsContent value="pending-operators" className="mt-6">
            {pendingOperators.length === 0 ? (
              <Card className="p-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-emerald-500 mb-3" />
                <h3 className="font-semibold text-lg">All Caught Up!</h3>
                <p className="text-muted-foreground">No pending operator applications</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingOperators.map((operator) => (
                  <OperatorCard
                    key={operator.id}
                    operator={operator}
                    getStatusBadge={getStatusBadge}
                    onReview={() => setSelectedOperator(operator)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Pending Tours Tab */}
          <TabsContent value="pending-tours" className="mt-6">
            {pendingTours.length === 0 ? (
              <Card className="p-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-emerald-500 mb-3" />
                <h3 className="font-semibold text-lg">All Caught Up!</h3>
                <p className="text-muted-foreground">No pending tour approvals</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingTours.map((tour) => (
                  <TourCard
                    key={tour.id}
                    tour={tour}
                    onApprove={() => updateTourStatus(tour.id, 'approved')}
                    onReject={() => updateTourStatus(tour.id, 'rejected')}
                    onView={() => navigate(`/tours/${tour.id}`)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Operator Review Sheet */}
        <Sheet open={!!selectedOperator} onOpenChange={() => setSelectedOperator(null)}>
          <SheetContent className="sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Review Operator Application</SheetTitle>
            </SheetHeader>
            {selectedOperator && (
              <div className="mt-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Business Name</Label>
                    <p className="font-medium">{selectedOperator.business_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Business Type</Label>
                    <p className="font-medium capitalize">{selectedOperator.business_type}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Contact Person</Label>
                    <p className="font-medium">{selectedOperator.contact_person}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Email</Label>
                      <p className="font-medium text-sm">{selectedOperator.email}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Phone</Label>
                      <p className="font-medium">{selectedOperator.phone_number}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Location</Label>
                    <p className="font-medium">{selectedOperator.address}, {selectedOperator.island}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Description</Label>
                    <p className="text-sm">{selectedOperator.description || 'No description'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Tour Categories</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedOperator.tour_categories?.map((cat: string) => (
                        <Badge key={cat} variant="secondary" className="capitalize">{cat.replace('_', ' ')}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Years in Operation</Label>
                      <p className="font-medium">{selectedOperator.years_in_operation}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Employees</Label>
                      <p className="font-medium">{selectedOperator.number_of_employees}</p>
                    </div>
                  </div>
                  {selectedOperator.tourism_license_number && (
                    <div>
                      <Label className="text-muted-foreground">Tourism License</Label>
                      <p className="font-medium">{selectedOperator.tourism_license_number}</p>
                    </div>
                  )}
                </div>

                {selectedOperator.application_status !== 'approved' && (
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <Label htmlFor="rejection_reason">Rejection Reason (if rejecting)</Label>
                      <Textarea
                        id="rejection_reason"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Enter reason for rejection..."
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => updateOperatorStatus(selectedOperator.id, 'approved')}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => updateOperatorStatus(selectedOperator.id, 'rejected', rejectionReason)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </Layout>
  );
}

function OperatorCard({
  operator,
  getStatusBadge,
  onReview,
}: {
  operator: TourOperator;
  getStatusBadge: (status: string) => JSX.Element;
  onReview: () => void;
}) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{operator.business_name}</h3>
                <p className="text-sm text-muted-foreground">{operator.contact_person}</p>
              </div>
              {getStatusBadge(operator.application_status)}
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Mail className="h-4 w-4" />
                {operator.email}
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Phone className="h-4 w-4" />
                {operator.phone_number}
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {operator.island}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {operator.tour_categories?.slice(0, 4).map((cat: string) => (
                <Badge key={cat} variant="secondary" className="capitalize text-xs">
                  {cat.replace('_', ' ')}
                </Badge>
              ))}
              {(operator.tour_categories?.length || 0) > 4 && (
                <Badge variant="secondary" className="text-xs">
                  +{operator.tour_categories.length - 4} more
                </Badge>
              )}
            </div>
          </div>

          <Button onClick={onReview}>
            <Eye className="h-4 w-4 mr-2" />
            Review
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TourCard({
  tour,
  onApprove,
  onReject,
  onView,
}: {
  tour: Tour;
  onApprove: () => void;
  onReject: () => void;
  onView: () => void;
}) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-VU', { style: 'currency', currency: 'VUV', maximumFractionDigits: 0 }).format(price);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="text-lg font-semibold">{tour.name}</h3>
              <p className="text-sm text-muted-foreground">{tour.provider_name}</p>
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {tour.location}, {tour.island}
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                {tour.duration_hours} hours
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-4 w-4" />
                Max {tour.max_group_size}
              </div>
            </div>

            <p className="text-sm line-clamp-2">{tour.short_description || tour.description}</p>

            <div className="flex items-center gap-3">
              <Badge className="capitalize">{tour.category.replace('_', ' ')}</Badge>
              <span className="font-bold text-emerald-600">{formatPrice(tour.price_adult)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm" onClick={onView}>
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={onApprove}>
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button variant="destructive" size="sm" onClick={onReject}>
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
