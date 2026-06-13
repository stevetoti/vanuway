import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Search,
  Car,
  Bike,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  Mail,
  Star,
  DollarSign,
  MapPin,
  Loader2,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Driver {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  vehicle_type: string;
  vehicle_model: string;
  vehicle_color: string;
  license_plate: string;
  status: 'available' | 'busy' | 'offline';
  is_verified: boolean;
  rating: number;
  total_rides: number;
  total_earnings: number;
  created_at: string;
}

const formatVUV = (amount: number) => {
  return new Intl.NumberFormat('en-VU', {
    style: 'currency',
    currency: 'VUV',
    maximumFractionDigits: 0,
  }).format(amount);
};

const AdminDriversManagement = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadDrivers();
  }, []);

  useEffect(() => {
    filterDrivers();
  }, [searchTerm, statusFilter, verificationFilter, drivers]);

  const loadDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDrivers(data as Driver[] || []);
    } catch (error: unknown) {
      console.error('Error loading drivers:', error);
      toast.error('Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const filterDrivers = () => {
    let filtered = drivers;

    // Filter by verification status
    if (verificationFilter !== 'all') {
      const isVerified = verificationFilter === 'verified';
      filtered = filtered.filter((d) => d.is_verified === isVerified);
    }

    // Filter by online status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((d) => d.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.first_name?.toLowerCase().includes(term) ||
          d.last_name?.toLowerCase().includes(term) ||
          d.email?.toLowerCase().includes(term) ||
          d.phone_number?.includes(term) ||
          d.license_plate?.toLowerCase().includes(term) ||
          d.vehicle_model?.toLowerCase().includes(term)
      );
    }

    setFilteredDrivers(filtered);
  };

  const handleApproveDriver = async (driver: Driver) => {
    setSelectedDriver(driver);
    setShowApprovalDialog(true);
  };

  const confirmApproval = async (approve: boolean) => {
    if (!selectedDriver) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ is_verified: approve })
        .eq('id', selectedDriver.id);

      if (error) throw error;

      toast.success(approve ? 'Driver approved successfully!' : 'Driver verification revoked');

      // Update local state
      setDrivers(drivers.map(d =>
        d.id === selectedDriver.id ? { ...d, is_verified: approve } : d
      ));

      setShowApprovalDialog(false);
      setSelectedDriver(null);
    } catch (error: unknown) {
      console.error('Error updating driver:', error);
      toast.error('Failed to update driver');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: unknown; label: string; className: string }> = {
      available: { variant: 'default', label: 'Online', className: 'bg-green-100 text-green-700' },
      busy: { variant: 'default', label: 'On Trip', className: 'bg-yellow-100 text-yellow-700' },
      offline: { variant: 'secondary', label: 'Offline', className: 'bg-gray-100 text-gray-600' },
    };
    const c = config[status] || config.offline;
    return <Badge className={c.className}>{c.label}</Badge>;
  };

  const getVerificationBadge = (isVerified: boolean) => {
    return isVerified ? (
      <Badge className="bg-green-100 text-green-700 gap-1">
        <CheckCircle className="h-3 w-3" />
        Verified
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-700 gap-1">
        <Clock className="h-3 w-3" />
        Pending
      </Badge>
    );
  };

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Driver Management</h1>
            <p className="text-muted-foreground">
              View and manage all registered drivers
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <span className="font-semibold">{drivers.length}</span> Total Drivers
            </Badge>
            <Badge variant="outline" className="gap-1 bg-yellow-50">
              <Clock className="h-3 w-3" />
              <span className="font-semibold">{drivers.filter(d => !d.is_verified).length}</span> Pending
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, phone, plate..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={verificationFilter} onValueChange={setVerificationFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Drivers</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending Approval</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Online</SelectItem>
                <SelectItem value="busy">On Trip</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Drivers List */}
        {loading ? (
          <Card className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Loading drivers...</p>
          </Card>
        ) : filteredDrivers.length === 0 ? (
          <Card className="p-12 text-center">
            <Car className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No drivers found</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredDrivers.map((driver) => (
              <Card key={driver.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Driver Info */}
                  <div className="flex gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      {driver.vehicle_type === 'car' ? (
                        <Car className="h-8 w-8 text-primary" />
                      ) : (
                        <Bike className="h-8 w-8 text-primary" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">
                          {driver.first_name} {driver.last_name}
                        </h3>
                        {getVerificationBadge(driver.is_verified)}
                        {getStatusBadge(driver.status)}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {driver.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {driver.phone_number}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="text-muted-foreground">
                          {driver.vehicle_model} • {driver.vehicle_color} • {driver.license_plate}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats & Actions */}
                  <div className="flex flex-col md:items-end gap-3">
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">{driver.rating?.toFixed(1) || '0.0'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{driver.total_rides || 0} rides</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-medium">{formatVUV(driver.total_earnings || 0)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!driver.is_verified ? (
                        <Button
                          onClick={() => handleApproveDriver(driver)}
                          className="gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Approve Driver
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => handleApproveDriver(driver)}
                          className="gap-2"
                        >
                          <XCircle className="h-4 w-4" />
                          Revoke Verification
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Approval Dialog */}
        <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedDriver?.is_verified ? 'Revoke Driver Verification' : 'Approve Driver'}
              </DialogTitle>
              <DialogDescription>
                {selectedDriver?.is_verified
                  ? `Are you sure you want to revoke verification for ${selectedDriver?.first_name} ${selectedDriver?.last_name}? They will no longer be able to accept rides.`
                  : `Approve ${selectedDriver?.first_name} ${selectedDriver?.last_name} as a verified driver? They will be able to go online and accept ride requests.`}
              </DialogDescription>
            </DialogHeader>

            {selectedDriver && (
              <div className="py-4 space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  {selectedDriver.vehicle_type === 'car' ? (
                    <Car className="h-6 w-6 text-primary" />
                  ) : (
                    <Bike className="h-6 w-6 text-primary" />
                  )}
                  <div>
                    <p className="font-medium">{selectedDriver.vehicle_model}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedDriver.vehicle_color} • {selectedDriver.license_plate}
                    </p>
                  </div>
                </div>
                <div className="text-sm space-y-1 text-muted-foreground">
                  <p><strong>Email:</strong> {selectedDriver.email}</p>
                  <p><strong>Phone:</strong> {selectedDriver.phone_number}</p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowApprovalDialog(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                onClick={() => confirmApproval(!selectedDriver?.is_verified)}
                disabled={isUpdating}
                variant={selectedDriver?.is_verified ? 'destructive' : 'default'}
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {selectedDriver?.is_verified ? 'Revoke Verification' : 'Approve Driver'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AdminDriversManagement;
