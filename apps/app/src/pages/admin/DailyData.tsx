import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  ArrowLeft, Anchor, Zap, ZapOff, Plus, Trash2, Edit2, Check, X,
  TrendingUp, TrendingDown, Minus, Ship,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export default function AdminDailyData() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'kava' | 'taxi' | 'outages'>('kava');

  // === KAVA PRICES ===
  const { data: kavaPrices, isLoading: kavaLoading } = useQuery({
    queryKey: ['admin-kava-prices'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('kava_prices' as unknown).select('*') as unknown)
        .order('price_vuv', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // === WATER TAXI ===
  const { data: taxiRoutes, isLoading: taxiLoading } = useQuery({
    queryKey: ['admin-taxi-routes'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('water_taxi_routes' as unknown).select('*') as unknown)
        .order('route_name');
      if (error) throw error;
      return data || [];
    },
  });

  // === POWER OUTAGES ===
  const { data: outages, isLoading: outagesLoading } = useQuery({
    queryKey: ['admin-outages'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('power_outages' as unknown).select('*') as unknown)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });

  // Kava price handlers
  const [editingKava, setEditingKava] = useState<string | null>(null);
  const [kavaForm, setKavaForm] = useState({ grade: '', price_vuv: '', unit: 'per kg', trend: 'stable' });
  const [addingKava, setAddingKava] = useState(false);

  const saveKavaPrice = async (id?: string) => {
    const payload = {
      grade: kavaForm.grade,
      price_vuv: parseInt(kavaForm.price_vuv),
      unit: kavaForm.unit,
      trend: kavaForm.trend,
      updated_at: new Date().toISOString(),
    };
    if (id) {
      await (supabase.from('kava_prices' as unknown).update(payload).eq('id', id) as unknown);
    } else {
      await (supabase.from('kava_prices' as unknown).insert({ ...payload, is_active: true, market_location: 'Port Vila' }) as unknown);
    }
    setEditingKava(null);
    setAddingKava(false);
    queryClient.invalidateQueries({ queryKey: ['admin-kava-prices'] });
    toast.success(id ? 'Kava price updated' : 'Kava price added');
  };

  const deleteKavaPrice = async (id: string) => {
    if (!confirm('Delete this kava price?')) return;
    await (supabase.from('kava_prices' as unknown).delete().eq('id', id) as unknown);
    queryClient.invalidateQueries({ queryKey: ['admin-kava-prices'] });
    toast.success('Deleted');
  };

  // Outage handlers
  const confirmOutage = async (id: string) => {
    await (supabase.from('power_outages' as unknown).update({ status: 'confirmed', confirmed_by_admin: true }).eq('id', id) as unknown);
    queryClient.invalidateQueries({ queryKey: ['admin-outages'] });
    toast.success('Outage confirmed');
  };

  const resolveOutage = async (id: string) => {
    await (supabase.from('power_outages' as unknown).update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', id) as unknown);
    queryClient.invalidateQueries({ queryKey: ['admin-outages'] });
    toast.success('Outage resolved');
  };

  const tabs = [
    { id: 'kava' as const, label: 'Kava Prices', icon: Anchor, count: kavaPrices?.length || 0 },
    { id: 'taxi' as const, label: 'Water Taxi', icon: Ship, count: taxiRoutes?.length || 0 },
    { id: 'outages' as const, label: 'Power Outages', icon: Zap, count: outages?.filter((o: unknown) => o.status !== 'resolved').length || 0 },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-gradient-to-br from-[#233C6F] to-[#19294d] text-white">
          <div className="container px-4 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10" onClick={() => navigate('/admin/dashboard')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-lg font-bold">Daily Data Management</h1>
                <p className="text-[10px] text-white/50">Manage kava prices, water taxi routes & power outages</p>
              </div>
            </div>
            <div className="flex gap-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                    activeTab === tab.id ? 'bg-white text-gray-900' : 'bg-white/10 text-white/70'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-gray-200' : 'bg-white/20'}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="container px-4 py-4 max-w-2xl space-y-4">
          {/* KAVA PRICES TAB */}
          {activeTab === 'kava' && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold">Kava Price Index</h2>
                <Button size="sm" className="h-8 text-xs gap-1" onClick={() => {
                  setAddingKava(true);
                  setKavaForm({ grade: '', price_vuv: '', unit: 'per kg', trend: 'stable' });
                }}>
                  <Plus className="h-3.5 w-3.5" /> Add Price
                </Button>
              </div>

              {addingKava && (
                <Card className="p-4 border-green-200 bg-green-50">
                  <p className="text-xs font-bold mb-2">New Kava Price</p>
                  <div className="space-y-2">
                    <Input placeholder="Grade (e.g. Premium Borogu)" value={kavaForm.grade} onChange={e => setKavaForm(f => ({ ...f, grade: e.target.value }))} className="text-sm" />
                    <div className="flex gap-2">
                      <Input type="number" placeholder="Price (VUV)" value={kavaForm.price_vuv} onChange={e => setKavaForm(f => ({ ...f, price_vuv: e.target.value }))} className="text-sm" />
                      <select className="border rounded px-2 text-sm" value={kavaForm.unit} onChange={e => setKavaForm(f => ({ ...f, unit: e.target.value }))}>
                        <option value="per kg">per kg</option>
                        <option value="per shell">per shell</option>
                        <option value="per bag">per bag</option>
                      </select>
                      <select className="border rounded px-2 text-sm" value={kavaForm.trend} onChange={e => setKavaForm(f => ({ ...f, trend: e.target.value }))}>
                        <option value="stable">Stable</option>
                        <option value="up">Up</option>
                        <option value="down">Down</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 h-8 text-xs" onClick={() => saveKavaPrice()}>
                        <Check className="h-3 w-3 mr-1" /> Save
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setAddingKava(false)}>
                        <X className="h-3 w-3 mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {kavaLoading ? (
                <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
              ) : (
                <div className="space-y-2">
                  {(kavaPrices || []).map((item: unknown) => (
                    <Card key={item.id} className="p-3">
                      {editingKava === item.id ? (
                        <div className="space-y-2">
                          <Input value={kavaForm.grade} onChange={e => setKavaForm(f => ({ ...f, grade: e.target.value }))} className="text-sm" />
                          <div className="flex gap-2">
                            <Input type="number" value={kavaForm.price_vuv} onChange={e => setKavaForm(f => ({ ...f, price_vuv: e.target.value }))} className="text-sm" />
                            <select className="border rounded px-2 text-sm" value={kavaForm.trend} onChange={e => setKavaForm(f => ({ ...f, trend: e.target.value }))}>
                              <option value="stable">Stable</option>
                              <option value="up">Up</option>
                              <option value="down">Down</option>
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" className="flex-1 h-7 text-xs" onClick={() => saveKavaPrice(item.id)}>Save</Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditingKava(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{item.grade}</p>
                            <p className="text-[10px] text-muted-foreground">{item.unit} · {item.market_location}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className="text-sm font-bold">VUV {item.price_vuv?.toLocaleString()}</p>
                              <div className="flex items-center gap-0.5 justify-end">
                                {item.trend === 'up' ? <TrendingUp className="h-3 w-3 text-red-500" /> : item.trend === 'down' ? <TrendingDown className="h-3 w-3 text-green-500" /> : <Minus className="h-3 w-3 text-gray-400" />}
                                <span className="text-[9px] text-muted-foreground capitalize">{item.trend}</span>
                              </div>
                            </div>
                            <button className="p-1.5 hover:bg-gray-100 rounded" onClick={() => { setEditingKava(item.id); setKavaForm({ grade: item.grade, price_vuv: String(item.price_vuv), unit: item.unit, trend: item.trend }); }}>
                              <Edit2 className="h-3.5 w-3.5 text-gray-500" />
                            </button>
                            <button className="p-1.5 hover:bg-red-50 rounded" onClick={() => deleteKavaPrice(item.id)}>
                              <Trash2 className="h-3.5 w-3.5 text-red-400" />
                            </button>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {/* WATER TAXI TAB */}
          {activeTab === 'taxi' && (
            <>
              <h2 className="text-sm font-bold">Water Taxi Routes</h2>
              {taxiLoading ? (
                <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
              ) : (
                <div className="space-y-2">
                  {(taxiRoutes || []).map((route: unknown) => (
                    <Card key={route.id} className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-bold">{route.route_name}</p>
                        <Badge variant={route.is_active ? 'default' : 'outline'} className="text-[10px]">
                          {route.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {route.departure_point} → {route.arrival_point} · {route.duration_minutes} min · VUV {route.price_vuv}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Operator: {route.operator_name || 'N/A'} · {route.operator_phone || 'No phone'}
                      </p>
                      <div className="flex gap-1 flex-wrap mt-1">
                        {(route.departures || []).map((t: string, i: number) => (
                          <span key={i} className="text-[9px] px-1.5 py-0.5 bg-blue-50 rounded">{t}</span>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-muted-foreground text-center">
                To add/edit routes, use Supabase dashboard → water_taxi_routes table
              </p>
            </>
          )}

          {/* POWER OUTAGES TAB */}
          {activeTab === 'outages' && (
            <>
              <h2 className="text-sm font-bold">Power Outage Reports</h2>
              {outagesLoading ? (
                <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
              ) : (outages || []).length === 0 ? (
                <Card className="p-6 text-center">
                  <Zap className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm font-medium">All Clear</p>
                  <p className="text-xs text-muted-foreground">No reported power outages</p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {(outages || []).map((outage: unknown) => (
                    <Card key={outage.id} className={`p-3 ${outage.status === 'resolved' ? 'opacity-50' : ''}`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-bold">{outage.area}</p>
                        <Badge
                          className={`text-[10px] ${
                            outage.status === 'confirmed' ? 'bg-red-100 text-red-700' :
                            outage.status === 'resolved' ? 'bg-green-100 text-green-700' :
                            'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {outage.status}
                        </Badge>
                      </div>
                      {outage.description && <p className="text-xs text-muted-foreground">{outage.description}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Reported {format(new Date(outage.created_at), 'MMM d, HH:mm')}
                        {outage.resolved_at && <> · Resolved {format(new Date(outage.resolved_at), 'HH:mm')}</>}
                      </p>
                      {outage.status !== 'resolved' && (
                        <div className="flex gap-2 mt-2">
                          {outage.status === 'reported' && (
                            <Button size="sm" className="h-7 text-xs flex-1 bg-red-600 hover:bg-red-700" onClick={() => confirmOutage(outage.id)}>
                              <ZapOff className="h-3 w-3 mr-1" /> Confirm Outage
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => resolveOutage(outage.id)}>
                            <Check className="h-3 w-3 mr-1" /> Mark Resolved
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
