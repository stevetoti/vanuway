import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Building2,
  MapPin,
  Star,
  Phone,
  Mail,
  Globe,
  Clock,
  Calendar,
  Users,
  Bed,
  DollarSign,
  MessageSquare,
  ChevronLeft,
  Check,
} from 'lucide-react';
import type { Hotel, HotelRoom, HotelReview } from '@/types/hotels';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChatWidget } from '@/components/hotels/ChatWidget';
import { PaymentMethodSelector } from '@/components/payment/PaymentMethodSelector';
import type { PaymentMethodType } from '@/lib/payment/payment-service';

interface HotelWithDetails extends Hotel {
  rooms?: HotelRoom[];
  reviews?: HotelReview[];
}

const HotelDetails = () => {
  const { hotelId } = useParams<{ hotelId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hotel, setHotel] = useState<HotelWithDetails | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<HotelRoom | null>(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [bookingData, setBookingData] = useState({
    check_in_date: '',
    check_out_date: '',
    number_of_guests: 2,
    number_of_rooms: 1,
    guest_name: '',
    guest_email: user?.email || '',
    guest_phone: '',
    special_requests: '',
    payment_method: 'cod' as PaymentMethodType,
    payment_method_id: undefined as string | undefined,
  });

  useEffect(() => {
    if (hotelId) {
      loadHotelDetails();
    }
  }, [hotelId]);

  const loadHotelDetails = async () => {
    try {
      // Get hotel with owner info
      const { data: hotelData, error: hotelError } = await supabase
        .from('hotels')
        .select('*, owner:hotel_owners(user_id)')
        .eq('id', hotelId)
        .single();

      if (hotelError) throw hotelError;

      // Get rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from('hotel_rooms')
        .select('*')
        .eq('hotel_id', hotelId)
        .eq('is_active', true)
        .order('base_price', { ascending: true });

      if (roomsError) {
        console.log('No rooms found or error:', roomsError);
      }

      // Get reviews (without trying to join auth.users)
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('hotel_reviews')
        .select('*')
        .eq('hotel_id', hotelId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (reviewsError) {
        console.log('No reviews found or error:', reviewsError);
      }

      setHotel({
        ...hotelData,
        rooms: roomsData || [],
        reviews: reviewsData || [],
      } as any);
    } catch (error: any) {
      console.error('Error loading hotel:', error);
      toast.error('Failed to load hotel details');
      navigate('/hotels');
    } finally {
      setLoading(false);
    }
  };

  const handleBookRoom = (room: HotelRoom) => {
    if (!user) {
      toast.error('Please log in to book a room');
      navigate('/login');
      return;
    }
    setSelectedRoom(room);
    setShowBookingDialog(true);
  };

  const calculateNights = () => {
    if (!bookingData.check_in_date || !bookingData.check_out_date) return 0;
    const checkIn = new Date(bookingData.check_in_date);
    const checkOut = new Date(bookingData.check_out_date);
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateTotalPrice = () => {
    if (!selectedRoom) return 0;
    const nights = calculateNights();
    const roomPrice = Number(selectedRoom.base_price);
    return roomPrice * nights * bookingData.number_of_rooms;
  };

  const handleSubmitBooking = async () => {
    if (!hotelId || !selectedRoom || !user) return;

    const nights = calculateNights();
    if (nights === 0) {
      toast.error('Please select valid check-in and check-out dates');
      return;
    }

    if (!bookingData.guest_name || !bookingData.guest_email || !bookingData.guest_phone) {
      toast.error('Please fill in all guest information');
      return;
    }

    try {
      const totalPrice = calculateTotalPrice();

      const { error } = await supabase.from('hotel_bookings').insert({
        hotel_id: hotelId,
        room_id: selectedRoom.id,
        user_id: user.id,
        check_in_date: bookingData.check_in_date,
        check_out_date: bookingData.check_out_date,
        number_of_nights: nights,
        number_of_guests: bookingData.number_of_guests,
        number_of_rooms: bookingData.number_of_rooms,
        guest_name: bookingData.guest_name,
        guest_email: bookingData.guest_email,
        guest_phone: bookingData.guest_phone,
        special_requests: bookingData.special_requests,
        room_price: selectedRoom.base_price,
        total_price: totalPrice,
        booking_status: 'pending',
        payment_status: bookingData.payment_method === 'cod' ? 'pending' : 'pending',
        payment_method: bookingData.payment_method,
        payment_method_id: bookingData.payment_method_id,
      });

      if (error) throw error;

      toast.success('Booking request submitted!', {
        description: 'You will receive a confirmation email shortly.',
      });

      setShowBookingDialog(false);
      navigate('/bookings');
    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast.error('Failed to create booking', {
        description: error.message,
      });
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-5 w-5 ${
          i < Math.floor(rating)
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
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
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate('/hotels')}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Hotels
        </Button>

        {/* Hotel Header */}
        <div>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{hotel.name}</h1>
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <MapPin className="h-5 w-5" />
                <span>
                  {hotel.address_line1}, {hotel.city}, {hotel.province}
                </span>
              </div>
              {hotel.star_rating && (
                <Badge variant="outline">
                  {hotel.star_rating} Star Hotel
                </Badge>
              )}
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 mb-1">
                {renderStars(hotel.average_rating)}
              </div>
              <p className="text-sm text-muted-foreground">
                {hotel.average_rating.toFixed(1)} ({hotel.total_reviews} reviews)
              </p>
            </div>
          </div>

          {/* Image Placeholder */}
          <div className="h-96 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center">
            <Building2 className="h-32 w-32 text-primary/40" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {hotel.description && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-3">About</h2>
                <p className="text-muted-foreground whitespace-pre-line">
                  {hotel.description}
                </p>
              </Card>
            )}

            {/* Rooms */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Available Rooms</h2>
              {hotel.rooms && hotel.rooms.length > 0 ? (
                <div className="space-y-4">
                  {hotel.rooms.map((room) => (
                    <div key={room.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{room.name}</h3>
                          <p className="text-sm text-muted-foreground capitalize">
                            {room.room_type.replace('_', ' ')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">
                            {room.base_price.toLocaleString()} VUV
                          </p>
                          <p className="text-xs text-muted-foreground">per night</p>
                        </div>
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
                        {room.size_sqm && (
                          <div>
                            {room.size_sqm} m²
                          </div>
                        )}
                      </div>

                      {room.amenities && room.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {room.amenities.map((amenity) => (
                            <Badge key={amenity} variant="outline" className="text-xs">
                              <Check className="h-3 w-3 mr-1" />
                              {amenity}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {room.available_rooms} of {room.total_rooms} rooms available
                        </p>
                        <Button
                          onClick={() => handleBookRoom(room)}
                          disabled={room.available_rooms === 0}
                        >
                          {room.available_rooms === 0 ? 'Sold Out' : 'Book Now'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-6">
                  No rooms available at the moment
                </p>
              )}
            </Card>

            {/* Reviews */}
            {hotel.reviews && hotel.reviews.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Guest Reviews</h2>
                <div className="space-y-4">
                  {hotel.reviews.map((review) => (
                    <div key={review.id} className="border-b pb-4 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          {renderStars(review.rating)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {review.title && (
                        <h4 className="font-semibold mb-1">{review.title}</h4>
                      )}
                      {review.comment && (
                        <p className="text-muted-foreground">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Contact Info */}
            <Card className="p-6 space-y-3">
              <h3 className="font-semibold text-lg">Contact Information</h3>
              {hotel.phone_number && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{hotel.phone_number}</span>
                </div>
              )}
              {hotel.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{hotel.email}</span>
                </div>
              )}
              {hotel.website && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={hotel.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Visit Website
                  </a>
                </div>
              )}
            </Card>

            {/* Chat with Owner */}
            {(hotel as any).owner?.user_id && (
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-3">Have Questions?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Chat directly with the property owner
                </p>
                <ChatWidget
                  hotelId={hotel.id}
                  hotelName={hotel.name}
                  ownerId={(hotel as any).owner.user_id}
                  triggerButton={true}
                />
              </Card>
            )}

            {/* Check-in/out */}
            <Card className="p-6 space-y-3">
              <h3 className="font-semibold text-lg">Check-in & Check-out</h3>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Check-in: {hotel.check_in_time}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Check-out: {hotel.check_out_time}</span>
              </div>
            </Card>

            {/* Policies */}
            {hotel.cancellation_policy && (
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-2">Cancellation Policy</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {hotel.cancellation_policy}
                </p>
              </Card>
            )}

            {hotel.house_rules && (
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-2">House Rules</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {hotel.house_rules}
                </p>
              </Card>
            )}
          </div>
        </div>

        {/* Booking Dialog */}
        <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Book {selectedRoom?.name}</DialogTitle>
              <DialogDescription>
                Complete your booking at {hotel.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="check_in">Check-in Date *</Label>
                  <Input
                    id="check_in"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={bookingData.check_in_date}
                    onChange={(e) =>
                      setBookingData({
                        ...bookingData,
                        check_in_date: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="check_out">Check-out Date *</Label>
                  <Input
                    id="check_out"
                    type="date"
                    min={bookingData.check_in_date || new Date().toISOString().split('T')[0]}
                    value={bookingData.check_out_date}
                    onChange={(e) =>
                      setBookingData({
                        ...bookingData,
                        check_out_date: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="guests">Number of Guests *</Label>
                  <Input
                    id="guests"
                    type="number"
                    min="1"
                    max={selectedRoom?.max_occupancy}
                    value={bookingData.number_of_guests}
                    onChange={(e) =>
                      setBookingData({
                        ...bookingData,
                        number_of_guests: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rooms">Number of Rooms *</Label>
                  <Input
                    id="rooms"
                    type="number"
                    min="1"
                    max={selectedRoom?.available_rooms}
                    value={bookingData.number_of_rooms}
                    onChange={(e) =>
                      setBookingData({
                        ...bookingData,
                        number_of_rooms: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="guest_name">Guest Name *</Label>
                <Input
                  id="guest_name"
                  placeholder="Full name"
                  value={bookingData.guest_name}
                  onChange={(e) =>
                    setBookingData({ ...bookingData, guest_name: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="guest_email">Email *</Label>
                  <Input
                    id="guest_email"
                    type="email"
                    value={bookingData.guest_email}
                    onChange={(e) =>
                      setBookingData({ ...bookingData, guest_email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guest_phone">Phone *</Label>
                  <Input
                    id="guest_phone"
                    type="tel"
                    placeholder="+678..."
                    value={bookingData.guest_phone}
                    onChange={(e) =>
                      setBookingData({ ...bookingData, guest_phone: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="special_requests">Special Requests</Label>
                <Input
                  id="special_requests"
                  placeholder="Any special requirements..."
                  value={bookingData.special_requests}
                  onChange={(e) =>
                    setBookingData({
                      ...bookingData,
                      special_requests: e.target.value,
                    })
                  }
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <PaymentMethodSelector
                  selectedMethod={bookingData.payment_method}
                  onMethodSelect={(method, methodId) => {
                    setBookingData(prev => ({
                      ...prev,
                      payment_method: method,
                      payment_method_id: methodId,
                    }));
                  }}
                  amount={calculateTotalPrice()}
                  currency="VUV"
                  serviceType="hotel"
                />
              </div>

              {/* Booking Summary */}
              <Card className="p-4 bg-muted/50">
                <h4 className="font-semibold mb-3">Booking Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Room:</span>
                    <span>{selectedRoom?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Number of nights:</span>
                    <span>{calculateNights()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Number of rooms:</span>
                    <span>{bookingData.number_of_rooms}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Price per night:</span>
                    <span>{selectedRoom?.base_price.toLocaleString()} VUV</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base pt-2 border-t">
                    <span>Total:</span>
                    <span>{calculateTotalPrice().toLocaleString()} VUV</span>
                  </div>
                </div>
              </Card>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBookingDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitBooking}>
                Confirm Booking
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default HotelDetails;
