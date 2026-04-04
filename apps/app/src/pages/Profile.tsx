import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import {
  LogOut, Calendar, MapPin, CreditCard, Bell, Globe, HelpCircle,
  FileText, Shield, Info, Edit, ChevronRight, Car, UtensilsCrossed,
  Star, Trash2, UserPlus, LayoutDashboard, Wallet, TrendingUp,
  Hotel, Utensils, Map, Wrench, Clock, Camera,
  CheckCircle2, AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePWA } from '@/hooks/usePWA';

interface DriverInfo {
  id: string;
  vehicle_type: string;
  vehicle_model: string;
  license_plate: string;
  status: string;
  rating: number;
  total_rides: number;
  total_earnings: number;
  is_verified: boolean;
  application_status: string;
  vehicle_photo_url?: string;
}

interface VendorInfo {
  type: 'hotel' | 'restaurant' | 'tour' | 'service_provider';
  label: string;
  icon: typeof Hotel;
  dashboardPath: string;
  businessName?: string;
  status?: string;
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { clearCache } = usePWA();
  const [showEditModal, setShowEditModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingVehicle, setIsUploadingVehicle] = useState(false);
  const [stats, setStats] = useState({ rides: 0, orders: 0, totalSpent: 0 });
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null);
  const [vendorRoles, setVendorRoles] = useState<VendorInfo[]>([]);
  const [rolesLoaded, setRolesLoaded] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const vehicleInputRef = useRef<HTMLInputElement>(null);

  const handleClearCache = async () => {
    try {
      await clearCache();
      toast.success('Cache cleared! Refreshing...');
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast.error('Failed to clear cache');
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchUserStats();
      fetchUserRoles();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (!error && data) {
        setFullName(data.full_name || '');
        setPhone(data.phone || '');
        setAvatarUrl(data.avatar_url || null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchUserStats = async () => {
    try {
      const { count: rideCount } = await supabase
        .from('ride_bookings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id);

      const { count: orderCount } = await supabase
        .from('food_orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id);

      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user!.id)
        .eq('type', 'debit')
        .eq('currency', 'VUV');

      const totalSpent = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
      setStats({ rides: rideCount || 0, orders: orderCount || 0, totalSpent });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUserRoles = async () => {
    if (!user) return;
    const vendors: VendorInfo[] = [];

    try {
      const { data: driver } = await supabase
        .from('drivers')
        .select('id, vehicle_type, vehicle_model, license_plate, status, rating, total_rides, total_earnings, is_verified, application_status, vehicle_photo_url')
        .eq('user_id', user.id)
        .maybeSingle();

      if (driver) setDriverInfo(driver as DriverInfo);

      const { data: hotelOwner } = await supabase
        .from('hotel_owners')
        .select('business_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (hotelOwner) {
        vendors.push({
          type: 'hotel', label: 'Hotel Owner', icon: Hotel,
          dashboardPath: '/hotels/owner/dashboard',
          businessName: hotelOwner.business_name,
        });
      }

      const { data: restaurantOwner } = await supabase
        .from('restaurant_owners')
        .select('business_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (restaurantOwner) {
        vendors.push({
          type: 'restaurant', label: 'Restaurant Owner', icon: Utensils,
          dashboardPath: '/food/owner/dashboard',
          businessName: restaurantOwner.business_name,
        });
      }

      const { data: tourOp } = await supabase
        .from('tour_operators')
        .select('business_name, application_status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (tourOp) {
        vendors.push({
          type: 'tour', label: 'Tour Operator', icon: Map,
          dashboardPath: '/tours/provider/dashboard',
          businessName: tourOp.business_name,
          status: tourOp.application_status,
        });
      }

      const { data: serviceProvider } = await supabase
        .from('service_providers')
        .select('business_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (serviceProvider) {
        vendors.push({
          type: 'service_provider', label: 'Service Provider', icon: Wrench,
          dashboardPath: '/providers/dashboard',
          businessName: serviceProvider.business_name,
        });
      }

      setVendorRoles(vendors);
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setRolesLoaded(true);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Photo must be under 2MB');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      // Add cache-busting param
      const url = `${publicUrl}?t=${Date.now()}`;

      await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);
      setAvatarUrl(url);
      toast.success('Profile photo updated!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload photo');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleVehiclePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !driverInfo) return;

    if (file.size > 3 * 1024 * 1024) {
      toast.error('Photo must be under 3MB');
      return;
    }

    setIsUploadingVehicle(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/vehicle.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      const url = `${publicUrl}?t=${Date.now()}`;

      await supabase.from('drivers').update({ vehicle_photo_url: url }).eq('user_id', user.id);
      setDriverInfo({ ...driverInfo, vehicle_photo_url: url });
      toast.success('Vehicle photo updated!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload vehicle photo');
    } finally {
      setIsUploadingVehicle(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!fullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user!.id,
          full_name: fullName,
          phone: phone,
          updated_at: new Date().toISOString(),
        });
      if (error) throw error;
      toast.success('Profile updated successfully');
      setShowEditModal(false);
      fetchUserProfile();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const displayName = fullName || user?.email?.split('@')[0] || 'User';
  const memberSince = user?.created_at ? new Date(user.created_at).getFullYear() : new Date().getFullYear();

  const isDriver = !!driverInfo;
  const isApprovedDriver = isDriver && driverInfo!.application_status === 'approved' && driverInfo!.is_verified;
  const isPendingDriver = isDriver && driverInfo!.application_status !== 'approved';

  const accountItems: { icon: typeof Car; label: string; path: string; color: string; badge?: string }[] = [
    { icon: Calendar, label: 'My Bookings', path: '/bookings', color: 'text-primary' },
    { icon: MapPin, label: 'Saved Addresses', path: '/profile/addresses', color: 'text-secondary' },
    { icon: CreditCard, label: 'Payment Methods', path: '/profile/payments', color: 'text-green-600' },
  ];

  if (!isDriver && rolesLoaded) {
    accountItems.push({ icon: UserPlus, label: 'Become a Driver', path: '/driver/register', color: 'text-amber-600' });
  }

  if (vendorRoles.length === 0 && rolesLoaded) {
    accountItems.push({ icon: UserPlus, label: 'Become a Partner', path: '/partners', color: 'text-orange-600' });
  }

  return (
    <Layout>
      <div className="container py-6 space-y-6 max-w-4xl">
        {/* Profile Header */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            {/* Avatar with upload */}
            <div className="relative group">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-2xl font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
              >
                {isUploadingAvatar ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              {/* Small camera badge on mobile (always visible) */}
              <div
                className="absolute -bottom-1 -right-1 h-7 w-7 bg-primary rounded-full flex items-center justify-center border-2 border-white cursor-pointer sm:hidden"
                onClick={() => avatarInputRef.current?.click()}
              >
                <Camera className="h-3.5 w-3.5 text-white" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-2xl font-bold truncate">{displayName}</h2>
                  <p className="text-muted-foreground text-sm truncate">{user?.email}</p>
                  {phone && <p className="text-sm text-muted-foreground">{phone}</p>}
                  <p className="text-xs text-muted-foreground mt-1">Member since {memberSince}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {isApprovedDriver && (
                      <Badge className="bg-blue-600 text-white text-xs">
                        <Car className="h-3 w-3 mr-1" />Driver
                      </Badge>
                    )}
                    {isPendingDriver && (
                      <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                        <Clock className="h-3 w-3 mr-1" />Driver (Pending)
                      </Badge>
                    )}
                    {vendorRoles.map(v => (
                      <Badge key={v.type} className="bg-orange-600 text-white text-xs">
                        <v.icon className="h-3 w-3 mr-1" />{v.label}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0"
                  onClick={() => setShowEditModal(true)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center">
            <div className="h-10 w-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Car className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-primary">{stats.rides}</p>
            <p className="text-xs text-muted-foreground">Rides Taken</p>
          </Card>
          <Card className="p-4 text-center">
            <div className="h-10 w-10 mx-auto rounded-full bg-secondary/10 flex items-center justify-center mb-2">
              <UtensilsCrossed className="h-5 w-5 text-secondary" />
            </div>
            <p className="text-2xl font-bold text-secondary">{stats.orders}</p>
            <p className="text-xs text-muted-foreground">Orders Placed</p>
          </Card>
          <Card className="p-4 text-center">
            <div className="h-10 w-10 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-2">
              <Star className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.totalSpent.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">VUV Spent</p>
          </Card>
        </div>

        {/* Driver Section */}
        {isApprovedDriver && driverInfo && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3 px-1">Driver</h3>
            <Card>
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Vehicle photo or icon */}
                    <div
                      className="relative group h-14 w-14 rounded-xl overflow-hidden bg-blue-600 flex items-center justify-center cursor-pointer"
                      onClick={() => vehicleInputRef.current?.click()}
                    >
                      {driverInfo.vehicle_photo_url ? (
                        <img src={driverInfo.vehicle_photo_url} alt="Vehicle" className="h-full w-full object-cover" />
                      ) : (
                        <Car className="h-7 w-7 text-white" />
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {isUploadingVehicle ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                        ) : (
                          <Camera className="h-5 w-5 text-white" />
                        )}
                      </div>
                    </div>
                    <input
                      ref={vehicleInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleVehiclePhotoUpload}
                    />
                    <div>
                      <p className="font-semibold">{driverInfo.vehicle_model}</p>
                      <p className="text-xs text-muted-foreground">{driverInfo.license_plate} · {driverInfo.vehicle_type.toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-semibold">{Number(driverInfo.rating).toFixed(1)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{driverInfo.total_rides} rides</p>
                  </div>
                </div>
                {!driverInfo.vehicle_photo_url && (
                  <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                    <Camera className="h-3 w-3" /> Tap above to add your vehicle photo — passengers will see it on the map!
                  </p>
                )}
              </div>
              <div className="divide-y">
                <MenuItem icon={LayoutDashboard} label="Driver Dashboard" path="/driver/dashboard" color="text-blue-600" />
                <MenuItem icon={TrendingUp} label="Earnings" path="/driver/earnings" color="text-green-600" />
                <MenuItem icon={Wallet} label="Payouts" path="/driver/payouts" color="text-purple-600" />
                <MenuItem icon={Calendar} label="Availability & Schedule" path="/driver/availability" color="text-orange-600" />
              </div>
            </Card>
          </div>
        )}

        {/* Pending Driver Application */}
        {isPendingDriver && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3 px-1">Driver Application</h3>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Application {driverInfo!.application_status === 'rejected' ? 'Not Approved' : 'Under Review'}</p>
                  <p className="text-xs text-muted-foreground">
                    {driverInfo!.application_status === 'rejected'
                      ? 'Your application was not approved. Contact support for details.'
                      : 'Your driver application is being reviewed. This usually takes 24-48 hours.'}
                  </p>
                </div>
                {driverInfo!.application_status === 'rejected' ? (
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                ) : (
                  <Badge variant="outline" className="text-amber-600 border-amber-300">Pending</Badge>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Vendor Sections */}
        {vendorRoles.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3 px-1">My Businesses</h3>
            <Card>
              <div className="divide-y">
                {vendorRoles.map(vendor => (
                  <div
                    key={vendor.type}
                    className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(vendor.dashboardPath)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <vendor.icon className="h-5 w-5 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{vendor.label}</p>
                        {vendor.businessName && (
                          <p className="text-xs text-muted-foreground truncate">{vendor.businessName}</p>
                        )}
                      </div>
                      {vendor.status && vendor.status !== 'approved' && (
                        <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">{vendor.status}</Badge>
                      )}
                      {(!vendor.status || vendor.status === 'approved') && (
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      )}
                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Account Section */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3 px-1">Account</h3>
          <Card>
            <div className="divide-y">
              {accountItems.map((item) => (
                <MenuItem key={item.path} icon={item.icon} label={item.label} path={item.path} color={item.color} badge={item.badge} />
              ))}
            </div>
          </Card>
        </div>

        {/* Preferences */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3 px-1">Preferences</h3>
          <Card>
            <div className="divide-y">
              <MenuItem icon={Bell} label="Notifications" path="/profile/notifications" color="text-orange-600" />
              <MenuItem icon={Globe} label="Language" path="/profile/language" color="text-blue-600" badge="EN" />
            </div>
          </Card>
        </div>

        {/* Support & Info */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3 px-1">Support & Info</h3>
          <Card>
            <div className="divide-y">
              <MenuItem icon={HelpCircle} label="Help & Support" path="/support" color="text-purple-600" />
              <MenuItem icon={FileText} label="Terms & Conditions" path="/terms" color="text-gray-600" />
              <MenuItem icon={Shield} label="Privacy Policy" path="/privacy" color="text-gray-600" />
              <MenuItem icon={Info} label="About Vanuway" path="/about" color="text-gray-600" />
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button variant="outline" className="w-full" onClick={handleClearCache}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Cache & Refresh
          </Button>
          <Button variant="destructive" className="w-full" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Edit Profile Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>Update your personal information</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Avatar upload in modal too */}
              <div className="flex justify-center">
                <div className="relative group">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-3xl font-bold">
                      {displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                  >
                    <Camera className="h-6 w-6 text-white" />
                  </button>
                  <div
                    className="absolute -bottom-1 -right-1 h-8 w-8 bg-primary rounded-full flex items-center justify-center border-2 border-white cursor-pointer"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div>
                <Label>Full Name</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+678 XXXXXXX"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={user?.email} disabled className="mt-2 bg-muted" />
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowEditModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleUpdateProfile} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

function MenuItem({ icon: Icon, label, path, color, badge }: {
  icon: typeof Car; label: string; path: string; color: string; badge?: string;
}) {
  const navigate = useNavigate();
  return (
    <div
      className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => navigate(path)}
    >
      <div className="flex items-center gap-3">
        <div className={color}><Icon className="h-5 w-5" /></div>
        <span className="flex-1 font-medium">{label}</span>
        {badge && <span className="text-xs bg-muted px-2 py-1 rounded">{badge}</span>}
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>
    </div>
  );
}

export default Profile;
