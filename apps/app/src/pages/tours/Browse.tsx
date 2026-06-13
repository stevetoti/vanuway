import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Clock, Users, MapPin, ChevronRight, Loader2,
  TreePalm, Waves, Mountain, Building, Camera, Compass,
} from 'lucide-react';

const categoryIcons: Record<string, { icon: typeof TreePalm; color: string; bg: string }> = {
  'City Tours': { icon: Building, color: 'text-blue-600', bg: 'bg-blue-100' },
  'Nature & Adventure': { icon: Mountain, color: 'text-green-600', bg: 'bg-green-100' },
  'Water Activities': { icon: Waves, color: 'text-cyan-600', bg: 'bg-cyan-100' },
  'Cultural': { icon: Camera, color: 'text-amber-600', bg: 'bg-amber-100' },
  'Beach & Relaxation': { icon: TreePalm, color: 'text-orange-600', bg: 'bg-orange-100' },
  'Combo Tours': { icon: Compass, color: 'text-purple-600', bg: 'bg-purple-100' },
  'Transfers': { icon: MapPin, color: 'text-gray-600', bg: 'bg-gray-100' },
};

export default function ToursBrowse() {
  const navigate = useNavigate();

  const { data: packages, isLoading } = useQuery({
    queryKey: ['tour-packages'],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('tour_packages' as unknown)
        .select('*') as unknown)
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('price_from', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const categories = [...new Set((packages || []).map((p: unknown) => p.category).filter(Boolean))];

  return (
    <Layout>
      <div className="container py-6 space-y-6 max-w-5xl">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Tour Packages</h1>
            <p className="text-sm text-muted-foreground">Explore the best of Vanuatu</p>
          </div>
        </div>

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Button variant="default" size="sm" className="flex-shrink-0">All Tours</Button>
          {categories.map((cat: string) => {
            const config = categoryIcons[cat] || categoryIcons['City Tours'];
            const Icon = config.icon;
            return (
              <Button key={cat} variant="outline" size="sm" className="flex-shrink-0 gap-1.5">
                <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                {cat}
              </Button>
            );
          })}
        </div>

        {/* Cruise banner */}
        <button
          className="w-full p-5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl text-white text-left flex items-center gap-4"
          onClick={() => navigate('/cruise/schedule')}
        >
          <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl flex-shrink-0">🚢</div>
          <div className="flex-1">
            <p className="font-bold text-lg">Cruise Ship Arriving?</p>
            <p className="text-white/80 text-sm">Check the schedule and pre-book your tour before you dock</p>
          </div>
          <ChevronRight className="h-5 w-5 flex-shrink-0" />
        </button>

        {/* Packages */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
            <p className="text-muted-foreground">Loading tours...</p>
          </div>
        ) : !packages || packages.length === 0 ? (
          <Card className="p-12 text-center">
            <TreePalm className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-lg font-medium">No tours available yet</p>
            <p className="text-sm text-muted-foreground">Tour packages coming soon!</p>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {packages.map((pkg: unknown) => {
              const config = categoryIcons[pkg.category] || categoryIcons['City Tours'];
              const Icon = config.icon;

              return (
                <Card key={pkg.id} className="overflow-hidden hover:shadow-lg transition-all">
                  <div className={`h-36 ${config.bg} flex items-center justify-center relative`}>
                    <Icon className={`h-16 w-16 ${config.color} opacity-20`} />
                    {pkg.is_featured && (
                      <Badge className="absolute top-3 left-3 bg-amber-500 text-white">Featured</Badge>
                    )}
                    <Badge className="absolute top-3 right-3 bg-white/90 text-gray-900 shadow-sm">
                      <Clock className="h-3 w-3 mr-1" />
                      {pkg.duration_hours}h
                    </Badge>
                  </div>

                  <div className="p-4">
                    <Badge variant="outline" className={`text-[10px] mb-1.5 ${config.color}`}>{pkg.category}</Badge>
                    <h3 className="font-bold text-base mb-1">{pkg.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{pkg.short_description}</p>

                    {pkg.highlights && pkg.highlights.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {pkg.highlights.slice(0, 3).map((h: string, i: number) => (
                          <span key={i} className="text-[10px] bg-gray-100 px-2 py-0.5 rounded">📍 {h}</span>
                        ))}
                      </div>
                    )}

                    {pkg.inclusions && pkg.inclusions.length > 0 && (
                      <p className="text-[11px] text-muted-foreground mb-3">
                        {pkg.inclusions.slice(0, 3).map((inc: string, i: number) => (
                          <span key={i}>✓ {inc}{i < Math.min(pkg.inclusions.length, 3) - 1 ? ' · ' : ''}</span>
                        ))}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t">
                      <div>
                        <span className="text-xs text-muted-foreground">From</span>
                        <span className="text-lg font-bold ml-1">VUV {Number(pkg.price_from).toLocaleString()}</span>
                      </div>
                      <Button size="sm" onClick={() => navigate('/drivers?category=tour')}>
                        Find a Driver
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
