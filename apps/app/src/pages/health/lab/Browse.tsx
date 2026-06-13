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
  ArrowLeft, Search, MapPin, Star, Clock, TestTube, Shield, Home, FileText
} from 'lucide-react';
import { Lab, VANUATU_ISLANDS } from '@/types/health';

export default function BrowseLabs() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [island, setIsland] = useState<string>('all');

  const { data: labs, isLoading } = useQuery({
    queryKey: ['labs', island, searchQuery],
    queryFn: async () => {
      let query = (supabase as unknown)
        .from('labs')
        .select('*')
        .eq('status', 'approved')
        .order('featured', { ascending: false })
        .order('rating', { ascending: false });

      if (island !== 'all') query = query.eq('island', island);
      if (searchQuery) query = query.or(`name.ilike.%${searchQuery}%,area.ilike.%${searchQuery}%`);

      const { data, error } = await query;
      if (error) throw error;
      return data as Lab[];
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-violet-600 text-white">
        <div className="px-4 pt-4 pb-6">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => navigate('/health')}>
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Labs & Diagnostics</h1>
              <p className="text-purple-100 text-sm">Book tests, get results online</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search labs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white text-gray-900 border-0"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-3 bg-white border-b">
        <Select value={island} onValueChange={setIsland}>
          <SelectTrigger className="w-[150px] h-9 text-sm">
            <SelectValue placeholder="Island" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Islands</SelectItem>
            {VANUATU_ISLANDS.map((isl) => (
              <SelectItem key={isl} value={isl}>{isl}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Labs List */}
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
        ) : labs && labs.length > 0 ? (
          labs.map((lab) => (
            <Card
              key={lab.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/health/lab/${lab.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {lab.logo_url ? (
                      <img src={lab.logo_url} alt={lab.name} className="w-full h-full object-cover" />
                    ) : (
                      <TestTube className="h-10 w-10 text-purple-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{lab.name}</h3>
                      {lab.verified && <Shield className="h-4 w-4 text-purple-500" />}
                    </div>
                    {lab.accreditation && (
                      <Badge variant="outline" className="text-xs mb-2">{lab.accreditation}</Badge>
                    )}
                    <div className="flex items-center text-sm text-muted-foreground mb-2">
                      <MapPin className="h-3 w-3 mr-1" />
                      {lab.area ? `${lab.area}, ` : ''}{lab.island}
                    </div>
                    <div className="flex items-center gap-3 text-sm mb-2">
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        {lab.rating.toFixed(1)}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Results in ~{lab.average_result_time_hours}h
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {lab.offers_home_collection && (
                        <Badge variant="secondary" className="text-xs">
                          <Home className="h-3 w-3 mr-1" />
                          Home Collection
                        </Badge>
                      )}
                      {lab.offers_online_results && (
                        <Badge variant="secondary" className="text-xs">
                          <FileText className="h-3 w-3 mr-1" />
                          Online Results
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center">
            <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-2">No labs found</h3>
            <p className="text-muted-foreground text-sm">Try adjusting your filters</p>
          </Card>
        )}
      </div>
    </div>
  );
}
