import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Plus, MapPin, Home, Briefcase, MapPinned, Star, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { SavedAddress } from '@/types/profile';

export default function SavedAddresses() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(null);

  // Form state
  const [label, setLabel] = useState<'home' | 'work' | 'other'>('home');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('saved_addresses')
        .select('*')
        .eq('user_id', user!.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAddresses((data || []).map(addr => ({
        ...addr,
        label: addr.label as 'home' | 'work' | 'other'
      })));
    } catch (error: unknown) {
      toast.error('Failed to load addresses');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async () => {
    if (!address.trim()) {
      toast.error('Please enter an address');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('saved_addresses').insert({
        user_id: user!.id,
        label,
        address,
        is_default: addresses.length === 0,
      });

      if (error) throw error;

      toast.success('Address added successfully');
      setShowAddModal(false);
      resetForm();
      fetchAddresses();
    } catch (error: unknown) {
      toast.error(error.message || 'Failed to add address');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAddress = async () => {
    if (!selectedAddress || !address.trim()) {
      toast.error('Please enter an address');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('saved_addresses')
        .update({ label, address })
        .eq('id', selectedAddress.id);

      if (error) throw error;

      toast.success('Address updated successfully');
      setShowEditModal(false);
      resetForm();
      fetchAddresses();
    } catch (error: unknown) {
      toast.error(error.message || 'Failed to update address');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      const { error } = await supabase
        .from('saved_addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Address deleted successfully');
      fetchAddresses();
    } catch (error: unknown) {
      toast.error(error.message || 'Failed to delete address');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      // Unset all defaults
      await supabase
        .from('saved_addresses')
        .update({ is_default: false })
        .eq('user_id', user!.id);

      // Set new default
      const { error } = await supabase
        .from('saved_addresses')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;

      toast.success('Default address updated');
      fetchAddresses();
    } catch (error: unknown) {
      toast.error(error.message || 'Failed to set default address');
    }
  };

  const resetForm = () => {
    setLabel('home');
    setAddress('');
    setSelectedAddress(null);
  };

  const openEditModal = (addr: SavedAddress) => {
    setSelectedAddress(addr);
    setLabel(addr.label);
    setAddress(addr.address);
    setShowEditModal(true);
  };

  const getLabelIcon = (labelType: string) => {
    switch (labelType) {
      case 'home':
        return <Home className="h-5 w-5" />;
      case 'work':
        return <Briefcase className="h-5 w-5" />;
      default:
        return <MapPinned className="h-5 w-5" />;
    }
  };

  const getLabelColor = (labelType: string) => {
    switch (labelType) {
      case 'home':
        return 'text-primary';
      case 'work':
        return 'text-secondary';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <p className="text-muted-foreground">Loading addresses...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6 space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">Saved Addresses</h1>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Address
          </Button>
        </div>

        {addresses.length === 0 ? (
          <Card className="p-12 text-center">
            <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No saved addresses</h3>
            <p className="text-muted-foreground mb-6">
              Add your frequently used addresses for faster checkout
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Address
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <Card key={addr.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`${getLabelColor(addr.label)} mt-1`}>
                      {getLabelIcon(addr.label)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold capitalize">{addr.label}</h3>
                        {addr.is_default && (
                          <div className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            <Star className="h-3 w-3 fill-current" />
                            Default
                          </div>
                        )}
                      </div>
                      <p className="text-muted-foreground">{addr.address}</p>
                    </div>
                    <div className="flex gap-2">
                      {!addr.is_default && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSetDefault(addr.id)}
                          title="Set as default"
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(addr)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add Address Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Address</DialogTitle>
              <DialogDescription>Save a new address for faster checkout</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="mb-3 block">Address Label</Label>
                <RadioGroup value={label} onValueChange={(v) => setLabel(v as unknown)}>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="home" id="home" />
                      <Label htmlFor="home" className="cursor-pointer flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        Home
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="work" id="work" />
                      <Label htmlFor="work" className="cursor-pointer flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Work
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="other" id="other" />
                      <Label htmlFor="other" className="cursor-pointer flex items-center gap-2">
                        <MapPinned className="h-4 w-4" />
                        Other
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
              <div>
                <Label>Address</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter full address"
                  className="mt-2"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleAddAddress} disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add Address'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Address Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Address</DialogTitle>
              <DialogDescription>Update your saved address</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label className="mb-3 block">Address Label</Label>
                <RadioGroup value={label} onValueChange={(v) => setLabel(v as unknown)}>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="home" id="edit-home" />
                      <Label htmlFor="edit-home" className="cursor-pointer flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        Home
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="work" id="edit-work" />
                      <Label htmlFor="edit-work" className="cursor-pointer flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Work
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="other" id="edit-other" />
                      <Label htmlFor="edit-other" className="cursor-pointer flex items-center gap-2">
                        <MapPinned className="h-4 w-4" />
                        Other
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
              <div>
                <Label>Address</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter full address"
                  className="mt-2"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleEditAddress} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
