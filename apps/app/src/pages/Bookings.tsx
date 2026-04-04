import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrderCard } from '@/components/food/OrderCard';
import { RideCard } from '@/components/rides/RideCard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

const Bookings = () => {
  const { user } = useAuth();

  // Fetch food orders
  const { data: foodOrders, refetch: refetchFoodOrders } = useQuery({
    queryKey: ['food-orders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('food_orders')
        .select(`
          *,
          restaurants (name)
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch ride bookings
  const { data: rideBookings, refetch: refetchRideBookings } = useQuery({
    queryKey: ['ride-bookings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ride_bookings')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Real-time subscription for food orders
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('food-orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'food_orders',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          refetchFoodOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetchFoodOrders]);

  // Real-time subscription for ride bookings
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('ride-bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ride_bookings',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          refetchRideBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetchRideBookings]);

  return (
    <Layout>
      <div className="container py-6">
        <h1 className="text-3xl font-bold mb-6">My Bookings</h1>

        <Tabs defaultValue="rides" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="rides">
              Rides {rideBookings && rideBookings.length > 0 && `(${rideBookings.length})`}
            </TabsTrigger>
            <TabsTrigger value="food">
              Food {foodOrders && foodOrders.length > 0 && `(${foodOrders.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rides" className="space-y-4">
            {!rideBookings || rideBookings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No ride bookings yet. Book a ride to get started!
              </div>
            ) : (
              <div className="space-y-4">
                {rideBookings.map((ride: any) => (
                  <RideCard
                    key={ride.id}
                    id={ride.id}
                    pickupLocation={ride.pickup_location}
                    dropoffLocation={ride.dropoff_location}
                    vehicleType={ride.vehicle_type}
                    passengerCount={ride.passenger_count}
                    price={Number(ride.price)}
                    status={ride.status}
                    createdAt={ride.created_at}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="food" className="space-y-4">
            {!foodOrders || foodOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No food orders yet
              </div>
            ) : (
              <div className="space-y-4">
                {foodOrders.map((order: any) => (
                  <OrderCard
                    key={order.id}
                    id={order.id}
                    restaurantName={order.restaurants?.name}
                    items={order.items}
                    totalPrice={Number(order.total_price)}
                    deliveryAddress={order.delivery_address}
                    status={order.status}
                    paymentMethod={order.payment_method}
                    createdAt={order.created_at}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Bookings;
