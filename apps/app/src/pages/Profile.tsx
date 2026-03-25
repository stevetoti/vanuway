import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import {
  LogOut,
  Calendar,
  MapPin,
  CreditCard,
  Bell,
  Globe,
  HelpCircle,
  FileText,
  Shield,
  Info,
  Edit,
  ChevronRight,
  Car,
  UtensilsCrossed,
  Star,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePWA } from '@/hooks/usePWA';

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { clearCache } = usePWA();
  const [showEditModal, setShowEditModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState({
    rides: 0,
    orders: 0,
    totalSpent: 0,
  });

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
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchUserStats = async () => {
    try {
      // Fetch ride bookings count
      const { count: rideCount } = await supabase
        .from('ride_bookings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id);

      // Fetch food orders count
      const { count: orderCount } = await supabase
        .from('food_orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id);

      // Fetch total spent from transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user!.id)
        .eq('type', 'debit')
        .eq('currency', 'VUV');

      const totalSpent = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;

      setStats({
        rides: rideCount || 0,
        orders: orderCount || 0,
        totalSpent,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
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

  const menuSections = [
    {
      title: 'Account',
      items: [
        { icon: Calendar, label: 'My Bookings', path: '/bookings', color: 'text-primary' },
        { icon: MapPin, label: 'Saved Addresses', path: '/profile/addresses', color: 'text-secondary' },
        { icon: CreditCard, label: 'Payment Methods', path: '/profile/payments', color: 'text-green-600' },
        { icon: UserPlus, label: 'Become a Driver', path: '/driver/register', color: 'text-amber-600' },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: Bell, label: 'Notifications', path: '/profile/notifications', color: 'text-orange-600' },
        { icon: Globe, label: 'Language', path: '/profile/language', color: 'text-blue-600', badge: 'EN' },
      ],
    },
    {
      title: 'Support & Info',
      items: [
        { icon: HelpCircle, label: 'Help & Support', path: '/support', color: 'text-purple-600' },
        { icon: FileText, label: 'Terms & Conditions', path: '/terms', color: 'text-gray-600' },
        { icon: Shield, label: 'Privacy Policy', path: '/privacy', color: 'text-gray-600' },
        { icon: Info, label: 'About Vanuway', path: '/about', color: 'text-gray-600' },
      ],
    },
  ];

  const displayName = fullName || user?.email?.split('@')[0] || 'User';
  const memberSince = user?.created_at ? new Date(user.created_at).getFullYear() : new Date().getFullYear();

  return (
    <Layout>
      <div className="container py-6 space-y-6 max-w-4xl">
        {/* Profile Header */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{displayName}</h2>
                  <p className="text-muted-foreground">{user?.email}</p>
                  {phone && <p className="text-sm text-muted-foreground">{phone}</p>}
                  <p className="text-xs text-muted-foreground mt-1">Member since {memberSince}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditModal(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <div className="h-10 w-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Car className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-primary">{stats.rides}</p>
            <p className="text-sm text-muted-foreground">Rides Taken</p>
          </Card>
          <Card className="p-4 text-center">
            <div className="h-10 w-10 mx-auto rounded-full bg-secondary/10 flex items-center justify-center mb-2">
              <UtensilsCrossed className="h-5 w-5 text-secondary" />
            </div>
            <p className="text-2xl font-bold text-secondary">{stats.orders}</p>
            <p className="text-sm text-muted-foreground">Orders Placed</p>
          </Card>
          <Card className="p-4 text-center">
            <div className="h-10 w-10 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-2">
              <Star className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.totalSpent.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">VUV Spent</p>
          </Card>
        </div>

        {/* Menu Sections */}
        {menuSections.map((section) => (
          <div key={section.title}>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3 px-1">
              {section.title}
            </h3>
            <Card>
              <div className="divide-y">
                {section.items.map((item, index) => (
                  <div
                    key={item.path}
                    className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(item.path)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`${item.color}`}>
                        <item.icon className="h-5 w-5" />
                      </div>
                      <span className="flex-1 font-medium">{item.label}</span>
                      {item.badge && (
                        <span className="text-xs bg-muted px-2 py-1 rounded">{item.badge}</span>
                      )}
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ))}

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

export default Profile;
