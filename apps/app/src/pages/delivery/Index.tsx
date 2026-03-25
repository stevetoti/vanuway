import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft, Package, Truck, MapPin, Clock, Search, 
  Plus, ChevronRight, Box, ShieldCheck, Timer, Bike
} from 'lucide-react';

const deliveryServices = [
  {
    id: 'parcel',
    title: 'Send a Parcel',
    description: 'Door-to-door parcel delivery across Port Vila',
    icon: Package,
    color: 'bg-blue-500',
    eta: '1-3 hours',
  },
  {
    id: 'express',
    title: 'Express Delivery',
    description: 'Urgent same-day delivery service',
    icon: Timer,
    color: 'bg-orange-500',
    eta: '30-60 min',
  },
  {
    id: 'bulk',
    title: 'Bulk Delivery',
    description: 'Large items and multiple packages',
    icon: Box,
    color: 'bg-green-500',
    eta: '2-5 hours',
  },
  {
    id: 'inter-island',
    title: 'Inter-Island',
    description: 'Send packages between islands',
    icon: Truck,
    color: 'bg-purple-500',
    eta: '1-3 days',
  },
];

const recentDeliveries = [
  { id: '1', from: 'Port Vila Market', to: 'Tassiriki', status: 'delivered', date: 'Yesterday' },
  { id: '2', from: 'Nambatu', to: 'Freshwota', status: 'in_transit', date: 'Today' },
];

const statusColors: Record<string, string> = {
  delivered: 'bg-green-100 text-green-700',
  in_transit: 'bg-blue-100 text-blue-700',
  pending: 'bg-yellow-100 text-yellow-700',
};

export default function DeliveryIndex() {
  const navigate = useNavigate();
  const [trackingNumber, setTrackingNumber] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 text-white">
        <div className="px-4 pt-4 pb-6">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold">Delivery</h1>
            <div className="w-10" />
          </div>

          <div className="text-center mb-6">
            <Truck className="h-12 w-12 mx-auto mb-2" />
            <h2 className="text-2xl font-bold">Send & Receive</h2>
            <p className="text-white/80 text-sm">Fast, reliable delivery across Vanuatu</p>
          </div>

          {/* Track Package */}
          <Card className="bg-white/95 backdrop-blur shadow-xl">
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-2 font-medium">Track a Package</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Enter tracking number..."
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 h-11">Track</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delivery Services */}
      <div className="px-4 py-6">
        <h3 className="font-semibold text-lg mb-4">Delivery Services</h3>
        <div className="grid grid-cols-2 gap-3">
          {deliveryServices.map(service => {
            const Icon = service.icon;
            return (
              <Card
                key={service.id}
                className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5"
                onClick={() => navigate('/delivery/request')}
              >
                <CardContent className="p-4">
                  <div className={`h-12 w-12 ${service.color} rounded-xl flex items-center justify-center text-white mb-3`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h4 className="font-semibold text-sm">{service.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{service.description}</p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{service.eta}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Deliveries */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Recent Deliveries</h3>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="space-y-3">
          {recentDeliveries.map(delivery => (
            <Card key={delivery.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-3.5 w-3.5 text-green-500" />
                      <span>{delivery.from}</span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      <MapPin className="h-3.5 w-3.5 text-red-500" />
                      <span>{delivery.to}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{delivery.date}</p>
                  </div>
                  <Badge className={statusColors[delivery.status]}>
                    {delivery.status === 'in_transit' ? 'In Transit' : 'Delivered'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Become a Driver CTA */}
      <div className="px-4 py-4">
        <Card className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-lg">Become a Delivery Driver</h4>
              <p className="text-white/80 text-sm mt-1">Earn money delivering packages across Vanuatu</p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-sm">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Flexible hours</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <Bike className="h-4 w-4" />
                  <span>Use your vehicle</span>
                </div>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="bg-white text-blue-600 hover:bg-gray-100"
              onClick={() => navigate('/driver/register')}
            >
              Apply Now
            </Button>
          </div>
        </Card>
      </div>

      {/* Send Package FAB */}
      <div className="fixed bottom-20 right-4">
        <Button
          size="lg"
          className="h-14 px-6 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 gap-2"
          onClick={() => navigate('/delivery/request')}
        >
          <Plus className="h-5 w-5" />
          Send Package
        </Button>
      </div>
    </div>
  );
}
