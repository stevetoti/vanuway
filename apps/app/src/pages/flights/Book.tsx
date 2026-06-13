import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  ArrowLeft, Plane, Search, Loader2, Lock, Users, ArrowRightLeft,
  Calendar as CalIcon, Plus, Minus, X, Clock, ChevronDown,
} from 'lucide-react';
import { AirportPicker } from '@/components/flights/AirportPicker';

type TripType = 'one_way' | 'round_trip' | 'multi_city';
type SortKey = 'best' | 'cheapest' | 'fastest';
type CabinClass = 'economy' | 'premium_economy' | 'business' | 'first';

interface SliceInput {
  origin: string;
  destination: string;
  departureDate: string;
}

interface Segment {
  departing_at: string;
  arriving_at: string;
  flight_number: string;
  duration: string;
  origin: { iata_code: string; name?: string; city_name?: string };
  destination: { iata_code: string; name?: string; city_name?: string };
  marketing_carrier: { iata_code: string; name: string; logo_symbol_url?: string };
  aircraft?: string;
  passengers?: Array<{ cabin_class?: string; cabin_class_marketing_name?: string; baggages?: Array<{ type: string; quantity: number }> }>;
}

interface Slice {
  origin: { iata_code: string; name?: string; city_name?: string };
  destination: { iata_code: string; name?: string; city_name?: string };
  duration: string;
  segments: Segment[];
}

interface Offer {
  id: string;
  total_amount: string;
  total_currency: string;
  base_amount: string;
  tax_amount: string;
  total_emissions_kg?: string;
  conditions?: { refund_before_departure?: { allowed: boolean }; change_before_departure?: { allowed: boolean } };
  owner: { iata_code: string; name: string; logo_symbol_url?: string };
  slices: Slice[];
}

interface Passenger {
  type: 'adult' | 'child' | 'infant_without_seat';
  given_name: string;
  family_name: string;
  born_on: string;
  gender: 'm' | 'f';
  title: 'mr' | 'mrs' | 'ms' | 'miss' | 'dr';
}

const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
const fmtMoney = (amount: string, currency: string) => `${currency.toUpperCase()} ${Number(amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const isoToMin = (iso: string): number => {
  const m = /^P(?:T)?(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/.exec(iso || '');
  if (!m) return 0;
  return (Number(m[1] || 0) * 1440) + (Number(m[2] || 0) * 60) + Number(m[3] || 0);
};
const fmtMin = (mins: number) => {
  if (!mins) return '';
  const h = Math.floor(mins / 60); const m = mins % 60;
  return `${h ? `${h}h ` : ''}${m ? `${m}m` : ''}`.trim();
};
const sliceMins = (s: Slice) => isoToMin(s.duration);
const offerTotalMins = (o: Offer) => o.slices.reduce((sum, s) => sum + sliceMins(s), 0);
const offerStops = (o: Offer) => Math.max(...o.slices.map(s => Math.max(0, s.segments.length - 1)));

const todayPlus = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

export default function FlightBook() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Trip + passengers
  const [tripType, setTripType] = useState<TripType>('round_trip');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [cabinClass, setCabinClass] = useState<CabinClass>('economy');
  const [paxOpenState, setPaxOpenState] = useState(false);

  // Slices: round_trip uses two slices auto-built from one origin/destination/dates
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [multiSlices, setMultiSlices] = useState<SliceInput[]>([
    { origin: '', destination: '', departureDate: '' },
    { origin: '', destination: '', departureDate: '' },
  ]);

  // Search state
  const [searching, setSearching] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [sort, setSort] = useState<SortKey>('best');
  const [maxStops, setMaxStops] = useState<0 | 1 | 2 | null>(null);

  // Booking state
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [booking, setBooking] = useState(false);

  const totalPax = adults + children + infants;
  const cabinLabel = cabinClass.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
  const cabinShort = cabinClass === 'premium_economy' ? 'Prem economy' : cabinLabel;

  const swapOriginDestination = () => {
    const o = origin; setOrigin(destination); setDestination(o);
  };

  const updateMultiSlice = (idx: number, patch: Partial<SliceInput>) => {
    setMultiSlices(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s));
  };
  const addSlice = () => setMultiSlices(prev => [...prev, { origin: '', destination: '', departureDate: '' }]);
  const removeSlice = (idx: number) => setMultiSlices(prev => prev.filter((_, i) => i !== idx));

  const startSearch = async () => {
    const payload: {
      adults: number; children: number; infants: number; cabinClass: CabinClass;
      slices?: SliceInput[]; origin?: string; destination?: string; departureDate?: string; returnDate?: string;
    } = { adults, children, infants, cabinClass };
    if (tripType === 'multi_city') {
      const cleaned = multiSlices.filter(s => s.origin && s.destination && s.departureDate);
      if (cleaned.length < 2) {
        toast.error('Multi-city needs at least 2 valid legs (from, to, date)'); return;
      }
      payload.slices = cleaned;
    } else {
      if (!origin || !destination || !departureDate) {
        toast.error('From, To and Departure date are required'); return;
      }
      payload.origin = origin;
      payload.destination = destination;
      payload.departureDate = departureDate;
      if (tripType === 'round_trip') {
        if (!returnDate) { toast.error('Return date required for round trips'); return; }
        payload.returnDate = returnDate;
      }
    }
    setSearching(true);
    setOffers([]);
    setSelectedOffer(null);
    try {
      const { data, error } = await supabase.functions.invoke('duffel-flight-search', { body: payload });
      if (error) throw error;
      if (data?.error) { toast.error(`${data.error}${data.hint ? `. ${data.hint}` : ''}`, { duration: 8000 }); return; }
      const list: Offer[] = data?.offers || [];
      if (list.length === 0) toast.info('No flights found for those dates');
      setOffers(list);
    } catch (e: unknown) {
      toast.error(e.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  // Sort + filter offers
  const visibleOffers = useMemo(() => {
    let list = offers.slice();
    if (maxStops !== null) list = list.filter(o => offerStops(o) <= maxStops);
    if (sort === 'cheapest') list.sort((a, b) => Number(a.total_amount) - Number(b.total_amount));
    else if (sort === 'fastest') list.sort((a, b) => offerTotalMins(a) - offerTotalMins(b));
    else list.sort((a, b) => {
      // "Best" = price-weighted, with stop penalty
      const score = (o: Offer) => Number(o.total_amount) + offerStops(o) * 30 + offerTotalMins(o) * 0.05;
      return score(a) - score(b);
    });
    return list;
  }, [offers, sort, maxStops]);

  const cheapest = useMemo(() => offers.length ? offers.reduce((a, b) => Number(a.total_amount) < Number(b.total_amount) ? a : b) : null, [offers]);

  const pickOffer = (offer: Offer) => {
    setSelectedOffer(offer);
    const fresh: Passenger[] = [];
    for (let i = 0; i < adults; i++) fresh.push({ type: 'adult', given_name: '', family_name: '', born_on: '', gender: 'm', title: 'mr' });
    for (let i = 0; i < children; i++) fresh.push({ type: 'child', given_name: '', family_name: '', born_on: '', gender: 'm', title: 'mr' });
    for (let i = 0; i < infants; i++) fresh.push({ type: 'infant_without_seat', given_name: '', family_name: '', born_on: '', gender: 'm', title: 'mr' });
    setPassengers(fresh);
    setContactEmail(user?.email || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updatePax = (idx: number, patch: Partial<Passenger>) => {
    setPassengers(prev => prev.map((p, i) => i === idx ? { ...p, ...patch } : p));
  };

  const confirmBooking = async () => {
    if (!user) { toast.error('Please sign in to book'); navigate('/login'); return; }
    if (!selectedOffer) return;
    for (const [i, p] of passengers.entries()) {
      if (!p.given_name || !p.family_name || !p.born_on) {
        toast.error(`Passenger ${i + 1}: name and date of birth required`); return;
      }
    }
    if (!contactEmail || !contactPhone) { toast.error('Contact email and phone are required'); return; }
    setBooking(true);
    try {
      const { data, error } = await supabase.functions.invoke('duffel-flight-book', {
        body: { offerId: selectedOffer.id, passengers, contactEmail, contactPhone, returnUrl: window.location.origin },
      });
      if (error) throw error;
      if (data?.error) { toast.error(`${data.error}${data.hint ? `. ${data.hint}` : ''}`, { duration: 8000 }); return; }
      if (!data?.url) throw new Error('No checkout URL');
      window.location.href = data.url;
    } catch (e: unknown) {
      toast.error(e.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  // ============ UI ============
  return (
    <Layout>
      <div className="bg-gradient-to-b from-blue-700 via-blue-600 to-blue-500 pt-4 pb-8 -mt-4">
        <div className="container max-w-5xl">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-white hover:bg-white/10 mb-3">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="text-white mb-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Plane className="h-5 w-5" />
                  <span className="text-xs font-medium uppercase tracking-wide opacity-90">VanuWay Flights</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold">Search worldwide flights</h1>
                <p className="text-sm opacity-90 mt-0.5">Real fares from <span className="font-semibold">300+ airlines</span> · book in seconds</p>
              </div>
              <button
                onClick={() => navigate('/flights/arrivals')}
                className="hidden sm:flex shrink-0 items-center gap-1.5 px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-medium transition-colors"
              >
                Today's arrivals →
              </button>
            </div>
            <button
              onClick={() => navigate('/flights/arrivals')}
              className="sm:hidden mt-2 inline-flex items-center gap-1.5 text-xs underline opacity-90"
            >
              View today's arrivals at VLI / SON →
            </button>
          </div>

          {/* Trip type tabs */}
          <Tabs value={tripType} onValueChange={(v) => setTripType(v as TripType)}>
            <TabsList className="bg-white/15 text-white border-0">
              <TabsTrigger value="round_trip" className="data-[state=active]:bg-white data-[state=active]:text-blue-700">Round trip</TabsTrigger>
              <TabsTrigger value="one_way" className="data-[state=active]:bg-white data-[state=active]:text-blue-700">One way</TabsTrigger>
              <TabsTrigger value="multi_city" className="data-[state=active]:bg-white data-[state=active]:text-blue-700">Multi-city</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Search card */}
      <div className="container max-w-5xl -mt-6 pb-4">
        <Card className="p-4 sm:p-5 shadow-xl border-0 ring-1 ring-blue-100">
          {tripType !== 'multi_city' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-2 md:gap-3 md:items-end">
                <div>
                  <Label htmlFor="origin" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">From</Label>
                  <AirportPicker id="origin" value={origin} onChange={setOrigin} placeholder="City or airport" />
                </div>
                <div className="hidden md:flex justify-center pb-1.5">
                  <Button type="button" variant="outline" size="icon" className="rounded-full h-9 w-9 border-blue-200" onClick={swapOriginDestination} aria-label="Swap origin and destination">
                    <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                  </Button>
                </div>
                <div>
                  <Label htmlFor="destination" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">To</Label>
                  <AirportPicker id="destination" value={destination} onChange={setDestination} placeholder="City or airport" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_1fr] gap-2 md:gap-3">
                <div>
                  <Label htmlFor="dep" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1"><CalIcon className="h-3 w-3" />Departure</Label>
                  <Input id="dep" type="date" min={todayPlus(0)} value={departureDate} onChange={e => setDepartureDate(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="ret" className={`text-xs font-semibold uppercase tracking-wide flex items-center gap-1 ${tripType === 'round_trip' ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
                    <CalIcon className="h-3 w-3" />Return
                  </Label>
                  <Input id="ret" type="date" min={departureDate || todayPlus(0)} value={returnDate} onChange={e => setReturnDate(e.target.value)} disabled={tripType === 'one_way'} />
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" />Travellers</Label>
                  <Popover open={paxOpenState} onOpenChange={setPaxOpenState}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between font-normal">
                        <span>{totalPax} {totalPax === 1 ? 'traveller' : 'travellers'}</span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72" align="start">
                      <div className="space-y-3">
                        <PaxRow label="Adults" hint="12+" value={adults} onDec={() => setAdults(Math.max(1, adults - 1))} onInc={() => setAdults(Math.min(9, adults + 1))} minDisabled={adults <= 1} />
                        <PaxRow label="Children" hint="2–11" value={children} onDec={() => setChildren(Math.max(0, children - 1))} onInc={() => setChildren(Math.min(8, children + 1))} minDisabled={children <= 0} />
                        <PaxRow label="Infants" hint="<2 (on lap)" value={infants} onDec={() => setInfants(Math.max(0, infants - 1))} onInc={() => setInfants(Math.min(adults, infants + 1))} minDisabled={infants <= 0} />
                        <p className="text-xs text-muted-foreground">Infants must travel with at least one adult.</p>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cabin</Label>
                  <Select value={cabinClass} onValueChange={(v) => setCabinClass(v as CabinClass)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="economy">Economy</SelectItem>
                      <SelectItem value="premium_economy">Premium economy</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="first">First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {multiSlices.map((s, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-2 md:gap-3 md:items-end">
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Leg {idx + 1} — From</Label>
                    <AirportPicker value={s.origin} onChange={(v) => updateMultiSlice(idx, { origin: v })} placeholder="City or airport" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">To</Label>
                    <AirportPicker value={s.destination} onChange={(v) => updateMultiSlice(idx, { destination: v })} placeholder="City or airport" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Departure</Label>
                    <Input type="date" min={todayPlus(0)} value={s.departureDate} onChange={(e) => updateMultiSlice(idx, { departureDate: e.target.value })} />
                  </div>
                  {multiSlices.length > 2 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeSlice(idx)} aria-label="Remove leg" className="text-red-500 hover:text-red-600">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <div className="flex flex-wrap gap-3 items-center">
                <Button type="button" variant="outline" size="sm" onClick={addSlice} disabled={multiSlices.length >= 6}>
                  <Plus className="h-3 w-3 mr-1" />Add another leg
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-2">
                  <Label className="text-xs uppercase font-semibold text-muted-foreground">Travellers</Label>
                  <Popover open={paxOpenState} onOpenChange={setPaxOpenState}>
                    <PopoverTrigger asChild><Button variant="outline" size="sm" className="font-normal">{totalPax}</Button></PopoverTrigger>
                    <PopoverContent className="w-72">
                      <div className="space-y-3">
                        <PaxRow label="Adults" hint="12+" value={adults} onDec={() => setAdults(Math.max(1, adults - 1))} onInc={() => setAdults(Math.min(9, adults + 1))} minDisabled={adults <= 1} />
                        <PaxRow label="Children" hint="2–11" value={children} onDec={() => setChildren(Math.max(0, children - 1))} onInc={() => setChildren(Math.min(8, children + 1))} minDisabled={children <= 0} />
                        <PaxRow label="Infants" hint="<2 (on lap)" value={infants} onDec={() => setInfants(Math.max(0, infants - 1))} onInc={() => setInfants(Math.min(adults, infants + 1))} minDisabled={infants <= 0} />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs uppercase font-semibold text-muted-foreground">Cabin</Label>
                  <Select value={cabinClass} onValueChange={(v) => setCabinClass(v as CabinClass)}>
                    <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="economy">Economy</SelectItem>
                      <SelectItem value="premium_economy">Premium economy</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="first">First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <Button className="w-full mt-4 h-12 text-base font-semibold bg-orange-500 hover:bg-orange-600" onClick={startSearch} disabled={searching}>
            {searching ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Finding the best fares…</> : <><Search className="h-4 w-4 mr-2" />Search flights</>}
          </Button>
        </Card>
      </div>

      {/* Results / detail */}
      <div className="container max-w-5xl pb-12 space-y-4">
        {!selectedOffer && offers.length > 0 && (
          <>
            {/* Sort + filters */}
            <Card className="p-3">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm font-medium mr-1">Sort:</span>
                <Tabs value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                  <TabsList>
                    <TabsTrigger value="best">Best</TabsTrigger>
                    <TabsTrigger value="cheapest">
                      Cheapest
                      {cheapest && <span className="ml-1.5 text-[10px] text-muted-foreground">{fmtMoney(cheapest.total_amount, cheapest.total_currency)}</span>}
                    </TabsTrigger>
                    <TabsTrigger value="fastest">Fastest</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Separator orientation="vertical" className="h-6 mx-1" />
                <span className="text-sm font-medium">Stops:</span>
                {([
                  { v: null as null, label: 'Any' },
                  { v: 0 as const, label: 'Direct' },
                  { v: 1 as const, label: '1 stop' },
                  { v: 2 as const, label: '2+' },
                ]).map(opt => (
                  <Button
                    key={String(opt.v)}
                    type="button"
                    size="sm"
                    variant={maxStops === opt.v ? 'default' : 'outline'}
                    className="h-8 px-3 rounded-full"
                    onClick={() => setMaxStops(opt.v)}
                  >
                    {opt.label}
                  </Button>
                ))}
                <span className="text-xs text-muted-foreground ml-auto">{visibleOffers.length} of {offers.length} fares</span>
              </div>
            </Card>

            {/* Offer cards */}
            <div className="space-y-3">
              {visibleOffers.map(o => <OfferCard key={o.id} offer={o} onPick={pickOffer} isCheapest={cheapest?.id === o.id} />)}
            </div>
          </>
        )}

        {selectedOffer && (
          <div className="space-y-4">
            {/* Selected summary */}
            <Card className="p-4 border-blue-200 bg-blue-50/40">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  {selectedOffer.owner.logo_symbol_url && <img src={selectedOffer.owner.logo_symbol_url} alt={selectedOffer.owner.name} className="h-8 w-8" />}
                  <div>
                    <p className="font-bold leading-tight">{selectedOffer.owner.name}</p>
                    <p className="text-xs text-muted-foreground">{cabinShort}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-700">{fmtMoney(selectedOffer.total_amount, selectedOffer.total_currency)}</p>
                  <p className="text-xs text-muted-foreground">total · {totalPax} {totalPax === 1 ? 'traveller' : 'travellers'}</p>
                </div>
              </div>
              <div className="space-y-3">
                {selectedOffer.slices.map((s, idx) => <SegmentTimeline key={idx} slice={s} />)}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedOffer.conditions?.refund_before_departure?.allowed && <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50">Refundable</Badge>}
                {selectedOffer.conditions?.change_before_departure?.allowed && <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">Changes allowed</Badge>}
                {selectedOffer.total_emissions_kg && <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50">{selectedOffer.total_emissions_kg} kg CO₂</Badge>}
              </div>
              <Button variant="link" size="sm" className="px-0 h-auto text-blue-600 mt-2" onClick={() => setSelectedOffer(null)}>← Choose a different fare</Button>
            </Card>

            {/* Passenger forms */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <h2 className="font-bold text-lg">Traveller details</h2>
              </div>
              <p className="text-xs text-muted-foreground">Names must match the passport / ID exactly.</p>
              {passengers.map((p, idx) => (
                <Card key={idx} className="p-3 space-y-2 border-muted">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize">{p.type === 'infant_without_seat' ? 'Infant' : p.type}</Badge>
                    <span className="text-xs text-muted-foreground">Traveller {idx + 1}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Select value={p.title} onValueChange={(v) => updatePax(idx, { title: v as unknown })}>
                      <SelectTrigger><SelectValue placeholder="Title" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mr">Mr</SelectItem>
                        <SelectItem value="mrs">Mrs</SelectItem>
                        <SelectItem value="ms">Ms</SelectItem>
                        <SelectItem value="miss">Miss</SelectItem>
                        <SelectItem value="dr">Dr</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input className="sm:col-span-2" placeholder="Given name(s)" value={p.given_name} onChange={(e) => updatePax(idx, { given_name: e.target.value })} />
                  </div>
                  <Input placeholder="Family name" value={p.family_name} onChange={(e) => updatePax(idx, { family_name: e.target.value })} />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Date of birth</Label>
                      <Input type="date" value={p.born_on} onChange={(e) => updatePax(idx, { born_on: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Gender</Label>
                      <Select value={p.gender} onValueChange={(v) => updatePax(idx, { gender: v as unknown })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="m">Male</SelectItem>
                          <SelectItem value="f">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>
              ))}
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Contact details</h3>
                <p className="text-xs text-muted-foreground mb-2">We'll send the e-ticket and any schedule changes here.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input placeholder="Email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} type="email" />
                  <Input placeholder="Phone (e.g. +678 5...)" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-orange-50/40 border-orange-200">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold">Total to pay</span>
                <span className="text-2xl font-bold text-orange-600">{fmtMoney(selectedOffer.total_amount, selectedOffer.total_currency)}</span>
              </div>
              <Button className="w-full h-12 text-base font-semibold bg-orange-500 hover:bg-orange-600" onClick={confirmBooking} disabled={booking}>
                {booking ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Redirecting to secure payment…</> : <><Lock className="h-4 w-4 mr-2" />Pay & ticket flight</>}
              </Button>
              <p className="text-[11px] text-muted-foreground text-center mt-2">Secure payment via Stripe · Tickets issued automatically once payment clears.</p>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}

// ============ subcomponents ============

function PaxRow({ label, hint, value, onDec, onInc, minDisabled }: { label: string; hint: string; value: number; onDec: () => void; onInc: () => void; minDisabled?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className="flex items-center gap-3">
        <Button type="button" size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={onDec} disabled={minDisabled} aria-label={`Decrease ${label}`}>
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-5 text-center font-semibold">{value}</span>
        <Button type="button" size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={onInc} aria-label={`Increase ${label}`}>
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

function OfferCard({ offer, onPick, isCheapest }: { offer: Offer; onPick: (o: Offer) => void; isCheapest: boolean }) {
  const totalMins = offerTotalMins(offer);
  const stops = offerStops(offer);
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 space-y-3">
          {offer.slices.map((s, idx) => <SegmentTimeline key={idx} slice={s} compact />)}
        </div>
        <div className="sm:border-l sm:pl-4 flex sm:flex-col items-center sm:items-end justify-between gap-2 min-w-[160px]">
          <div className="text-right">
            {isCheapest && <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] mb-1">CHEAPEST</Badge>}
            <p className="text-2xl font-bold text-blue-700">{fmtMoney(offer.total_amount, offer.total_currency)}</p>
            <p className="text-[11px] text-muted-foreground">{stops === 0 ? 'Direct' : `${stops} stop${stops > 1 ? 's' : ''}`} · {fmtMin(totalMins)}</p>
          </div>
          <Button size="sm" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700" onClick={() => onPick(offer)}>Select</Button>
        </div>
      </div>
    </Card>
  );
}

function SegmentTimeline({ slice, compact }: { slice: Slice; compact?: boolean }) {
  const stops = Math.max(0, slice.segments.length - 1);
  const carrier = slice.segments[0]?.marketing_carrier;
  return (
    <div className="text-sm">
      <div className="flex items-center gap-2 mb-1.5">
        {carrier?.logo_symbol_url && <img src={carrier.logo_symbol_url} alt={carrier.name} className="h-5 w-5" />}
        <span className="text-xs font-medium text-muted-foreground">{carrier?.name}</span>
        {slice.segments.length > 1 && <span className="text-[11px] text-muted-foreground">+{slice.segments.length - 1} more</span>}
      </div>
      <div className="grid grid-cols-[auto_1fr_auto] gap-2 items-center">
        <div className="text-right">
          <p className="font-bold text-base leading-tight">{fmtTime(slice.segments[0].departing_at)}</p>
          <p className="text-xs text-muted-foreground">{slice.origin.iata_code}</p>
          {!compact && <p className="text-[11px] text-muted-foreground">{fmtDate(slice.segments[0].departing_at)}</p>}
        </div>
        <div className="px-2">
          <div className="relative">
            <div className="h-px bg-blue-300" />
            <Plane className="h-3 w-3 absolute left-1/2 -translate-x-1/2 -top-[7px] text-blue-500 rotate-90" />
          </div>
          <p className="text-[11px] text-center text-muted-foreground mt-1">
            <Clock className="h-2.5 w-2.5 inline mr-0.5" />{fmtMin(isoToMin(slice.duration))} {stops > 0 ? `· ${stops} stop${stops > 1 ? 's' : ''}` : '· Direct'}
          </p>
        </div>
        <div>
          <p className="font-bold text-base leading-tight">{fmtTime(slice.segments[slice.segments.length - 1].arriving_at)}</p>
          <p className="text-xs text-muted-foreground">{slice.destination.iata_code}</p>
          {!compact && <p className="text-[11px] text-muted-foreground">{fmtDate(slice.segments[slice.segments.length - 1].arriving_at)}</p>}
        </div>
      </div>
      {!compact && stops > 0 && (
        <div className="mt-2 ml-2 pl-3 border-l border-dashed border-muted-foreground/30 space-y-1.5">
          {slice.segments.slice(0, -1).map((seg, i) => {
            const next = slice.segments[i + 1];
            const layover = (new Date(next.departing_at).getTime() - new Date(seg.arriving_at).getTime()) / 60000;
            return (
              <div key={i} className="text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground">Layover</span> at {seg.destination.iata_code} {seg.destination.city_name && `(${seg.destination.city_name})`} · {fmtMin(layover)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
