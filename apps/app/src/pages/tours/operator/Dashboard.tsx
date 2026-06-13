import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Plus, MapPin, Clock, Users, Star, Calendar, DollarSign,
  Eye, Edit, Trash2, TrendingUp, Bookmark, CheckCircle, XCircle,
  AlertCircle, BarChart3, Settings, Sparkles
} from 'lucide-react';
import { TourOperator, Tour, OperatorDashboardStats } from '@/types/tourOperator';
import { BulkImportWizard, type ImportedItem } from '@/components/import/BulkImportWizard';
import { LinkedStoreCard } from '@/components/import/LinkedStoreCard';
import { registerImportSource, makeExternalIdFromItem } from '@/lib/import/source-link';

export default function OperatorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [operator, setOperator] = useState<TourOperator | null>(null);
  const [tours, setTours] = useState<Tour[]>([]);
  const [stats, setStats] = useState<OperatorDashboardStats>({
    totalTours: 0,
    activeTours: 0,
    pendingTours: 0,
    totalBookings: 0,
    pendingBookings: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalReviews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);

  const importTours = async (items: ImportedItem[], context?: { sourceUrl?: string; mode: 'ai' | 'csv' }) => {
    if (!operator) return;
    const sourceId = user ? await registerImportSource(user.id, 'tour', context?.sourceUrl) : null;
    const rows = items.map((it) => ({
      operator_id: operator.id,
      name: String(it.name || '').slice(0, 200) || 'Untitled tour',
      description: String(it.description || it.name || 'No description'),
      category: mapTourCategory(String(it.name || ''), String(it.description || '')),
      price_adult: Number(it.price) || 0,
      duration_hours: parseDurationHours(String(it.duration || '')),
      max_group_size: 10,
      location: 'Vanuatu',
      image_url: String(it.image_url || ''),
      is_active: false, // pending admin approval (approval_status defaults to 'pending')
      source_id: sourceId,
      source_external_id: makeExternalIdFromItem(it),
      last_seen_in_source_at: sourceId ? new Date().toISOString() : null,
    }));
    const { error } = await (supabase as unknown).from('tours').insert(rows);
    if (error) throw error;
    toast({
      title: `Imported ${rows.length} tours — pending admin approval`,
      description: sourceId ? "Your website is now linked. We'll auto-sync new products weekly." : undefined,
    });
    loadOperatorData();
  };

  useEffect(() => {
    if (user) {
      loadOperatorData();
    }
  }, [user]);

  const loadOperatorData = async () => {
    if (!user) return;

    try {
      // Get operator profile
      const { data: operatorData, error: operatorError } = await (supabase as unknown)
        .from('tour_operators')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (operatorError || !operatorData) {
        navigate('/tours/operator/register');
        return;
      }

      if (operatorData.application_status !== 'approved') {
        navigate('/tours/operator/pending');
        return;
      }

      setOperator(operatorData);

      // Get tours
      const { data: toursData, error: toursError } = await (supabase as unknown)
        .from('tours')
        .select('*')
        .eq('operator_id', operatorData.id)
        .order('created_at', { ascending: false });

      if (!toursError && toursData) {
        setTours(toursData);

        // Calculate stats
        const activeTours = toursData.filter((t: Tour) => t.is_active && t.approval_status === 'approved').length;
        const pendingTours = toursData.filter((t: Tour) => t.approval_status === 'pending').length;

        setStats({
          totalTours: toursData.length,
          activeTours,
          pendingTours,
          totalBookings: operatorData.total_bookings || 0,
          pendingBookings: 0, // Would need to query bookings
          totalRevenue: 0, // Would need to calculate from bookings
          averageRating: operatorData.average_rating || 5.0,
          totalReviews: operatorData.total_reviews || 0,
        });
      }
    } catch (error) {
      console.error('Error loading operator data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTourActive = async (tourId: string, currentStatus: boolean) => {
    const { error } = await (supabase as unknown)
      .from('tours')
      .update({ is_active: !currentStatus })
      .eq('id', tourId);

    if (error) {
      toast({ title: 'Error updating tour', variant: 'destructive' });
    } else {
      toast({ title: currentStatus ? 'Tour deactivated' : 'Tour activated' });
      loadOperatorData();
    }
  };

  const deleteTour = async (tourId: string) => {
    if (!confirm('Are you sure you want to delete this tour?')) return;

    const { error } = await (supabase as unknown)
      .from('tours')
      .delete()
      .eq('id', tourId);

    if (error) {
      toast({ title: 'Error deleting tour', variant: 'destructive' });
    } else {
      toast({ title: 'Tour deleted' });
      loadOperatorData();
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-VU', { style: 'currency', currency: 'VUV', maximumFractionDigits: 0 }).format(price);
  };

  const getStatusBadge = (tour: Tour) => {
    if (tour.approval_status === 'pending') {
      return <Badge variant="secondary" className="bg-amber-100 text-amber-700">Pending Approval</Badge>;
    }
    if (tour.approval_status === 'rejected') {
      return <Badge variant="destructive">Rejected</Badge>;
    }
    if (!tour.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    return <Badge className="bg-emerald-600">Active</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 w-48 bg-gray-200 rounded mx-auto mb-4" />
          <div className="h-4 w-32 bg-gray-200 rounded mx-auto" />
        </div>
      </div>
    );
  }

  if (!operator) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">{operator.business_name}</h1>
            <p className="text-sm text-white/80">Tour Operator Dashboard</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => navigate('/tours/operator/settings')}
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <div>
                  <p className="text-2xl font-bold">{stats.activeTours}</p>
                  <p className="text-xs text-white/70">Active Tours</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Bookmark className="h-5 w-5" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalBookings}</p>
                  <p className="text-xs text-white/70">Total Bookings</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                <div>
                  <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</p>
                  <p className="text-xs text-white/70">Rating ({stats.totalReviews} reviews)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <p className="text-2xl font-bold">{stats.pendingTours}</p>
                  <p className="text-xs text-white/70">Pending Approval</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        <div className="mb-6">
          <LinkedStoreCard vendorKind="tour" label="your tour business" />
        </div>

        {/* Add Tour Buttons */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <Button
            variant="outline"
            className="h-12"
            onClick={() => setImportOpen(true)}
          >
            <Sparkles className="h-4 w-4 mr-2 text-orange-500" />
            Import from website
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 h-12"
            onClick={() => navigate('/tours/operator/add')}
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New Tour
          </Button>
        </div>

        {/* Tours List */}
        <Tabs defaultValue="all">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">All ({tours.length})</TabsTrigger>
            <TabsTrigger value="active" className="flex-1">Active ({stats.activeTours})</TabsTrigger>
            <TabsTrigger value="pending" className="flex-1">Pending ({stats.pendingTours})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4 space-y-4">
            {tours.length === 0 ? (
              <Card className="p-8 text-center">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-semibold text-lg mb-1">No Tours Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by adding your first tour to the platform
                </p>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => navigate('/tours/operator/add')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tour
                </Button>
              </Card>
            ) : (
              tours.map((tour) => (
                <TourCard
                  key={tour.id}
                  tour={tour}
                  formatPrice={formatPrice}
                  getStatusBadge={getStatusBadge}
                  onToggleActive={toggleTourActive}
                  onEdit={(id) => navigate(`/tours/operator/edit/${id}`)}
                  onDelete={deleteTour}
                  onView={(id) => navigate(`/tours/${id}`)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="active" className="mt-4 space-y-4">
            {tours.filter(t => t.is_active && t.approval_status === 'approved').map((tour) => (
              <TourCard
                key={tour.id}
                tour={tour}
                formatPrice={formatPrice}
                getStatusBadge={getStatusBadge}
                onToggleActive={toggleTourActive}
                onEdit={(id) => navigate(`/tours/operator/edit/${id}`)}
                onDelete={deleteTour}
                onView={(id) => navigate(`/tours/${id}`)}
              />
            ))}
          </TabsContent>

          <TabsContent value="pending" className="mt-4 space-y-4">
            {tours.filter(t => t.approval_status === 'pending').map((tour) => (
              <TourCard
                key={tour.id}
                tour={tour}
                formatPrice={formatPrice}
                getStatusBadge={getStatusBadge}
                onToggleActive={toggleTourActive}
                onEdit={(id) => navigate(`/tours/operator/edit/${id}`)}
                onDelete={deleteTour}
                onView={(id) => navigate(`/tours/${id}`)}
              />
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-3 flex justify-around">
        <Button variant="ghost" className="flex-col h-auto py-2" onClick={() => navigate('/tours/operator/dashboard')}>
          <BarChart3 className="h-5 w-5" />
          <span className="text-xs mt-1">Dashboard</span>
        </Button>
        <Button variant="ghost" className="flex-col h-auto py-2" onClick={() => navigate('/tours/operator/bookings')}>
          <Calendar className="h-5 w-5" />
          <span className="text-xs mt-1">Bookings</span>
        </Button>
        <Button variant="ghost" className="flex-col h-auto py-2 text-emerald-600" onClick={() => navigate('/tours/operator/add')}>
          <div className="bg-emerald-600 text-white rounded-full p-2 -mt-4">
            <Plus className="h-6 w-6" />
          </div>
          <span className="text-xs mt-1">Add Tour</span>
        </Button>
        <Button variant="ghost" className="flex-col h-auto py-2" onClick={() => navigate('/tours/operator/reviews')}>
          <Star className="h-5 w-5" />
          <span className="text-xs mt-1">Reviews</span>
        </Button>
        <Button variant="ghost" className="flex-col h-auto py-2" onClick={() => navigate('/tours/operator/settings')}>
          <Settings className="h-5 w-5" />
          <span className="text-xs mt-1">Settings</span>
        </Button>
      </div>

      <BulkImportWizard
        open={importOpen}
        onOpenChange={setImportOpen}
        vendorType="tour"
        itemLabel="tours"
        previewFields={[
          { key: 'name', label: 'Tour name', type: 'text' },
          { key: 'price', label: 'Price/person (VUV)', type: 'number' },
          { key: 'duration', label: 'Duration', type: 'text' },
          { key: 'description', label: 'Description', type: 'text' },
        ]}
        onConfirm={importTours}
      />
    </div>
  );
}

function parseDurationHours(text: string): number {
  if (!text) return 4;
  const m = text.toLowerCase();
  if (m.includes('full') || m.includes('day')) return 8;
  if (m.includes('half')) return 4;
  const hours = parseFloat(m);
  return isFinite(hours) && hours > 0 ? hours : 4;
}

function mapTourCategory(name: string, desc: string): 'adventure' | 'cultural' | 'nature' | 'historical' | 'water_sports' | 'island_hopping' | 'wildlife' | 'culinary' {
  const t = `${name} ${desc}`.toLowerCase();
  if (/dive|diving|snorkel|kayak|surf|swim|sail|water/.test(t)) return 'water_sports';
  if (/hike|trek|adventure|zipline|climb|atv|quad/.test(t)) return 'adventure';
  if (/island|hop|cruise|boat tour/.test(t)) return 'island_hopping';
  if (/village|culture|kastom|tribal|local people/.test(t)) return 'cultural';
  if (/history|war|wreck|museum|colonial/.test(t)) return 'historical';
  if (/wildlife|dugong|turtle|bird|reef|fauna/.test(t)) return 'wildlife';
  if (/food|cooking|culinary|kava|tasting|chef/.test(t)) return 'culinary';
  return 'nature';
}

// Tour Card Component
function TourCard({
  tour,
  formatPrice,
  getStatusBadge,
  onToggleActive,
  onEdit,
  onDelete,
  onView,
}: {
  tour: Tour;
  formatPrice: (price: number) => string;
  getStatusBadge: (tour: Tour) => JSX.Element;
  onToggleActive: (id: string, status: boolean) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="font-semibold line-clamp-1">{tour.name}</h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="h-3.5 w-3.5" />
              <span>{tour.location}</span>
            </div>
          </div>
          {getStatusBadge(tour)}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{tour.duration_hours}h</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span>Max {tour.max_group_size}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 text-amber-500" />
            <span>{tour.rating.toFixed(1)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-bold text-emerald-600">{formatPrice(tour.price_adult)}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onView(tour.id)}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => onEdit(tour.id)}>
              <Edit className="h-4 w-4" />
            </Button>
            {tour.approval_status === 'approved' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggleActive(tour.id, tour.is_active)}
              >
                {tour.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
              </Button>
            )}
            <Button variant="outline" size="sm" className="text-red-600" onClick={() => onDelete(tour.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
