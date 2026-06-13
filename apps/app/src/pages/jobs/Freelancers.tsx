import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Search, Users, Star, MapPin, Clock, DollarSign, CheckCircle2,
  Briefcase, Globe, ChevronRight
} from 'lucide-react';
import { FreelancerProfile, JobCategory, AVAILABILITY_OPTIONS, ISLANDS } from '@/types/jobs';

export default function Freelancers() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedIsland, setSelectedIsland] = useState('all');

  const { data: categories } = useQuery({
    queryKey: ['job-categories'],
    queryFn: async () => {
      const { data, error } = await (supabase as unknown)
        .from('job_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as JobCategory[];
    },
  });

  const { data: freelancers, isLoading } = useQuery({
    queryKey: ['freelancers'],
    queryFn: async () => {
      const { data, error } = await (supabase as unknown)
        .from('freelancer_profiles')
        .select('*')
        .eq('status', 'approved')
        .order('is_featured', { ascending: false })
        .order('avg_rating', { ascending: false });

      if (error) throw error;
      return data as FreelancerProfile[];
    },
  });

  const filteredFreelancers = freelancers?.filter(f => {
    const matchesSearch = f.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.primary_skill.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesIsland = selectedIsland === 'all' || f.island === selectedIsland;
    // Category filter would need additional logic with services
    return matchesSearch && matchesIsland;
  }) || [];

  const featuredFreelancers = freelancers?.filter(f => f.is_featured) || [];

  const formatRate = (rate: number | null) => {
    if (!rate) return null;
    return new Intl.NumberFormat('en-VU').format(rate) + ' VUV';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600 text-white">
        <div className="px-4 pt-4 pb-6">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => navigate('/jobs')}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold">Freelancers</h1>
            <div className="w-10" />
          </div>

          <div className="text-center mb-6">
            <Users className="h-12 w-12 mx-auto mb-2" />
            <h2 className="text-2xl font-bold">Hire Local Talent</h2>
            <p className="text-white/80 text-sm">Find skilled professionals for your projects</p>
          </div>

          {/* Search */}
          <Card className="bg-white/95 backdrop-blur shadow-xl">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search skills, names..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 border-gray-200"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-4 bg-white border-b sticky top-0 z-10">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Select value={selectedIsland} onValueChange={setSelectedIsland}>
            <SelectTrigger className="w-32 flex-shrink-0">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Islands</SelectItem>
              {ISLANDS.map(island => (
                <SelectItem key={island} value={island}>{island}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Featured Freelancers */}
      {featuredFreelancers.length > 0 && (
        <div className="px-4 py-6">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold text-lg">Featured Freelancers</h3>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {featuredFreelancers.slice(0, 5).map(freelancer => (
              <Card
                key={freelancer.id}
                className="flex-shrink-0 w-64 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow border-amber-200 bg-amber-50/30"
                onClick={() => navigate(`/jobs/freelancer/${freelancer.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg">
                      {freelancer.profile_image ? (
                        <img src={freelancer.profile_image} alt={freelancer.display_name} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        freelancer.display_name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold line-clamp-1">{freelancer.display_name}</h4>
                      <p className="text-sm text-muted-foreground">{freelancer.primary_skill}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    {freelancer.is_verified && (
                      <Badge className="bg-blue-100 text-blue-800 text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />Verified
                      </Badge>
                    )}
                    {freelancer.avg_rating > 0 && (
                      <div className="flex items-center gap-1 text-amber-600 text-sm">
                        <Star className="h-3.5 w-3.5 fill-amber-400" />
                        <span>{freelancer.avg_rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  {freelancer.hourly_rate && (
                    <p className="text-sm font-medium text-green-600">
                      {formatRate(freelancer.hourly_rate)}/hr
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Freelancers List */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">{filteredFreelancers.length} Freelancers</h3>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full" />
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded w-1/2 mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredFreelancers.length === 0 ? (
          <Card className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h4 className="font-medium text-lg mb-1">No freelancers found</h4>
            <p className="text-muted-foreground text-sm">Try adjusting your search or filters</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredFreelancers.map(freelancer => (
              <Card
                key={freelancer.id}
                className={`overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5 ${freelancer.is_featured ? 'border-purple-200 bg-purple-50/30' : ''}`}
                onClick={() => navigate(`/jobs/freelancer/${freelancer.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Profile Image */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-xl">
                        {freelancer.profile_image ? (
                          <img src={freelancer.profile_image} alt={freelancer.display_name} className="w-16 h-16 rounded-full object-cover" />
                        ) : (
                          freelancer.display_name.charAt(0).toUpperCase()
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{freelancer.display_name}</h4>
                            {freelancer.is_verified && (
                              <CheckCircle2 className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          <p className="text-sm text-purple-600 font-medium">{freelancer.primary_skill}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      </div>

                      {freelancer.tagline && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{freelancer.tagline}</p>
                      )}

                      <div className="flex flex-wrap gap-1 mt-2">
                        {freelancer.skills.slice(0, 4).map((skill, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">{skill}</Badge>
                        ))}
                        {freelancer.skills.length > 4 && (
                          <Badge variant="secondary" className="text-xs">+{freelancer.skills.length - 4}</Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-3 pt-2 border-t text-sm">
                        {freelancer.avg_rating > 0 && (
                          <div className="flex items-center gap-1 text-amber-600">
                            <Star className="h-4 w-4 fill-amber-400" />
                            <span>{freelancer.avg_rating.toFixed(1)}</span>
                            <span className="text-muted-foreground">({freelancer.reviews_count})</span>
                          </div>
                        )}
                        {freelancer.island && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{freelancer.island}</span>
                          </div>
                        )}
                        {freelancer.hourly_rate && (
                          <div className="flex items-center gap-1 text-green-600 font-medium">
                            <DollarSign className="h-3.5 w-3.5" />
                            <span>{formatRate(freelancer.hourly_rate)}/hr</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Become Freelancer CTA */}
      <div className="px-4 py-4">
        <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Have Skills to Offer?</h4>
              <p className="text-white/80 text-sm">Create your freelancer profile today</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="bg-white text-purple-600 hover:bg-gray-100"
              onClick={() => navigate('/jobs/become-freelancer')}
            >
              Get Started
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
