import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Search, MapPin, Star, Clock, Hospital, Shield,
  Siren, Pill, TestTube, Phone
} from 'lucide-react';
import { Hospital as HospitalType, HOSPITAL_TYPES, VANUATU_ISLANDS } from '@/types/health';

export default function BrowseHospitals() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [island, setIsland] = useState<string>('all');
  const [type, setType] = useState<string>('all');

  const { data: hospitals, isLoading } = useQuery({
    queryKey: ['hospitals', island, type, searchQuery],
    queryFn: async () => {
      let query = (supabase as unknown)
        .from('hospitals')
        .select('*')
        .eq('status', 'approved')
        .order('featured', { ascending: false })
        .order('rating', { ascending: false });

      if (island !== 'all') query = query.eq('island', island);
      if (type !== 'all') query = query.eq('type', type);
      if (searchQuery) query = query.or(`name.ilike.%${searchQuery}%,area.ilike.%${searchQuery}%`);

      const { data, error } = await query;
      if (error) throw error;
      return data as HospitalType[];
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="px-4 pt-4 pb-6">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => navigate('/health')}>
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Hospitals & Clinics</h1>
              <p className="text-blue-100 text-sm">Book appointments with doctors</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search hospitals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white text-gray-900 border-0"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-3 bg-white border-b flex items-center gap-2 overflow-x-auto">
        <Select value={island} onValueChange={setIsland}>
          <SelectTrigger className="w-[130px] h-9 text-sm">
            <SelectValue placeholder="Island" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Islands</SelectItem>
            {VANUATU_ISLANDS.map((isl) => (
              <SelectItem key={isl} value={isl}>{isl}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[130px] h-9 text-sm">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(HOSPITAL_TYPES).map(([key, info]) => (
              <SelectItem key={key} value={key}>{info.icon} {info.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Hospitals List */}
      <div className="p-4 space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-gray-200 rounded-lg" />
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : hospitals && hospitals.length > 0 ? (
          hospitals.map((hospital) => (
            <Card
              key={hospital.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/health/hospital/${hospital.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {hospital.logo_url ? (
                      <img src={hospital.logo_url} alt={hospital.name} className="w-full h-full object-cover" />
                    ) : (
                      <Hospital className="h-10 w-10 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{hospital.name}</h3>
                        {hospital.verified && <Shield className="h-4 w-4 text-blue-500" />}
                      </div>
                      {hospital.has_emergency && (
                        <Badge className="bg-red-500 text-xs">
                          <Siren className="h-3 w-3 mr-1" />
                          24/7
                        </Badge>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs mb-2">
                      {HOSPITAL_TYPES[hospital.type as keyof typeof HOSPITAL_TYPES]?.label || hospital.type}
                    </Badge>
                    <div className="flex items-center text-sm text-muted-foreground mb-2">
                      <MapPin className="h-3 w-3 mr-1" />
                      {hospital.area ? `${hospital.area}, ` : ''}{hospital.island}
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        {hospital.rating.toFixed(1)}
                      </span>
                      <div className="flex items-center gap-1">
                        {hospital.has_pharmacy && <Badge variant="secondary" className="text-xs"><Pill className="h-3 w-3" /></Badge>}
                        {hospital.has_lab && <Badge variant="secondary" className="text-xs"><TestTube className="h-3 w-3" /></Badge>}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center">
            <Hospital className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-2">No hospitals found</h3>
            <p className="text-muted-foreground text-sm">Try adjusting your filters</p>
          </Card>
        )}
      </div>
    </div>
  );
}
