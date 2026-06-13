import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Plane, Loader2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const fmtMoney = (n: unknown, currency = 'VUV') => `${currency.toUpperCase()} ${Number(n || 0).toLocaleString()}`;

const STATUS_BADGE: Record<string, { label: string; className: string; icon: unknown }> = {
  searching: { label: 'Searching', className: 'bg-gray-400', icon: Clock },
  offered: { label: 'Offer reserved', className: 'bg-amber-500', icon: Clock },
  paying: { label: 'Awaiting payment', className: 'bg-amber-500', icon: Clock },
  confirmed: { label: 'Ticket issued', className: 'bg-green-600', icon: CheckCircle2 },
  failed: { label: 'Failed', className: 'bg-red-500', icon: AlertCircle },
  cancelled: { label: 'Cancelled', className: 'bg-gray-400', icon: AlertCircle },
};

export default function FlightOrderDetails() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const [params] = useSearchParams();
  const justPaid = params.get('payment') === 'success';

  const { data: order, isLoading } = useQuery({
    queryKey: ['flight-order', orderId],
    queryFn: async () => {
      const { data, error } = await (supabase as unknown)
        .from('flight_orders')
        .select('*')
        .eq('id', orderId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
    refetchInterval: (query) => {
      // Poll while payment is being captured + Duffel is ticketing
      const order = query.state.data as unknown;
      return order?.status === 'paying' || (justPaid && order?.status !== 'confirmed' && order?.status !== 'failed') ? 3000 : false;
    },
  });

  if (isLoading) {
    return <Layout><div className="container py-12 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div></Layout>;
  }
  if (!order) {
    return <Layout><div className="container py-12 text-center"><p>Order not found.</p></div></Layout>;
  }

  const status = STATUS_BADGE[order.status] || STATUS_BADGE.searching;
  const StatusIcon = status.icon;

  return (
    <Layout>
      <div className="container py-6 max-w-2xl space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/flights')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Flights
        </Button>

        {order.status === 'confirmed' && (
          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-bold text-green-900">Ticket issued!</p>
                {order.pnr && <p className="text-sm text-green-800">Booking reference: <span className="font-mono font-bold">{order.pnr}</span></p>}
              </div>
            </div>
          </Card>
        )}

        {order.status === 'paying' && (
          <Card className="p-4 bg-amber-50 border-amber-200">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 text-amber-600 animate-spin" />
              <div>
                <p className="font-bold text-amber-900">Issuing your ticket…</p>
                <p className="text-xs text-amber-800">Payment captured. We're contacting the airline to issue your ticket — usually under a minute.</p>
              </div>
            </div>
          </Card>
        )}

        {order.status === 'failed' && (
          <Card className="p-4 bg-red-50 border-red-200">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <div>
                <p className="font-bold text-red-900">Booking failed</p>
                <p className="text-xs text-red-800">{order.failure_reason || 'Airline rejected the booking. Your card has not been charged, or a refund is on its way.'}</p>
              </div>
            </div>
          </Card>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Plane className="h-5 w-5 text-blue-600" />
              {order.origin_iata} → {order.destination_iata}
            </h1>
            <p className="text-xs text-muted-foreground">{new Date(order.departure_date).toLocaleDateString()}{order.return_date ? ` · returns ${new Date(order.return_date).toLocaleDateString()}` : ''}</p>
          </div>
          <Badge className={status.className}><StatusIcon className="h-3 w-3 mr-1" />{status.label}</Badge>
        </div>

        <Card className="p-4 space-y-2">
          <h2 className="font-bold text-sm uppercase tracking-wide text-muted-foreground">Flight</h2>
          <p className="text-sm">{order.airline_name || order.airline_iata}</p>
          <p className="text-sm">Cabin: <span className="capitalize">{order.cabin_class?.replace(/_/g, ' ')}</span></p>
          <p className="text-sm">Passengers: {order.passenger_count}</p>
          <div className="pt-2 border-t flex items-center justify-between">
            <span className="text-sm">Total paid</span>
            <span className="font-bold text-blue-600">{fmtMoney(order.total_amount_vuv, order.total_currency || 'VUV')}</span>
          </div>
        </Card>

        {Array.isArray(order.passengers) && order.passengers.length > 0 && (
          <Card className="p-4 space-y-2">
            <h2 className="font-bold text-sm uppercase tracking-wide text-muted-foreground">Passengers</h2>
            {order.passengers.map((p: unknown, i: number) => (
              <p key={i} className="text-sm">
                {p.title?.toUpperCase()}. {p.given_name} {p.family_name} <span className="text-xs text-muted-foreground">· {p.born_on}</span>
              </p>
            ))}
          </Card>
        )}

        {order.ticket_numbers && order.ticket_numbers.length > 0 && (
          <Card className="p-4 space-y-1">
            <h2 className="font-bold text-sm uppercase tracking-wide text-muted-foreground">Ticket numbers</h2>
            {order.ticket_numbers.map((t: string) => (
              <p key={t} className="font-mono text-sm">{t}</p>
            ))}
          </Card>
        )}
      </div>
    </Layout>
  );
}
