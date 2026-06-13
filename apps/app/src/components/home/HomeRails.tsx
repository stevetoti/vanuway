import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChevronRight, Star, MapPin, ShoppingBag, Car, Wrench, Compass, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * Returns the set of vendor IDs (per kind) that are featured today via an
 * active advertising subscription. Cached for 5 minutes.
 */
function useFeaturedToday(kind: string) {
  return useQuery({
    queryKey: ['featured-today', kind],
    queryFn: async () => {
      const { data } = await (supabase as unknown)
        .from('featured_today_v')
        .select('user_id, vendor_id')
        .eq('vendor_kind', kind);
      const ids = new Set<string>();
      (data || []).forEach((r: unknown) => {
        if (r.vendor_id) ids.add(r.vendor_id);
        if (r.user_id) ids.add(r.user_id);
      });
      return ids;
    },
    staleTime: 5 * 60 * 1000,
  });
}

interface RailProps {
  title: string;
  viewAllPath: string;
  emptyHint?: string;
  children: React.ReactNode;
}

function Rail({ title, viewAllPath, emptyHint, children }: RailProps) {
  const navigate = useNavigate();
  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</h2>
        <button className="text-xs text-primary font-medium flex items-center gap-0.5" onClick={() => navigate(viewAllPath)}>
          View all <ChevronRight className="h-3 w-3" />
        </button>
      </div>
      {/* horizontally scrolling row */}
      <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1 snap-x snap-mandatory scrollbar-hide">
        {children}
      </div>
      {emptyHint && (
        <p className="text-[10px] text-muted-foreground text-center hidden first:block">{emptyHint}</p>
      )}
    </div>
  );
}

const fmt = (n: number | null | undefined) => `VUV ${Number(n || 0).toLocaleString()}`;

export function FeaturedProductsRail() {
  const navigate = useNavigate();
  const featured = useFeaturedToday('marketplace_seller');
  const { data: products } = useQuery({
    queryKey: ['home-featured-products'],
    queryFn: async () => {
      const { data, error } = await (supabase as unknown)
        .from('marketplace_listings')
        .select('id, title, price, images, category, island, user_id')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(12);
      if (error) throw error;
      return data || [];
    },
  });

  if (!products || products.length === 0) return null;
  // Featured (paid) sellers first.
  const featuredIds = featured.data || new Set<string>();
  const sorted = [...products].sort((a: unknown, b: unknown) => {
    const af = featuredIds.has(a.user_id) ? 1 : 0;
    const bf = featuredIds.has(b.user_id) ? 1 : 0;
    return bf - af;
  });

  return (
    <Rail title="Marketplace" viewAllPath="/marketplace">
      {sorted.map((p: unknown) => (
        <button
          key={p.id}
          onClick={() => navigate(`/marketplace/${p.id}`)}
          className="flex-shrink-0 w-36 snap-start bg-white rounded-xl border overflow-hidden text-left active:scale-95 transition-transform"
        >
          <div className="h-24 bg-gradient-to-br from-purple-100 to-purple-200 relative">
            {p.images?.[0] ? (
              <img src={p.images[0]} alt={p.title} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <ShoppingBag className="h-7 w-7 text-purple-300" />
              </div>
            )}
            {featuredIds.has(p.user_id) && (
              <Badge className="absolute top-1 left-1 bg-orange-500 text-[8px] h-4 px-1 gap-0.5"><Sparkles className="h-2.5 w-2.5" />Featured</Badge>
            )}
          </div>
          <div className="p-2">
            <p className="text-[11px] font-medium line-clamp-2 leading-tight">{p.title}</p>
            <p className="text-xs font-bold text-purple-600 mt-1">{fmt(p.price)}</p>
            {p.island && (
              <p className="text-[9px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                <MapPin className="h-2.5 w-2.5" />{p.island}
              </p>
            )}
          </div>
        </button>
      ))}
    </Rail>
  );
}

// Minimum approved drivers before the home rail renders. Below this it looks
// thin/empty so we hide it until we have a real bench to recommend from.
const MIN_DRIVERS_FOR_RAIL = 6;

export function RecommendedDriversRail() {
  const navigate = useNavigate();
  const { data: drivers } = useQuery({
    queryKey: ['home-recommended-drivers'],
    queryFn: async () => {
      const { data, error } = await (supabase as unknown)
        .from('drivers')
        .select('id, user_id, first_name, last_name, vehicle_type, vehicle_model, rating, total_rides, profile_photo_url')
        .eq('application_status', 'approved')
        .eq('is_available', true)
        .order('rating', { ascending: false, nullsFirst: false })
        .order('total_rides', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
  });

  if (!drivers || drivers.length < MIN_DRIVERS_FOR_RAIL) return null;

  return (
    <Rail title="Recommended drivers" viewAllPath="/drivers">
      {drivers.map((d: unknown) => (
        <button
          key={d.id}
          onClick={() => navigate(`/drivers/${d.id}`)}
          className="flex-shrink-0 w-36 snap-start bg-white rounded-xl border overflow-hidden text-left active:scale-95 transition-transform"
        >
          <div className="h-24 bg-gradient-to-br from-orange-100 to-amber-200 relative">
            {d.profile_photo_url ? (
              <img src={d.profile_photo_url} alt={d.first_name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <Car className="h-7 w-7 text-orange-300" />
              </div>
            )}
          </div>
          <div className="p-2">
            <p className="text-[11px] font-medium truncate">{d.first_name} {d.last_name?.[0] || ''}.</p>
            <p className="text-[10px] text-muted-foreground truncate">{d.vehicle_model || d.vehicle_type}</p>
            <div className="flex items-center gap-1 mt-1">
              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
              <span className="text-[10px] font-semibold">{d.rating ? Number(d.rating).toFixed(1) : 'New'}</span>
              <span className="text-[9px] text-muted-foreground">·{d.total_rides || 0} rides</span>
            </div>
          </div>
        </button>
      ))}
    </Rail>
  );
}

export function RecommendedServicesRail() {
  const navigate = useNavigate();
  const { data: services } = useQuery({
    queryKey: ['home-recommended-services'],
    queryFn: async () => {
      const { data, error } = await (supabase as unknown)
        .from('service_providers')
        .select('id, business_name, profile_photo_url, services_offered, island')
        .eq('verification_status', 'verified')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
  });

  if (!services || services.length === 0) return null;

  return (
    <Rail title="Recommended services" viewAllPath="/providers">
      {services.map((s: unknown) => (
        <button
          key={s.id}
          onClick={() => navigate(`/providers/${s.id}`)}
          className="flex-shrink-0 w-36 snap-start bg-white rounded-xl border overflow-hidden text-left active:scale-95 transition-transform"
        >
          <div className="h-24 bg-gradient-to-br from-slate-100 to-slate-200 relative">
            {s.profile_photo_url ? (
              <img src={s.profile_photo_url} alt={s.business_name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <Wrench className="h-7 w-7 text-slate-300" />
              </div>
            )}
          </div>
          <div className="p-2">
            <p className="text-[11px] font-medium truncate">{s.business_name}</p>
            <p className="text-[10px] text-muted-foreground truncate">
              {Array.isArray(s.services_offered) ? s.services_offered.slice(0, 2).join(', ') : 'Services'}
            </p>
            {s.island && (
              <p className="text-[9px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                <MapPin className="h-2.5 w-2.5" />{s.island}
              </p>
            )}
          </div>
        </button>
      ))}
    </Rail>
  );
}

export function RecommendedToursRail() {
  const navigate = useNavigate();
  const { data: tours } = useQuery({
    queryKey: ['home-recommended-tours'],
    queryFn: async () => {
      const { data, error } = await (supabase as unknown)
        .from('tours')
        .select('id, name, price_adult, image_url, location, duration_hours, category')
        .eq('approval_status', 'approved')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
  });

  if (!tours || tours.length === 0) return null;

  return (
    <Rail title="Recommended tours" viewAllPath="/tours">
      {tours.map((t: unknown) => (
        <button
          key={t.id}
          onClick={() => navigate(`/tours/${t.id}`)}
          className="flex-shrink-0 w-36 snap-start bg-white rounded-xl border overflow-hidden text-left active:scale-95 transition-transform"
        >
          <div className="h-24 bg-gradient-to-br from-amber-100 to-orange-200 relative">
            {t.image_url ? (
              <img src={t.image_url} alt={t.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <Compass className="h-7 w-7 text-amber-300" />
              </div>
            )}
          </div>
          <div className="p-2">
            <p className="text-[11px] font-medium line-clamp-2 leading-tight">{t.name}</p>
            <p className="text-xs font-bold text-amber-600 mt-1">{fmt(t.price_adult)}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">{t.duration_hours}h · {t.location || 'Vanuatu'}</p>
          </div>
        </button>
      ))}
    </Rail>
  );
}
