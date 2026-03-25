import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Users,
  Bed,
  DollarSign,
  Check,
  X,
} from 'lucide-react';
import type { Hotel, HotelRoom } from '@/types/hotels';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const ROOM_TYPES = [
  { value: 'single', label: 'Single Room' },
  { value: 'double', label: 'Double Room' },
  { value: 'twin', label: 'Twin Room' },
  { value: 'suite', label: 'Suite' },
  { value: 'family', label: 'Family Room' },
  { value: 'deluxe', label: 'Deluxe Room' },
  { value: 'presidential', label: 'Presidential Suite' },
];

const COMMON_AMENITIES = [
  'WiFi',
  'Air Conditioning',
  'TV',
  'Mini Bar',
  'Safe',
  'Coffee Maker',
  'Balcony',
  'Ocean View',
  'City View',
  'Bathtub',
  'Shower',
  'Hair Dryer',
  'Iron',
  'Desk',
  'Sofa',
];

const ManageRooms = () => {
  const { hotelId } = useParams<{ hotelId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<HotelRoom[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingRoom, setEditingRoom] = useState<HotelRoom | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    room_type: 'single' | 'double' | 'twin' | 'suite' | 'family' | 'deluxe' | 'presidential';
    max_occupancy: number;
    number_of_beds: number;
    bed_type: string;
    size_sqm: number;
    base_price: number;
    weekend_price: number;
    total_rooms: number;
    amenities: string[];
  }>({
    name: '',
    description: '',
    room_type: 'double',
    max_occupancy: 2,
    number_of_beds: 1,
    bed_type: 'Queen',
    size_sqm: 25,
    base_price: 5000,
    weekend_price: 6000,
    total_rooms: 1,
    amenities: [],
  });

  useEffect(() => {
    if (user && hotelId) {
      loadHotelAndRooms();
    }
  }, [user, hotelId]);

  const loadHotelAndRooms = async () => {
    try {
      // Get hotel
      const { data: hotelData, error: hotelError } = await supabase
        .from('hotels')
        .select('*, owner:hotel_owners!inner(user_id)')
        .eq('id', hotelId)
        .single();

      if (hotelError) throw hotelError;

      // Check if user owns this hotel
      if (hotelData.owner.user_id !== user?.id) {
        toast.error('Access denied');
        navigate('/hotels/owner/dashboard');
        return;
      }

      setHotel(hotelData as any);

      // Get rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from('hotel_rooms')
        .select('*')
        .eq('hotel_id', hotelId)
        .order('created_at', { ascending: true });

      if (roomsError) throw roomsError;
      setRooms(roomsData as any || []);
    } catch (error: any) {
      console.error('Error loading hotel:', error);
      toast.error('Failed to load hotel data');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      room_type: 'double',
      max_occupancy: 2,
      number_of_beds: 1,
      bed_type: 'Queen',
      size_sqm: 25,
      base_price: 5000,
      weekend_price: 6000,
      total_rooms: 1,
      amenities: [],
    });
    setEditingRoom(null);
  };

  const handleAddRoom = () => {
    resetForm();
    setShowAddDialog(true);
  };

  const handleEditRoom = (room: HotelRoom) => {
    setFormData({
      name: room.name,
      description: room.description || '',
      room_type: room.room_type,
      max_occupancy: room.max_occupancy,
      number_of_beds: room.number_of_beds || 1,
      bed_type: room.bed_type || 'Queen',
      size_sqm: room.size_sqm || 25,
      base_price: Number(room.base_price),
      weekend_price: Number(room.weekend_price) || Number(room.base_price),
      total_rooms: room.total_rooms,
      amenities: room.amenities || [],
    });
    setEditingRoom(room);
    setShowAddDialog(true);
  };

  const handleSaveRoom = async () => {
    if (!hotelId) return;

    setSaving(true);
    try {
      const roomData = {
        hotel_id: hotelId,
        ...formData,
        available_rooms: editingRoom
          ? editingRoom.available_rooms
          : formData.total_rooms,
        is_active: true,
      };

      if (editingRoom) {
        // Update existing room
        const { error } = await supabase
          .from('hotel_rooms')
          .update(roomData)
          .eq('id', editingRoom.id);

        if (error) throw error;
        toast.success('Room updated successfully!');
      } else {
        // Create new room
        const { error } = await supabase.from('hotel_rooms').insert(roomData);

        if (error) throw error;
        toast.success('Room added successfully!');
      }

      setShowAddDialog(false);
      resetForm();
      loadHotelAndRooms();
    } catch (error: any) {
      console.error('Error saving room:', error);
      toast.error('Failed to save room', {
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return;

    try {
      const { error } = await supabase
        .from('hotel_rooms')
        .delete()
        .eq('id', roomId);

      if (error) throw error;
      toast.success('Room deleted successfully');
      loadHotelAndRooms();
    } catch (error: any) {
      console.error('Error deleting room:', error);
      toast.error('Failed to delete room');
    }
  };

  const toggleAmenity = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!hotel) {
    return null;
  }

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate('/hotels/owner/dashboard')}
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Manage Rooms</h1>
              <p className="text-muted-foreground">{hotel.name}</p>
            </div>
            <Button onClick={handleAddRoom}>
              <Plus className="mr-2 h-4 w-4" />
              Add Room
            </Button>
          </div>
        </div>

        {/* Rooms List */}
        <Card className="p-6">
          {rooms.length === 0 ? (
            <div className="text-center py-12">
              <Bed className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No rooms yet</h3>
              <p className="text-muted-foreground mb-4">
                Add rooms to start accepting bookings
              </p>
              <Button onClick={handleAddRoom}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Room
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="flex items-start gap-4 p-4 border rounded-lg"
                >
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Bed className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{room.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {room.room_type.replace('_', ' ')}
                        </p>
                      </div>
                      <Badge variant={room.is_active ? 'default' : 'secondary'}>
                        {room.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    {room.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {room.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        Max {room.max_occupancy} guests
                      </div>
                      <div className="flex items-center gap-1">
                        <Bed className="h-4 w-4" />
                        {room.number_of_beds} {room.bed_type} bed(s)
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {room.base_price.toLocaleString()} VUV/night
                      </div>
                      <div>
                        {room.available_rooms}/{room.total_rooms} available
                      </div>
                    </div>

                    {room.amenities && room.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {room.amenities.slice(0, 5).map((amenity) => (
                          <Badge
                            key={amenity}
                            variant="outline"
                            className="text-xs"
                          >
                            {amenity}
                          </Badge>
                        ))}
                        {room.amenities.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{room.amenities.length - 5} more
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditRoom(room)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteRoom(room.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Add/Edit Room Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRoom ? 'Edit Room' : 'Add New Room'}
              </DialogTitle>
              <DialogDescription>
                {editingRoom
                  ? 'Update room details and pricing'
                  : 'Add a new room type to your property'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="room_name">Room Name *</Label>
                <Input
                  id="room_name"
                  placeholder="e.g., Deluxe Ocean View"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="room_type">Room Type *</Label>
                <select
                  id="room_type"
                  value={formData.room_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      room_type: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {ROOM_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the room..."
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_occupancy">Max Occupancy *</Label>
                  <Input
                    id="max_occupancy"
                    type="number"
                    min="1"
                    value={formData.max_occupancy}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_occupancy: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size_sqm">Size (sqm)</Label>
                  <Input
                    id="size_sqm"
                    type="number"
                    min="1"
                    value={formData.size_sqm}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        size_sqm: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="number_of_beds">Number of Beds *</Label>
                  <Input
                    id="number_of_beds"
                    type="number"
                    min="1"
                    value={formData.number_of_beds}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        number_of_beds: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bed_type">Bed Type</Label>
                  <Input
                    id="bed_type"
                    placeholder="e.g., King, Queen"
                    value={formData.bed_type}
                    onChange={(e) =>
                      setFormData({ ...formData, bed_type: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="base_price">Base Price (VUV/night) *</Label>
                  <Input
                    id="base_price"
                    type="number"
                    min="0"
                    value={formData.base_price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        base_price: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weekend_price">Weekend Price (VUV/night)</Label>
                  <Input
                    id="weekend_price"
                    type="number"
                    min="0"
                    value={formData.weekend_price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        weekend_price: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="total_rooms">
                  Number of Rooms (of this type) *
                </Label>
                <Input
                  id="total_rooms"
                  type="number"
                  min="1"
                  value={formData.total_rooms}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      total_rooms: parseInt(e.target.value),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Amenities</Label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
                  {COMMON_AMENITIES.map((amenity) => (
                    <div
                      key={amenity}
                      className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                      onClick={() => toggleAmenity(amenity)}
                    >
                      <div
                        className={`w-5 h-5 border rounded flex items-center justify-center ${
                          formData.amenities.includes(amenity)
                            ? 'bg-primary border-primary'
                            : 'border-input'
                        }`}
                      >
                        {formData.amenities.includes(amenity) && (
                          <Check className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <span className="text-sm">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveRoom} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>{editingRoom ? 'Update Room' : 'Add Room'}</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default ManageRooms;
