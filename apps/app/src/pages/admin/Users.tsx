import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Search,
  Users,
  UserCheck,
  UserX,
  Shield,
  RefreshCw,
  MoreVertical,
  Mail,
  Calendar,
  MapPin,
} from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  created_at: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  roles: string[];
  is_driver: boolean;
  is_hotel_owner: boolean;
  is_restaurant_owner: boolean;
  last_sign_in?: string;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Fetch drivers
      const { data: drivers } = await supabase
        .from('drivers')
        .select('user_id');

      // Fetch hotel owners
      const { data: hotelOwners } = await supabase
        .from('hotel_owners')
        .select('user_id');

      // Fetch restaurant owners
      const { data: restaurantOwners } = await supabase
        .from('restaurant_owners')
        .select('user_id');

      const driverIds = new Set(drivers?.map(d => d.user_id) || []);
      const hotelOwnerIds = new Set(hotelOwners?.map(h => h.user_id) || []);
      const restaurantOwnerIds = new Set(restaurantOwners?.map(r => r.user_id) || []);

      // Map roles to users
      const rolesByUser = new Map<string, string[]>();
      userRoles?.forEach(ur => {
        if (!rolesByUser.has(ur.user_id)) {
          rolesByUser.set(ur.user_id, []);
        }
        rolesByUser.get(ur.user_id)?.push(ur.role);
      });

      const usersWithRoles: UserProfile[] = (profiles || []).map(profile => ({
        id: profile.id,
        email: profile.email || '',
        created_at: profile.created_at,
        full_name: profile.full_name,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
        roles: rolesByUser.get(profile.id) || ['user'],
        is_driver: driverIds.has(profile.id),
        is_hotel_owner: hotelOwnerIds.has(profile.id),
        is_restaurant_owner: restaurantOwnerIds.has(profile.id),
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminRole = async (userId: string, isCurrentlyAdmin: boolean) => {
    try {
      if (isCurrentlyAdmin) {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');
        if (error) throw error;
        toast.success('Admin role removed');
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });
        if (error) throw error;
        toast.success('Admin role granted');
      }
      loadUsers();
    } catch (error) {
      console.error('Error toggling admin role:', error);
      toast.error('Failed to update role');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    
    if (roleFilter === 'all') return matchesSearch;
    if (roleFilter === 'admin') return matchesSearch && user.roles.includes('admin');
    if (roleFilter === 'driver') return matchesSearch && user.is_driver;
    if (roleFilter === 'hotel_owner') return matchesSearch && user.is_hotel_owner;
    if (roleFilter === 'restaurant_owner') return matchesSearch && user.is_restaurant_owner;
    return matchesSearch;
  });

  const stats = {
    total: users.length,
    admins: users.filter(u => u.roles.includes('admin')).length,
    drivers: users.filter(u => u.is_driver).length,
    partners: users.filter(u => u.is_hotel_owner || u.is_restaurant_owner).length,
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage all platform users and roles</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Admins</p>
                  <p className="text-2xl font-bold">{stats.admins}</p>
                </div>
                <Shield className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Drivers</p>
                  <p className="text-2xl font-bold">{stats.drivers}</p>
                </div>
                <UserCheck className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Partners</p>
                  <p className="text-2xl font-bold">{stats.partners}</p>
                </div>
                <UserCheck className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                  <SelectItem value="driver">Drivers</SelectItem>
                  <SelectItem value="hotel_owner">Hotel Owners</SelectItem>
                  <SelectItem value="restaurant_owner">Restaurant Owners</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={loadUsers}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">Loading users...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                              ) : (
                                <Users className="h-5 w-5 text-primary" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{user.full_name || 'No name'}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.roles.includes('admin') && (
                              <Badge className="bg-purple-500">Admin</Badge>
                            )}
                            {!user.roles.includes('admin') && (
                              <Badge variant="outline">User</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.is_driver && <Badge variant="secondary">Driver</Badge>}
                            {user.is_hotel_owner && <Badge variant="secondary">Hotel Owner</Badge>}
                            {user.is_restaurant_owner && <Badge variant="secondary">Restaurant Owner</Badge>}
                            {!user.is_driver && !user.is_hotel_owner && !user.is_restaurant_owner && (
                              <Badge variant="outline">Customer</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(user.created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleAdminRole(user.id, user.roles.includes('admin'))}
                            >
                              {user.roles.includes('admin') ? (
                                <>
                                  <UserX className="h-4 w-4 mr-1" />
                                  Remove Admin
                                </>
                              ) : (
                                <>
                                  <Shield className="h-4 w-4 mr-1" />
                                  Make Admin
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
