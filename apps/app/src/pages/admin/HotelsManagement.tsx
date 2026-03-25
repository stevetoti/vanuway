import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Building2,
  Search,
  Filter,
  MapPin,
  Star,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import type { Hotel, HotelOwner } from '@/types/hotels';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface HotelWithOwner extends Hotel {
  owner?: HotelOwner;
}

const AdminHotelsManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState<HotelWithOwner[]>([]);
  const [filteredHotels, setFilteredHotels] = useState<HotelWithOwner[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    active: 0,
    rejected: 0,
  });

  useEffect(() => {
    loadHotels();
  }, []);

  useEffect(() => {
    filterHotels();
  }, [searchQuery, statusFilter, hotels]);

  const loadHotels = async () => {
    try {
      const { data: hotelsData, error } = await supabase
        .from('hotels')
        .select('*, owner:hotel_owners(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setHotels(hotelsData as any || []);

      // Calculate stats
      const total = hotelsData?.length || 0;
      const pending = hotelsData?.filter((h) => h.status === 'pending_review').length || 0;
      const active = hotelsData?.filter((h) => h.status === 'active').length || 0;
      const rejected = hotelsData?.filter((h) => h.status === 'rejected').length || 0;

      setStats({ total, pending, active, rejected });
    } catch (error: any) {
      console.error('Error loading hotels:', error);
      toast.error('Failed to load hotels');
    } finally {
      setLoading(false);
    }
  };

  const filterHotels = () => {
    let filtered = [...hotels];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (hotel) =>
          hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          hotel.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
          hotel.owner?.business_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((hotel) => hotel.status === statusFilter);
    }

    setFilteredHotels(filtered);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; icon: any }> = {
      draft: { className: 'bg-gray-100 text-gray-800', icon: Clock },
      pending_review: { className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      active: { className: 'bg-green-100 text-green-800', icon: CheckCircle },
      inactive: { className: 'bg-red-100 text-red-800', icon: XCircle },
      rejected: { className: 'bg-red-100 text-red-800', icon: XCircle },
      suspended: { className: 'bg-orange-100 text-orange-800', icon: XCircle },
    };

    const config = variants[status] || variants.draft;
    const Icon = config.icon;

    return (
      <Badge className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ')}
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

  if (loading) {
    return (
      <Layout>
        <div className="container py-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading hotels...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Hotels Management</h1>
          <p className="text-muted-foreground">
            Review and manage hotel properties
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Hotels</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search hotels, owners, or locations..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Hotels List */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Hotels ({filteredHotels.length})
            </h2>
          </div>

          {filteredHotels.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No hotels found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No hotels have been registered yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHotels.map((hotel) => (
                <div
                  key={hotel.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">
                          {hotel.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">
                            {hotel.city}, {hotel.province}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        {getStatusBadge(hotel.status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-muted-foreground">Owner</p>
                        <p className="font-medium truncate">
                          {hotel.owner?.business_name || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Rating</p>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <p className="font-medium">
                            {hotel.average_rating.toFixed(1)} ({hotel.total_reviews})
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Star Rating</p>
                        <p className="font-medium">
                          {hotel.star_rating} ⭐
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Created</p>
                        <p className="font-medium">{formatDate(hotel.created_at)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/admin/hotels/${hotel.id}`)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Review
                      </Button>
                      {hotel.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/hotels/${hotel.id}`)}
                        >
                          View Public Page
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default AdminHotelsManagement;
