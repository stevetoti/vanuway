import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, MapPin, Clock, Users, Star, Check, X, Minus, Plus,
  Mountain, Palmtree, Anchor, Camera, Fish, Compass, TreeDeciduous,
  ChefHat, Heart, Share2, Calendar as CalendarIcon, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

const categoryIcons: Record<string, any> = {
  adventure: Mountain,
  cultural: Camera,
  nature: TreeDeciduous,
  historical: Compass,
  water_sports: Anchor,
  island_hopping: Palmtree,
  wildlife: Fish,
  culinary: ChefHat,
};

const difficultyColors: Record<string, string> = {
  easy: 'bg-green-100 text-green-700',
  moderate: 'bg-yellow-100 text-yellow-700',
  challenging: 'bg-orange-100 text-orange-700',
  extreme: 'bg-red-100 text-red-700',
};

interface Tour {
  id: string;
  name: string;
  description: string;
  short_description: string;
  location: string;
  island: string;
  category: string;
  price_adult: number;
  price_child: number;
  duration_hours: number;
  difficulty_level: string;
  max_group_size: number;
  min_age: number;
  image_url: string;
  rating: number;
  review_count: number;
  highlights: string[];
  includes: string[];
  excludes: string[];
  what_to_bring: string[];
  available_days: string[];
  start_times: string[];
  provider_name: string;
}

export default function TourDetails() {
  const navigate = useNavigate();
  const { tourId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [isBooking, setIsBooking] = useState(false);

  const { data: tour, isLoading } = useQuery({
    queryKey: ['tour', tourId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('tours')
        .select('*')
        .eq('id', tourId)
        .single();

      if (error) throw error;
      return data as Tour;
    },
    enabled: !!tourId,
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-VU', { style: 'currency', currency: 'VUV', maximumFractionDigits: 0 }).format(price);
  };

  const formatDuration = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)} minutes`;
    if (hours === Math.floor(hours)) return `${hours} hours`;
    return `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m`;
  };

  const totalPrice = tour ? (adults * tour.price_adult) + (children * (tour.price_child || 0)) : 0;

  const handleBooking = async () => {
    if (!user || !tour || !selectedDate || !selectedTime) {
      toast({
        title: "Incomplete booking",
        description: "Please select a date and time",
        variant: "destructive"
      });
      return;
    }

    setIsBooking(true);
    try {
      const { error } = await supabase.from('tour_bookings').insert({
        user_id: user.id,
        tour_id: tour.id,
        booking_date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: selectedTime,
        adults,
        children,
        total_price: totalPrice,
        status: 'pending',
        payment_status: 'pending'
      });

      if (error) throw error;

      toast({
        title: "Booking confirmed!",
        description: "Your tour booking has been submitted successfully"
      });
      navigate('/bookings');
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: "Booking failed",
        description: "There was an error processing your booking",
        variant: "destructive"
      });
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 animate-pulse">
        <div className="h-64 bg-gray-200" />
        <div className="p-4 space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Tour not found</h2>
          <p className="text-muted-foreground mb-4">This tour may no longer be available</p>
          <Button onClick={() => navigate('/tours')}>Browse Tours</Button>
        </Card>
      </div>
    );
  }

  const CategoryIcon = categoryIcons[tour.category] || Compass;

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header Image */}
      <div className="relative h-72">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <CategoryIcon className="h-24 w-24 text-white/30" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Navigation */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="bg-white/20 backdrop-blur text-white hover:bg-white/30"
            onClick={() => navigate('/tours')}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="bg-white/20 backdrop-blur text-white hover:bg-white/30"
              onClick={() => setIsFavorite(!isFavorite)}
            >
              <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="bg-white/20 backdrop-blur text-white hover:bg-white/30"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <Badge className={difficultyColors[tour.difficulty_level] || 'bg-gray-100'}>
            {tour.difficulty_level}
          </Badge>
          <h1 className="text-2xl font-bold mt-2">{tour.name}</h1>
          <div className="flex items-center gap-3 mt-2 text-white/90">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{tour.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-sm">{tour.rating.toFixed(1)} ({tour.review_count} reviews)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Quick Info */}
        <div className="flex gap-4 overflow-x-auto pb-2">
          <Card className="flex-shrink-0 p-3 text-center min-w-[100px]">
            <Clock className="h-5 w-5 mx-auto text-emerald-600 mb-1" />
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="font-semibold text-sm">{formatDuration(tour.duration_hours)}</p>
          </Card>
          <Card className="flex-shrink-0 p-3 text-center min-w-[100px]">
            <Users className="h-5 w-5 mx-auto text-emerald-600 mb-1" />
            <p className="text-xs text-muted-foreground">Max Group</p>
            <p className="font-semibold text-sm">{tour.max_group_size} people</p>
          </Card>
          <Card className="flex-shrink-0 p-3 text-center min-w-[100px]">
            <CategoryIcon className="h-5 w-5 mx-auto text-emerald-600 mb-1" />
            <p className="text-xs text-muted-foreground">Category</p>
            <p className="font-semibold text-sm capitalize">{tour.category.replace('_', ' ')}</p>
          </Card>
        </div>

        {/* Description */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg mb-2">About this tour</h3>
            <p className="text-muted-foreground">{tour.description}</p>
          </CardContent>
        </Card>

        {/* Highlights */}
        {tour.highlights && tour.highlights.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-3">Highlights</h3>
              <div className="space-y-2">
                {tour.highlights.map((highlight, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Star className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{highlight}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* What's Included / Excluded */}
        <div className="grid grid-cols-2 gap-4">
          {tour.includes && tour.includes.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 text-green-700">Included</h3>
                <div className="space-y-2">
                  {tour.includes.map((item, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-xs">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {tour.excludes && tour.excludes.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 text-red-700">Not Included</h3>
                <div className="space-y-2">
                  {tour.excludes.map((item, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <X className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <span className="text-xs">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* What to Bring */}
        {tour.what_to_bring && tour.what_to_bring.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-3">What to Bring</h3>
              <div className="flex flex-wrap gap-2">
                {tour.what_to_bring.map((item, index) => (
                  <Badge key={index} variant="secondary">{item}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Provider */}
        {tour.provider_name && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-2">Provided by</h3>
              <p className="text-muted-foreground">{tour.provider_name}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Booking Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-2xl font-bold text-emerald-600">{formatPrice(tour.price_adult)}</span>
            <span className="text-muted-foreground text-sm">/adult</span>
            {tour.price_child && (
              <p className="text-sm text-muted-foreground">
                {formatPrice(tour.price_child)}/child
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-xl font-bold">{formatPrice(totalPrice)}</p>
          </div>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-lg">
              <CalendarIcon className="h-5 w-5 mr-2" />
              Book Now
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
            <SheetHeader>
              <SheetTitle>Book this tour</SheetTitle>
            </SheetHeader>
            <div className="space-y-6 mt-4 overflow-y-auto max-h-[calc(80vh-120px)]">
              {/* Date Selection */}
              <div>
                <h4 className="font-medium mb-2">Select Date</h4>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border"
                />
              </div>

              {/* Time Selection */}
              {tour.start_times && tour.start_times.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Select Time</h4>
                  <div className="flex gap-2 flex-wrap">
                    {tour.start_times.map(time => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        size="sm"
                        className={selectedTime === time ? 'bg-emerald-600' : ''}
                        onClick={() => setSelectedTime(time)}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Guest Count */}
              <div>
                <h4 className="font-medium mb-3">Number of Guests</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Adults</p>
                      <p className="text-sm text-muted-foreground">{formatPrice(tour.price_adult)}/person</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setAdults(Math.max(1, adults - 1))}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{adults}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setAdults(Math.min(tour.max_group_size, adults + 1))}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {tour.price_child && (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Children</p>
                        <p className="text-sm text-muted-foreground">{formatPrice(tour.price_child)}/person</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setChildren(Math.max(0, children - 1))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">{children}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setChildren(children + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Total & Book */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-lg">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-emerald-600">{formatPrice(totalPrice)}</span>
                </div>

                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 h-12"
                  onClick={handleBooking}
                  disabled={isBooking || !selectedDate || !selectedTime}
                >
                  {isBooking ? 'Processing...' : 'Confirm Booking'}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Free cancellation up to 24 hours before the tour
                </p>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
