import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Cloud, Sun, CloudRain, CloudLightning, CloudSnow, Wind,
  Droplets, Thermometer, Eye, Waves, AlertTriangle, Activity,
  DollarSign, ArrowRightLeft, Clock, MapPin, Ship, Anchor,
  Zap, ZapOff, Users, Phone, ChevronRight, Navigation,
  CloudSun, CloudDrizzle, CloudFog, Loader2, RefreshCw, Gauge,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

// WMO Weather codes to icons/labels
const weatherCodes: Record<number, { icon: typeof Sun; label: string; bg: string }> = {
  0: { icon: Sun, label: 'Clear sky', bg: 'bg-amber-50' },
  1: { icon: Sun, label: 'Mainly clear', bg: 'bg-amber-50' },
  2: { icon: CloudSun, label: 'Partly cloudy', bg: 'bg-blue-50' },
  3: { icon: Cloud, label: 'Overcast', bg: 'bg-gray-100' },
  45: { icon: CloudFog, label: 'Foggy', bg: 'bg-gray-100' },
  48: { icon: CloudFog, label: 'Rime fog', bg: 'bg-gray-100' },
  51: { icon: CloudDrizzle, label: 'Light drizzle', bg: 'bg-blue-50' },
  53: { icon: CloudDrizzle, label: 'Drizzle', bg: 'bg-blue-50' },
  55: { icon: CloudDrizzle, label: 'Heavy drizzle', bg: 'bg-blue-100' },
  61: { icon: CloudRain, label: 'Light rain', bg: 'bg-blue-50' },
  63: { icon: CloudRain, label: 'Rain', bg: 'bg-blue-100' },
  65: { icon: CloudRain, label: 'Heavy rain', bg: 'bg-blue-200' },
  71: { icon: CloudSnow, label: 'Light snow', bg: 'bg-gray-100' },
  80: { icon: CloudRain, label: 'Rain showers', bg: 'bg-blue-100' },
  81: { icon: CloudRain, label: 'Heavy showers', bg: 'bg-blue-200' },
  82: { icon: CloudRain, label: 'Violent showers', bg: 'bg-blue-300' },
  95: { icon: CloudLightning, label: 'Thunderstorm', bg: 'bg-purple-100' },
  96: { icon: CloudLightning, label: 'Thunderstorm + hail', bg: 'bg-purple-200' },
  99: { icon: CloudLightning, label: 'Severe thunderstorm', bg: 'bg-red-100' },
};

const getWeatherInfo = (code: number) => weatherCodes[code] || weatherCodes[2];

// Locations
const LOCATIONS = [
  { id: 'port-vila', label: 'Port Vila', lat: -17.7334, lng: 168.3273 },
  { id: 'santo', label: 'Luganville', lat: -15.5167, lng: 167.1667 },
];

// Currency pairs
const CURRENCY_PAIRS = [
  { code: 'AUD', label: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'NZD', label: 'New Zealand Dollar', flag: '🇳🇿' },
  { code: 'USD', label: 'US Dollar', flag: '🇺🇸' },
  { code: 'FJD', label: 'Fijian Dollar', flag: '🇫🇯' },
  { code: 'EUR', label: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', label: 'British Pound', flag: '🇬🇧' },
  { code: 'JPY', label: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'CNY', label: 'Chinese Yuan', flag: '🇨🇳' },
];

// Quick nav items for the Daily page
const DAILY_SECTIONS = [
  { id: 'weather', icon: Cloud, label: 'Weather', color: 'text-amber-600', bg: 'bg-amber-50' },
  { id: 'quakes', icon: Activity, label: 'Quakes', color: 'text-red-600', bg: 'bg-red-50' },
  { id: 'currency', icon: DollarSign, label: 'Currency', color: 'text-green-600', bg: 'bg-green-50' },
  { id: 'kava', icon: Anchor, label: 'Kava', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  { id: 'taxi', icon: Ship, label: 'Water Taxi', color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'power', icon: Zap, label: 'Power', color: 'text-yellow-600', bg: 'bg-yellow-50' },
];

export default function DailyHub() {
  const navigate = useNavigate();
  const [weatherLocation, setWeatherLocation] = useState(LOCATIONS[0]);
  const [currencyAmount, setCurrencyAmount] = useState('1000');
  const [currencyFrom, setCurrencyFrom] = useState('VUV');
  const [currencyTo, setCurrencyTo] = useState('AUD');

  // === WEATHER ===
  const { data: weather, isLoading: weatherLoading } = useQuery({
    queryKey: ['weather', weatherLocation.id],
    queryFn: async () => {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${weatherLocation.lat}&longitude=${weatherLocation.lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,uv_index,apparent_temperature&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,sunrise,sunset&timezone=Pacific/Efate&forecast_days=5`
      );
      return res.json();
    },
    staleTime: 10 * 60 * 1000, // 10 min cache
  });

  // === MARINE / WAVES ===
  const { data: marine } = useQuery({
    queryKey: ['marine', weatherLocation.id],
    queryFn: async () => {
      const res = await fetch(
        `https://marine-api.open-meteo.com/v1/marine?latitude=${weatherLocation.lat}&longitude=${weatherLocation.lng}&current=wave_height,wave_period,wave_direction&daily=wave_height_max&timezone=Pacific/Efate`
      );
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
  });

  // === EARTHQUAKES ===
  const { data: earthquakes, isLoading: quakesLoading } = useQuery({
    queryKey: ['earthquakes'],
    queryFn: async () => {
      const res = await fetch(
        'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=-22&maxlatitude=-13&minlongitude=165&maxlongitude=172&minmagnitude=2.5&orderby=time&limit=10'
      );
      const data = await res.json();
      return data.features || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // === CURRENCY (with fallback) ===
  const { data: rates, isLoading: ratesLoading } = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: async () => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/VUV');
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        if (data.result === 'success' && data.rates) return data.rates;
        throw new Error('No rates');
      } catch {
        // Fallback: approximate rates if API fails
        return { AUD: 0.0122, NZD: 0.0147, USD: 0.0084, FJD: 0.0189, EUR: 0.0074, GBP: 0.0063, JPY: 1.26, CNY: 0.061 };
      }
    },
    staleTime: 60 * 60 * 1000,
  });

  // === KAVA PRICES (from Supabase) ===
  const { data: kavaPrices } = useQuery({
    queryKey: ['kava-prices'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('kava_prices' as unknown).select('*') as unknown)
        .eq('is_active', true)
        .order('price_vuv', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 60 * 1000,
  });

  // === WATER TAXI (from Supabase) ===
  const { data: taxiRoutes } = useQuery({
    queryKey: ['water-taxi-routes'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('water_taxi_routes' as unknown).select('*') as unknown)
        .eq('is_active', true)
        .order('price_vuv', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 60 * 1000,
  });

  // === POWER OUTAGES (from Supabase) ===
  const { data: outages } = useQuery({
    queryKey: ['power-outages'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('power_outages' as unknown).select('*') as unknown)
        .in('status', ['reported', 'confirmed'])
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // === UTILITY ANNOUNCEMENTS ===
  const { data: utilityAnnouncements } = useQuery({
    queryKey: ['utility-announcements-public'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('utility_announcements' as unknown).select('*, utility_providers(company_name, company_type)').eq('is_active', true).order('created_at', { ascending: false }).limit(5) as unknown);
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { user } = useAuth();

  // Weather data
  const currentWeather = weather?.current;
  const dailyWeather = weather?.daily;
  const currentWeatherInfo = currentWeather ? getWeatherInfo(currentWeather.weather_code) : null;
  const WeatherIcon = currentWeatherInfo?.icon || Cloud;

  // Tsunami check — any recent earthquake M7.0+ with tsunami flag
  const tsunamiAlert = (earthquakes || []).find((q: unknown) => q.properties.tsunami === 1 && q.properties.mag >= 7.0);

  // Significant quakes (M4.0+)
  const significantQuakes = (earthquakes || []).filter((q: unknown) => q.properties.mag >= 4.0);

  const amountNum = parseFloat(currencyAmount) || 0;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#233C6F] to-[#19294d] text-white">
          <div className="container px-4 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-lg font-bold">VanuWay Daily</h1>
                <p className="text-[10px] text-white/50">Your daily Vanuatu briefing</p>
              </div>
            </div>

            {/* Location toggle */}
            <div className="flex gap-2">
              {LOCATIONS.map(loc => (
                <button
                  key={loc.id}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    weatherLocation.id === loc.id ? 'bg-white text-gray-900' : 'bg-white/10 text-white/70'
                  }`}
                  onClick={() => setWeatherLocation(loc)}
                >
                  {loc.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="container px-4 py-4 space-y-4 max-w-lg">

          {/* Quick nav — scroll to sections */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {DAILY_SECTIONS.map(({ id, icon: Icon, label, color, bg }) => (
              <button
                key={id}
                className="flex flex-col items-center gap-1 min-w-[56px] flex-shrink-0"
                onClick={() => document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                <div className={`h-10 w-10 ${bg} rounded-xl flex items-center justify-center`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <span className="text-[9px] font-medium text-gray-600">{label}</span>
              </button>
            ))}
          </div>

          {/* ============ TSUNAMI ALERT ============ */}
          {tsunamiAlert && (
            <Card className="p-4 bg-red-600 text-white border-0">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 flex-shrink-0 animate-pulse" />
                <div>
                  <p className="font-bold text-lg">TSUNAMI WARNING</p>
                  <p className="text-sm text-white/90">
                    M{tsunamiAlert.properties.mag} earthquake — {tsunamiAlert.properties.place}
                  </p>
                  <p className="text-xs text-white/70 mt-1">Move to high ground immediately. Follow NDMO instructions.</p>
                </div>
              </div>
            </Card>
          )}

          {/* ============ WEATHER ============ */}
          <Card id="section-weather" className="overflow-hidden scroll-mt-4">
            <div className={`p-4 ${currentWeatherInfo?.bg || 'bg-blue-50'}`}>
              {weatherLoading ? (
                <div className="text-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                </div>
              ) : currentWeather ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-4xl font-bold">{Math.round(currentWeather.temperature_2m)}°</p>
                      <p className="text-sm text-muted-foreground">Feels like {Math.round(currentWeather.apparent_temperature)}°</p>
                    </div>
                    <div className="text-right">
                      <WeatherIcon className="h-12 w-12 text-gray-600 mb-1" />
                      <p className="text-xs font-medium">{currentWeatherInfo?.label}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center">
                      <Wind className="h-4 w-4 mx-auto text-muted-foreground mb-0.5" />
                      <p className="text-xs font-bold">{Math.round(currentWeather.wind_speed_10m)}</p>
                      <p className="text-[9px] text-muted-foreground">km/h</p>
                    </div>
                    <div className="text-center">
                      <Droplets className="h-4 w-4 mx-auto text-blue-500 mb-0.5" />
                      <p className="text-xs font-bold">{currentWeather.relative_humidity_2m}%</p>
                      <p className="text-[9px] text-muted-foreground">Humidity</p>
                    </div>
                    <div className="text-center">
                      <Eye className="h-4 w-4 mx-auto text-amber-500 mb-0.5" />
                      <p className="text-xs font-bold">{currentWeather.uv_index?.toFixed(1)}</p>
                      <p className="text-[9px] text-muted-foreground">UV Index</p>
                    </div>
                    <div className="text-center">
                      <Waves className="h-4 w-4 mx-auto text-cyan-500 mb-0.5" />
                      <p className="text-xs font-bold">{marine?.current?.wave_height?.toFixed(1) || '-'}m</p>
                      <p className="text-[9px] text-muted-foreground">Waves</p>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* 5-day forecast */}
            {dailyWeather && (
              <div className="px-4 py-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">5-Day Forecast</p>
                <div className="flex gap-1">
                  {dailyWeather.time.map((date: string, i: number) => {
                    const info = getWeatherInfo(dailyWeather.weather_code[i]);
                    const Icon = info.icon;
                    const isToday = i === 0;
                    return (
                      <div key={date} className={`flex-1 text-center p-1.5 rounded-lg ${isToday ? 'bg-primary/5' : ''}`}>
                        <p className="text-[9px] font-medium text-muted-foreground">{isToday ? 'Today' : format(new Date(date), 'EEE')}</p>
                        <Icon className="h-4 w-4 mx-auto my-1 text-gray-500" />
                        <p className="text-[10px] font-bold">{Math.round(dailyWeather.temperature_2m_max[i])}°</p>
                        <p className="text-[9px] text-muted-foreground">{Math.round(dailyWeather.temperature_2m_min[i])}°</p>
                        {dailyWeather.precipitation_probability_max?.[i] > 0 && (
                          <p className="text-[8px] text-blue-500">{dailyWeather.precipitation_probability_max[i]}%</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>

          {/* ============ EARTHQUAKES ============ */}
          <Card id="section-quakes" className="p-4 scroll-mt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-red-500" />
                <p className="font-semibold text-sm">Earthquake Monitor</p>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {(earthquakes || []).length} recent
              </Badge>
            </div>

            {quakesLoading ? (
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
            ) : (earthquakes || []).length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">No recent earthquakes near Vanuatu</p>
            ) : (
              <div className="space-y-2">
                {significantQuakes.slice(0, 5).map((quake: unknown) => {
                  const mag = quake.properties.mag;
                  const magColor = mag >= 6 ? 'bg-red-500' : mag >= 5 ? 'bg-orange-500' : mag >= 4 ? 'bg-amber-500' : 'bg-yellow-500';
                  const depth = quake.geometry.coordinates[2];
                  return (
                    <div key={quake.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                      <div className={`h-10 w-10 ${magColor} rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                        {mag.toFixed(1)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{quake.properties.place}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Depth: {depth.toFixed(0)} km · {formatDistanceToNow(new Date(quake.properties.time), { addSuffix: true })}
                        </p>
                      </div>
                      {quake.properties.tsunami === 1 && (
                        <Badge className="bg-red-100 text-red-700 text-[9px]">Tsunami</Badge>
                      )}
                    </div>
                  );
                })}
                {(earthquakes || []).length > significantQuakes.length && (
                  <p className="text-[10px] text-muted-foreground text-center">
                    + {(earthquakes || []).length - significantQuakes.length} smaller quakes (M2.5-4.0)
                  </p>
                )}
              </div>
            )}
          </Card>

          {/* ============ CURRENCY CONVERTER ============ */}
          <Card id="section-currency" className="p-4 scroll-mt-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4 text-green-600" />
              <p className="font-semibold text-sm">Currency Converter</p>
            </div>

            {/* From */}
            <div className="space-y-2">
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-[10px] text-muted-foreground mb-1">From</p>
                <div className="flex items-center gap-2">
                  <select
                    value={currencyFrom}
                    onChange={(e) => setCurrencyFrom(e.target.value)}
                    className="bg-transparent font-bold text-sm border-0 p-0 focus:outline-none"
                  >
                    <option value="VUV">🇻🇺 VUV</option>
                    {CURRENCY_PAIRS.map(p => (
                      <option key={p.code} value={p.code}>{p.flag} {p.code}</option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    value={currencyAmount}
                    onChange={(e) => setCurrencyAmount(e.target.value)}
                    className="border-0 bg-transparent text-right text-lg font-bold p-0 h-auto shadow-none focus-visible:ring-0"
                  />
                </div>
              </div>

              {/* Swap button */}
              <div className="flex justify-center -my-1">
                <button
                  className="h-8 w-8 rounded-full bg-white border shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
                  onClick={() => {
                    setCurrencyFrom(currencyTo);
                    setCurrencyTo(currencyFrom);
                  }}
                >
                  <ArrowRightLeft className="h-3.5 w-3.5 text-gray-500 rotate-90" />
                </button>
              </div>

              {/* To */}
              <div className="p-3 bg-green-50 rounded-xl">
                <p className="text-[10px] text-muted-foreground mb-1">To</p>
                <div className="flex items-center gap-2">
                  <select
                    value={currencyTo}
                    onChange={(e) => setCurrencyTo(e.target.value)}
                    className="bg-transparent font-bold text-sm border-0 p-0 focus:outline-none"
                  >
                    <option value="VUV">🇻🇺 VUV</option>
                    {CURRENCY_PAIRS.map(p => (
                      <option key={p.code} value={p.code}>{p.flag} {p.code}</option>
                    ))}
                  </select>
                  <div className="flex-1 text-right">
                    {ratesLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-auto text-muted-foreground" />
                    ) : (
                      <p className="text-lg font-bold text-green-700">
                        {(() => {
                          if (!rates || amountNum === 0) return '-';
                          let result: number;
                          if (currencyFrom === 'VUV' && currencyTo === 'VUV') {
                            result = amountNum;
                          } else if (currencyFrom === 'VUV') {
                            result = amountNum * (rates[currencyTo] || 0);
                          } else if (currencyTo === 'VUV') {
                            const fromRate = rates[currencyFrom] || 1;
                            result = amountNum / fromRate;
                          } else {
                            const fromRate = rates[currencyFrom] || 1;
                            const toRate = rates[currencyTo] || 1;
                            result = (amountNum / fromRate) * toRate;
                          }
                          return result > 0 ? result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-';
                        })()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Rate display */}
              {rates && currencyFrom !== currencyTo && (
                <p className="text-[10px] text-center text-muted-foreground">
                  1 {currencyFrom} = {(() => {
                    if (currencyFrom === 'VUV') return (rates[currencyTo] || 0).toFixed(4) + ' ' + currencyTo;
                    if (currencyTo === 'VUV') return (1 / (rates[currencyFrom] || 1)).toFixed(2) + ' VUV';
                    return ((rates[currencyTo] || 1) / (rates[currencyFrom] || 1)).toFixed(4) + ' ' + currencyTo;
                  })()}
                </p>
              )}
            </div>

            {/* Quick currency buttons */}
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {CURRENCY_PAIRS.slice(0, 6).map(pair => (
                <button
                  key={pair.code}
                  className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${
                    currencyTo === pair.code && currencyFrom === 'VUV'
                      ? 'bg-green-100 border-green-300 text-green-700 font-bold'
                      : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}
                  onClick={() => { setCurrencyFrom('VUV'); setCurrencyTo(pair.code); }}
                >
                  {pair.flag} {pair.code}
                </button>
              ))}
            </div>
          </Card>

          {/* ============ KAVA PRICE INDEX ============ */}
          <Card id="section-kava" className="p-4 scroll-mt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🥥</span>
                <p className="font-semibold text-sm">Kava Price Index</p>
              </div>
              {kavaPrices && kavaPrices.length > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  Updated {format(new Date(kavaPrices[0].updated_at), 'MMM d')}
                </p>
              )}
            </div>
            {kavaPrices && kavaPrices.length > 0 ? (
              <div className="space-y-2">
                {kavaPrices.map((item: unknown) => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-xs font-medium">{item.grade}</p>
                      <p className="text-[10px] text-muted-foreground">{item.unit}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">VUV {item.price_vuv.toLocaleString()}</p>
                      <p className="text-[9px] text-muted-foreground">
                        {item.trend === 'up' ? '↑ Rising' : item.trend === 'down' ? '↓ Falling' : '→ Stable'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-3">No price data available</p>
            )}
          </Card>

          {/* ============ WATER TAXI ============ */}
          <Card id="section-taxi" className="p-4 scroll-mt-4">
            <div className="flex items-center gap-2 mb-3">
              <Ship className="h-4 w-4 text-blue-600" />
              <p className="font-semibold text-sm">Water Taxi Schedule</p>
            </div>
            {taxiRoutes && taxiRoutes.length > 0 ? (
              <div className="space-y-3">
                {taxiRoutes.map((route: unknown) => {
                  // Find next available departure
                  const now = new Date();
                  const nextDeparture = (route.departures || []).find((time: string) => {
                    const [h, m] = time.split(':').map(Number);
                    return now.getHours() < h || (now.getHours() === h && now.getMinutes() <= (m || 0));
                  });
                  return (
                    <div key={route.id} className="p-3 bg-blue-50 rounded-xl">
                      <div className="flex items-center justify-between mb-1.5">
                        <div>
                          <p className="text-xs font-bold">{route.route_name}</p>
                          <p className="text-[9px] text-muted-foreground">
                            {route.duration_minutes} min · {route.departure_point} → {route.arrival_point}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-blue-700">VUV {route.price_vuv}</p>
                          {nextDeparture && (
                            <p className="text-[9px] text-green-600 font-medium">Next: {nextDeparture}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {(route.departures || []).map((time: string, j: number) => {
                          const [h, m] = time.split(':').map(Number);
                          const isPast = now.getHours() > h || (now.getHours() === h && now.getMinutes() > (m || 0));
                          return (
                            <span key={j} className={`text-[10px] px-1.5 py-0.5 rounded ${isPast ? 'bg-gray-200 text-gray-400 line-through' : 'bg-white text-gray-700 font-medium'}`}>
                              {time}
                            </span>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-2">
                        {route.operator_phone && (
                          <a
                            href={`tel:${route.operator_phone}`}
                            className="flex-1 text-center text-[10px] font-medium py-1.5 bg-white rounded-lg text-blue-600 border border-blue-200"
                          >
                            Call {route.operator_name || 'Operator'}
                          </a>
                        )}
                        <button
                          className="flex-1 text-center text-[10px] font-bold py-1.5 bg-blue-600 rounded-lg text-white"
                          onClick={() => navigate(`/rides/request?pickup=${encodeURIComponent(route.departure_point)}&dropoff=${encodeURIComponent(route.arrival_point)}`)}
                        >
                          Book Transfer
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-3">No water taxi schedules available</p>
            )}
          </Card>

          {/* ============ UTILITY ANNOUNCEMENTS ============ */}
          {utilityAnnouncements && utilityAnnouncements.length > 0 && (
            <div className="space-y-2">
              {utilityAnnouncements.map((ann: unknown) => (
                <Card key={ann.id} className={`p-3 border-l-4 ${
                  ann.severity === 'critical' ? 'border-l-red-500 bg-red-50' :
                  ann.severity === 'warning' ? 'border-l-amber-500 bg-amber-50' :
                  'border-l-blue-500 bg-blue-50'
                }`}>
                  <div className="flex items-start gap-2">
                    <Zap className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                      ann.severity === 'critical' ? 'text-red-500' : ann.severity === 'warning' ? 'text-amber-500' : 'text-blue-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold">{ann.title}</p>
                        {ann.utility_providers?.company_name && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-white/50 rounded text-muted-foreground">{ann.utility_providers.company_name}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-700 mt-0.5">{ann.message}</p>
                      {ann.affected_areas?.length > 0 && (
                        <p className="text-[9px] text-muted-foreground mt-0.5">Areas: {ann.affected_areas.join(', ')}</p>
                      )}
                      {ann.estimated_restore && (
                        <p className="text-[9px] text-blue-600 mt-0.5">Est. restore: {format(new Date(ann.estimated_restore), 'MMM d, HH:mm')}</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* ============ POWER STATUS ============ */}
          <Card id="section-power" className="p-4 scroll-mt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <p className="font-semibold text-sm">Power Status</p>
              </div>
              {(!outages || outages.length === 0) ? (
                <Badge className="bg-green-100 text-green-700 text-[10px]">All Clear</Badge>
              ) : (
                <Badge className="bg-red-100 text-red-700 text-[10px]">{outages.length} Outage{outages.length !== 1 ? 's' : ''}</Badge>
              )}
            </div>

            {outages && outages.length > 0 ? (
              <div className="space-y-2 mb-3">
                {outages.map((outage: unknown) => (
                  <div key={outage.id} className={`p-2.5 rounded-lg ${outage.confirmed_by_admin ? 'bg-red-50' : 'bg-amber-50'}`}>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold">{outage.area}</p>
                      <Badge variant="outline" className="text-[9px]">
                        {outage.status === 'confirmed' ? 'Confirmed' : 'Reported'}
                      </Badge>
                    </div>
                    {outage.description && <p className="text-[10px] text-muted-foreground mt-0.5">{outage.description}</p>}
                    {outage.estimated_restore && (
                      <p className="text-[10px] text-blue-600 mt-0.5">
                        Est. restore: {format(new Date(outage.estimated_restore), 'HH:mm')}
                      </p>
                    )}
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(outage.created_at), { addSuffix: true })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mb-3">No reported outages. Help your community — report if your area loses power.</p>
            )}

            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs gap-1"
              onClick={async () => {
                if (!user) return;
                const area = prompt('Which area has lost power?');
                if (!area) return;
                const desc = prompt('Any details? (optional)') || '';
                await (supabase.from('power_outages' as unknown).insert({
                  area,
                  description: desc || null,
                  reported_by: user.id,
                  status: 'reported',
                }) as unknown);
                window.location.reload();
              }}
            >
              <ZapOff className="h-3.5 w-3.5" />
              Report Power Outage
            </Button>
          </Card>

          {/* Emergency Contacts */}
          <Card className="p-4">
            <p className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Phone className="h-4 w-4 text-red-500" />
              Emergency Numbers
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Police', number: '112', color: 'bg-blue-50' },
                { label: 'Ambulance', number: '115', color: 'bg-red-50' },
                { label: 'Fire', number: '113', color: 'bg-orange-50' },
                { label: 'NDMO', number: '22999', color: 'bg-amber-50' },
              ].map(contact => (
                <a
                  key={contact.number}
                  href={`tel:${contact.number}`}
                  className={`p-2.5 ${contact.color} rounded-lg flex items-center gap-2`}
                >
                  <Phone className="h-3.5 w-3.5 text-gray-600" />
                  <div>
                    <p className="text-xs font-bold">{contact.label}</p>
                    <p className="text-[10px] text-muted-foreground">{contact.number}</p>
                  </div>
                </a>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
