import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Search, Ship, Globe, Mail, Phone, Users,
  ChevronRight, Loader2, ExternalLink, FileText, Shield,
  CheckCircle2, Clock, XCircle, AlertCircle,
} from 'lucide-react';

const partnershipColors: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  active: { label: 'Active Partner', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  negotiating: { label: 'Negotiating', color: 'bg-blue-100 text-blue-700', icon: Clock },
  contacted: { label: 'Contacted', color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
  prospect: { label: 'Prospect', color: 'bg-gray-100 text-gray-700', icon: Ship },
  inactive: { label: 'Inactive', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function CruiseDirectory() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedLine, setSelectedLine] = useState<unknown>(null);

  const { data: cruiseLines, isLoading } = useQuery({
    queryKey: ['cruise-lines-directory'],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('cruise_lines' as unknown)
        .select('*') as unknown)
        .order('annual_passengers_vanuatu', { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch ship counts per cruise line
  const { data: shipCounts } = useQuery({
    queryKey: ['cruise-ship-counts'],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('cruise_ships' as unknown)
        .select('cruise_line_id') as unknown);
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((s: unknown) => {
        counts[s.cruise_line_id] = (counts[s.cruise_line_id] || 0) + 1;
      });
      return counts;
    },
  });

  // Fetch upcoming schedule counts
  const { data: scheduleCounts } = useQuery({
    queryKey: ['cruise-schedule-counts'],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('cruise_schedules' as unknown)
        .select('ship:cruise_ships(cruise_line_id)') as unknown)
        .gte('arrival_date', new Date().toISOString().split('T')[0])
        .eq('is_cancelled', false);
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((s: unknown) => {
        const lineId = s.ship?.cruise_line_id;
        if (lineId) counts[lineId] = (counts[lineId] || 0) + 1;
      });
      return counts;
    },
  });

  const filtered = (cruiseLines || []).filter((line: unknown) =>
    !search || line.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalAnnualPax = (cruiseLines || []).reduce((sum: number, l: unknown) => sum + (l.annual_passengers_vanuatu || 0), 0);

  return (
    <Layout>
      <div className="container py-6 space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Cruise Line Directory</h1>
            <p className="text-sm text-muted-foreground">Partnership information and contact details</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center">
            <Ship className="h-5 w-5 mx-auto text-blue-600 mb-1" />
            <p className="text-2xl font-bold">{cruiseLines?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Cruise Lines</p>
          </Card>
          <Card className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto text-green-600 mb-1" />
            <p className="text-2xl font-bold">{(totalAnnualPax / 1000).toFixed(0)}K</p>
            <p className="text-xs text-muted-foreground">Annual Pax</p>
          </Card>
          <Card className="p-4 text-center">
            <Shield className="h-5 w-5 mx-auto text-purple-600 mb-1" />
            <p className="text-2xl font-bold">
              {(cruiseLines || []).filter((l: unknown) => l.partnership_status === 'active').length}
            </p>
            <p className="text-xs text-muted-foreground">Active Partners</p>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cruise lines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Schedule link */}
        <button
          className="w-full p-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl text-white text-left flex items-center gap-3"
          onClick={() => navigate('/cruise/schedule')}
        >
          <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center text-2xl flex-shrink-0">🚢</div>
          <div className="flex-1">
            <p className="font-bold">View Cruise Schedule</p>
            <p className="text-white/80 text-xs">See upcoming ship arrivals in Port Vila</p>
          </div>
          <ChevronRight className="h-5 w-5 flex-shrink-0" />
        </button>

        {/* Cruise Lines List */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
            <p className="text-muted-foreground">Loading cruise lines...</p>
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <Ship className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-lg font-medium">No cruise lines found</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((line: unknown) => {
              const status = partnershipColors[line.partnership_status] || partnershipColors.prospect;
              const StatusIcon = status.icon;
              const ships = shipCounts?.[line.id] || 0;
              const upcoming = scheduleCounts?.[line.id] || 0;

              return (
                <Card
                  key={line.id}
                  className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedLine(line)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center text-white flex-shrink-0">
                        <Ship className="h-7 w-7" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-bold">{line.name}</h3>
                            {line.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{line.description}</p>
                            )}
                          </div>
                          <Badge className={status.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Ship className="h-3 w-3" />
                            {ships} ship{ships !== 1 ? 's' : ''}
                          </span>
                          {line.annual_passengers_vanuatu && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {(line.annual_passengers_vanuatu / 1000).toFixed(0)}K pax/year
                            </span>
                          )}
                          {upcoming > 0 && (
                            <span className="flex items-center gap-1 text-blue-600 font-medium">
                              <Clock className="h-3 w-3" />
                              {upcoming} upcoming
                            </span>
                          )}
                        </div>

                        {line.commission_rate && (
                          <Badge variant="outline" className="mt-2 text-[10px]">
                            Commission: {line.commission_rate}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={!!selectedLine} onOpenChange={() => setSelectedLine(null)}>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Ship className="h-5 w-5 text-blue-600" />
                {selectedLine?.name}
              </DialogTitle>
            </DialogHeader>

            {selectedLine && (
              <div className="space-y-4">
                {selectedLine.description && (
                  <p className="text-sm text-muted-foreground">{selectedLine.description}</p>
                )}

                {/* Partnership Status */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Partnership Status</p>
                  <Badge className={partnershipColors[selectedLine.partnership_status]?.color || 'bg-gray-100'}>
                    {partnershipColors[selectedLine.partnership_status]?.label || selectedLine.partnership_status}
                  </Badge>
                  {selectedLine.commission_rate && (
                    <Badge variant="outline" className="ml-2">
                      {selectedLine.commission_rate}% commission
                    </Badge>
                  )}
                </div>

                {/* Contact Info */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Shore Excursion Contact</p>
                  {selectedLine.shore_excursion_email && (
                    <button
                      className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl text-left hover:bg-gray-100 transition-colors"
                      onClick={() => window.location.href = `mailto:${selectedLine.shore_excursion_email}`}
                    >
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">{selectedLine.shore_excursion_email}</span>
                    </button>
                  )}
                  {selectedLine.shore_excursion_phone && (
                    <button
                      className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl text-left hover:bg-gray-100 transition-colors"
                      onClick={() => window.location.href = `tel:${selectedLine.shore_excursion_phone}`}
                    >
                      <Phone className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{selectedLine.shore_excursion_phone}</span>
                    </button>
                  )}
                  {selectedLine.website_url && (
                    <a
                      href={selectedLine.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl text-left hover:bg-gray-100 transition-colors"
                    >
                      <Globe className="h-4 w-4 text-purple-600" />
                      <span className="text-sm flex-1">{selectedLine.website_url.replace('https://', '')}</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </a>
                  )}
                  {selectedLine.partner_application_url && (
                    <a
                      href={selectedLine.partner_application_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center gap-3 p-3 bg-blue-50 rounded-xl text-left hover:bg-blue-100 transition-colors"
                    >
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-700 font-medium">Apply for Partnership</span>
                      <ExternalLink className="h-3 w-3 text-blue-400" />
                    </a>
                  )}
                </div>

                {/* Requirements */}
                {selectedLine.requirements && selectedLine.requirements.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Partnership Requirements</p>
                    <div className="space-y-1.5">
                      {selectedLine.requirements.map((req: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{req}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Annual Stats */}
                {selectedLine.annual_passengers_vanuatu && (
                  <div className="bg-blue-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">{selectedLine.annual_passengers_vanuatu.toLocaleString()}</span>
                      <span className="text-muted-foreground">passengers to Vanuatu annually</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setSelectedLine(null);
                      navigate('/cruise/schedule');
                    }}
                  >
                    View Schedule
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setSelectedLine(null);
                      navigate('/drivers?category=cruise_transfer');
                    }}
                  >
                    Find Drivers
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
