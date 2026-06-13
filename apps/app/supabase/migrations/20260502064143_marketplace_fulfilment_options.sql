ALTER TABLE public.marketplace_orders
  ADD COLUMN IF NOT EXISTS fulfilment_method text NOT NULL DEFAULT 'delivery',
  ADD COLUMN IF NOT EXISTS pickup_location text,
  ADD COLUMN IF NOT EXISTS delivery_route_booking_id uuid REFERENCES public.ride_bookings(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'marketplace_orders_fulfilment_method_check'
  ) THEN
    ALTER TABLE public.marketplace_orders
      ADD CONSTRAINT marketplace_orders_fulfilment_method_check
      CHECK (fulfilment_method IN ('delivery', 'pickup'));
  END IF;
END $$;

COMMENT ON COLUMN public.marketplace_orders.fulfilment_method IS
  'How the buyer wants to receive physical marketplace items: delivery or pickup.';
COMMENT ON COLUMN public.marketplace_orders.pickup_location IS
  'Pickup location shown when fulfilment_method is pickup.';
COMMENT ON COLUMN public.marketplace_orders.delivery_route_booking_id IS
  'Optional linked VanuRide delivery booking for courier fulfilment.';

ALTER TABLE public.shop_orders
  ADD COLUMN IF NOT EXISTS delivery_route_booking_id uuid REFERENCES public.ride_bookings(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.shop_orders.delivery_route_booking_id IS
  'Optional linked VanuRide delivery booking for courier fulfilment.';
