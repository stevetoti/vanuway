import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  ArrowLeft, Plus, Ship, Plane, TreePalm, Truck, Car,
  Edit2, Trash2, DollarSign, Clock, Users, Loader2, MapPin,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SERVICE_CATEGORIES = [
  { value: 'cruise_transfer', label: 'Cruise Transfer', icon: Ship, color: 'text-blue-600', bg: 'bg-blue-50' },
  { value: 'airport_transfer', label: 'Airport Transfer', icon: Plane, color: 'text-sky-600', bg: 'bg-sky-50' },
  { value: 'tour', label: 'Tour', icon: TreePalm, color: 'text-amber-600', bg: 'bg-amber-50' },
  { value: 'hauling', label: 'Hauling', icon: Truck, color: 'text-gray-600', bg: 'bg-gray-50' },
  { value: 'ride', label: 'Ride', icon: Car, color: 'text-green-600', bg: 'bg-green-50' },
];

interface ServiceForm {
  name: string;
  description: string;
  category: string;
  duration_minutes: number | '';
  base_price: number | '';
  price_per_person: number | '';
  min_passengers: number;
  max_passengers: number | '';
  inclusions: string;
  meeting_point: string;
}

const emptyForm: ServiceForm = {
  name: '',
  description: '',
  category: '',
  duration_minutes: '',
  base_price: '',
  price_per_person: '',
  min_passengers: 1,
  max_passengers: '',
  inclusions: '',
  meeting_point: '',
};

export default function DriverMyServices() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceForm>(emptyForm);

  const { data: driver } = useQuery({
    queryKey: ['driver-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: services, isLoading } = useQuery({
    queryKey: ['driver-services', driver?.id],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('driver_services' as unknown)
        .select('*') as unknown)
        .eq('driver_id', driver!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!driver?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async (formData: ServiceForm) => {
      const payload = {
        driver_id: driver!.id,
        name: formData.name,
        description: formData.description || null,
        category: formData.category,
        duration_minutes: formData.duration_minutes || null,
        base_price: Number(formData.base_price),
        price_per_person: formData.price_per_person ? Number(formData.price_per_person) : null,
        min_passengers: formData.min_passengers,
        max_passengers: formData.max_passengers || null,
        inclusions: formData.inclusions ? formData.inclusions.split('\n').filter(Boolean) : null,
        meeting_point: formData.meeting_point || null,
        is_active: true,
      };

      if (editingId) {
        const { error } = await (supabase
          .from('driver_services' as unknown)
          .update(payload) as unknown)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await (supabase
          .from('driver_services' as unknown)
          .insert(payload) as unknown);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-services'] });
      setSheetOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      toast.success(editingId ? 'Service updated' : 'Service added');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from('driver_services' as unknown)
        .delete() as unknown)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-services'] });
      setDeleteId(null);
      toast.success('Service deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await (supabase
      .from('driver_services' as unknown)
      .update({ is_active: !current }) as unknown)
      .eq('id', id);
    if (error) {
      toast.error('Failed to update');
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['driver-services'] });
  };

  const openEdit = (service: unknown) => {
    setEditingId(service.id);
    setForm({
      name: service.name,
      description: service.description || '',
      category: service.category,
      duration_minutes: service.duration_minutes || '',
      base_price: service.base_price,
      price_per_person: service.price_per_person || '',
      min_passengers: service.min_passengers || 1,
      max_passengers: service.max_passengers || '',
      inclusions: service.inclusions ? service.inclusions.join('\n') : '',
      meeting_point: service.meeting_point || '',
    });
    setSheetOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setSheetOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.category || !form.base_price) {
      toast.error('Please fill in name, category, and base price');
      return;
    }
    saveMutation.mutate(form);
  };

  const getCategoryConfig = (cat: string) =>
    SERVICE_CATEGORIES.find((c) => c.value === cat) || SERVICE_CATEGORIES[4];

  return (
    <Layout>
      <div className="container py-6 space-y-6 max-w-2xl">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">My Services</h1>
            <p className="text-sm text-muted-foreground">Define your tours, transfers, and pricing</p>
          </div>
          <Button onClick={openNew} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add Service
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
            <p className="text-muted-foreground">Loading services...</p>
          </div>
        ) : !services || services.length === 0 ? (
          <Card className="p-12 text-center">
            <TreePalm className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-lg font-medium">No services yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Add your tour, transfer, and ride services so passengers can find and book you
            </p>
            <Button onClick={openNew} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add Your First Service
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {services.map((service: unknown) => {
              const config = getCategoryConfig(service.category);
              const Icon = config.icon;
              return (
                <Card key={service.id} className={`overflow-hidden ${!service.is_active ? 'opacity-60' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`h-11 w-11 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`h-5 w-5 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-bold text-sm truncate">{service.name}</h3>
                          <Badge variant="outline" className="text-[10px] flex-shrink-0">{config.label}</Badge>
                          {!service.is_active && <Badge variant="secondary" className="text-[10px]">Paused</Badge>}
                        </div>
                        {service.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{service.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            VUV {Number(service.base_price).toLocaleString()}
                          </span>
                          {service.duration_minutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {service.duration_minutes} min
                            </span>
                          )}
                          {service.max_passengers && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              Up to {service.max_passengers}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={service.is_active}
                          onCheckedChange={() => toggleActive(service.id, service.is_active)}
                        />
                        <span className="text-xs text-muted-foreground">
                          {service.is_active ? 'Active' : 'Paused'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(service)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => setDeleteId(service.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Add/Edit Sheet */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{editingId ? 'Edit Service' : 'Add New Service'}</SheetTitle>
            </SheetHeader>
            <div className="space-y-5 mt-4 pb-8">
              <div>
                <Label>Service Name *</Label>
                <Input
                  placeholder="e.g. Port Vila City Tour"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe your service..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Base Price (VUV) *</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 8000"
                    value={form.base_price}
                    onChange={(e) => setForm({ ...form, base_price: e.target.value ? Number(e.target.value) : '' })}
                  />
                </div>
                <div>
                  <Label>Per Person (VUV)</Label>
                  <Input
                    type="number"
                    placeholder="Optional"
                    value={form.price_per_person}
                    onChange={(e) => setForm({ ...form, price_per_person: e.target.value ? Number(e.target.value) : '' })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Duration (min)</Label>
                  <Input
                    type="number"
                    placeholder="180"
                    value={form.duration_minutes}
                    onChange={(e) => setForm({ ...form, duration_minutes: e.target.value ? Number(e.target.value) : '' })}
                  />
                </div>
                <div>
                  <Label>Min Passengers</Label>
                  <Input
                    type="number"
                    value={form.min_passengers}
                    onChange={(e) => setForm({ ...form, min_passengers: Number(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <Label>Max Passengers</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 6"
                    value={form.max_passengers}
                    onChange={(e) => setForm({ ...form, max_passengers: e.target.value ? Number(e.target.value) : '' })}
                  />
                </div>
              </div>

              <div>
                <Label>Meeting Point</Label>
                <Input
                  placeholder="e.g. Cruise terminal gate, Hotel lobby"
                  value={form.meeting_point}
                  onChange={(e) => setForm({ ...form, meeting_point: e.target.value })}
                />
              </div>

              <div>
                <Label>What's Included (one per line)</Label>
                <Textarea
                  placeholder="Air-conditioned vehicle&#10;English-speaking driver&#10;Bottled water"
                  value={form.inclusions}
                  onChange={(e) => setForm({ ...form, inclusions: e.target.value })}
                  rows={3}
                />
              </div>

              <Button
                className="w-full h-12"
                onClick={handleSubmit}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? 'Saving...' : editingId ? 'Update Service' : 'Add Service'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Delete confirmation */}
        <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete Service</DialogTitle>
              <DialogDescription>
                Are you sure? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
