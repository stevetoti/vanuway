import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Mail, Phone, Loader2, Building2, Utensils, Compass, Stethoscope, Wrench, Zap, Hospital, Car, Bed, ShoppingBag, Home, Ship, CalendarDays, Package, Sparkles, User as UserIcon, CreditCard, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VENDOR_KIND_LABELS: Record<string, string> = {
  marketplace_seller: 'Marketplace seller',
  hotel: 'Hotel',
  restaurant: 'Restaurant',
  tour_operator: 'Tour operator',
  service_provider: 'Service provider',
  driver: 'Driver',
  ferry_operator: 'Ferry operator',
  property_owner: 'Property owner',
  event_organizer: 'Event organizer',
};

type VendorKind =
  | 'driver' | 'hotel' | 'restaurant' | 'tour' | 'service' | 'pharmacy' | 'hospital' | 'utility';

interface VendorTab {
  kind: VendorKind;
  label: string;
  icon: unknown;
  table: string;
  approvalColumn: string;
  pendingValue: string | boolean;
  approvedValue: string | boolean;
  rejectedValue: string | boolean;
  nameField: string;
  emailField: string;
  phoneField: string;
  driverPage?: boolean;
}

const TABS: VendorTab[] = [
  { kind: 'driver', label: 'Drivers', icon: Car, table: 'drivers', approvalColumn: 'application_status', pendingValue: 'submitted', approvedValue: 'approved', rejectedValue: 'rejected', nameField: 'first_name', emailField: 'email', phoneField: 'phone_number', driverPage: true },
  { kind: 'hotel', label: 'Hotels', icon: Building2, table: 'hotel_owners', approvalColumn: 'verification_status', pendingValue: 'pending', approvedValue: 'verified', rejectedValue: 'rejected', nameField: 'business_name', emailField: 'email', phoneField: 'phone_number' },
  { kind: 'restaurant', label: 'Restaurants', icon: Utensils, table: 'restaurant_owners', approvalColumn: 'verification_status', pendingValue: 'pending', approvedValue: 'verified', rejectedValue: 'rejected', nameField: 'business_name', emailField: 'email', phoneField: 'phone_number' },
  { kind: 'tour', label: 'Tours', icon: Compass, table: 'tour_operators', approvalColumn: 'application_status', pendingValue: 'pending', approvedValue: 'approved', rejectedValue: 'rejected', nameField: 'business_name', emailField: 'email', phoneField: 'phone_number' },
  { kind: 'service', label: 'Services', icon: Wrench, table: 'service_providers', approvalColumn: 'verification_status', pendingValue: 'pending', approvedValue: 'verified', rejectedValue: 'rejected', nameField: 'business_name', emailField: 'email', phoneField: 'phone_number' },
  { kind: 'marketplace_seller' as unknown, label: 'Sellers', icon: ShoppingBag, table: 'marketplace_sellers', approvalColumn: 'verification_status', pendingValue: 'pending', approvedValue: 'verified', rejectedValue: 'rejected', nameField: 'full_name', emailField: 'email', phoneField: 'phone_number' },
  { kind: 'pharmacy', label: 'Pharmacies', icon: Stethoscope, table: 'pharmacies', approvalColumn: 'status', pendingValue: 'pending', approvedValue: 'active', rejectedValue: 'rejected', nameField: 'name', emailField: 'email', phoneField: 'phone' },
  { kind: 'hospital', label: 'Hospitals', icon: Hospital, table: 'hospitals', approvalColumn: 'status', pendingValue: 'pending', approvedValue: 'active', rejectedValue: 'rejected', nameField: 'name', emailField: 'email', phoneField: 'phone' },
  { kind: 'utility', label: 'Utilities', icon: Zap, table: 'utility_providers', approvalColumn: 'is_verified', pendingValue: false, approvedValue: true, rejectedValue: false, nameField: 'company_name', emailField: 'contact_email', phoneField: 'contact_phone' },
];

interface ListingTab {
  kind: string;
  label: string;
  icon: unknown;
  table: string;
  /** Column to filter for pending state */
  pendingFilter: { column: string; value: string | boolean };
  /** Column + value to set when approving */
  approve: { column: string; value: string | boolean };
  /** Column + value to set when rejecting */
  reject: { column: string; value: string | boolean };
  /** Title field for the row card */
  titleField: string;
  /** Optional secondary label (e.g. price) */
  priceField?: string;
}

const LISTING_TABS: ListingTab[] = [
  { kind: 'menu_item', label: 'Menu items', icon: Utensils, table: 'menu_items', pendingFilter: { column: 'is_available', value: false }, approve: { column: 'is_available', value: true }, reject: { column: 'is_available', value: false }, titleField: 'name', priceField: 'price' },
  { kind: 'hotel_room', label: 'Rooms', icon: Bed, table: 'hotel_rooms', pendingFilter: { column: 'is_active', value: false }, approve: { column: 'is_active', value: true }, reject: { column: 'is_active', value: false }, titleField: 'name', priceField: 'base_price' },
  { kind: 'property', label: 'Properties', icon: Home, table: 'properties', pendingFilter: { column: 'status', value: 'pending' }, approve: { column: 'status', value: 'active' }, reject: { column: 'status', value: 'removed' }, titleField: 'title', priceField: 'price' },
  { kind: 'tour', label: 'Tour packages', icon: Compass, table: 'tours', pendingFilter: { column: 'approval_status', value: 'pending' }, approve: { column: 'approval_status', value: 'approved' }, reject: { column: 'approval_status', value: 'rejected' }, titleField: 'name', priceField: 'price_adult' },
  { kind: 'marketplace', label: 'Marketplace', icon: ShoppingBag, table: 'marketplace_listings', pendingFilter: { column: 'status', value: 'draft' }, approve: { column: 'status', value: 'active' }, reject: { column: 'status', value: 'removed' }, titleField: 'title', priceField: 'price' },
  { kind: 'event', label: 'Events', icon: CalendarDays, table: 'community_events', pendingFilter: { column: 'status', value: 'pending' }, approve: { column: 'status', value: 'approved' }, reject: { column: 'status', value: 'cancelled' }, titleField: 'title', priceField: 'price_adult' },
  { kind: 'ad_sub', label: 'Ad subscriptions', icon: Sparkles, table: 'advertising_subscriptions', pendingFilter: { column: 'status', value: 'requested' }, approve: { column: 'status', value: 'active' }, reject: { column: 'status', value: 'cancelled' }, titleField: 'vendor_kind' },
  { kind: 'ferry_route', label: 'Ferry routes', icon: Ship, table: 'transport_routes', pendingFilter: { column: 'is_active', value: false }, approve: { column: 'is_active', value: true }, reject: { column: 'is_active', value: false }, titleField: 'origin_island', priceField: 'base_price' },
];

export default function AdminApprovals() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState<'vendors' | 'listings'>('vendors');
  const [activeVendorTab, setActiveVendorTab] = useState<VendorKind>('hotel');
  const [activeListingTab, setActiveListingTab] = useState<string>('marketplace');

  return (
    <Layout>
      <div className="container py-6 space-y-4 max-w-5xl">
        <div>
          <h1 className="text-2xl font-bold">Approvals</h1>
          <p className="text-sm text-muted-foreground">Review and approve vendor applications and the listings they post before they go live.</p>
        </div>

        <div className="flex gap-2">
          <Button variant={section === 'vendors' ? 'default' : 'outline'} size="sm" onClick={() => setSection('vendors')}>
            Vendor applications
          </Button>
          <Button variant={section === 'listings' ? 'default' : 'outline'} size="sm" onClick={() => setSection('listings')}>
            <Package className="h-4 w-4 mr-1" />
            Listings
          </Button>
        </div>

        {section === 'vendors' && (
          <Tabs value={activeVendorTab} onValueChange={(v) => setActiveVendorTab(v as VendorKind)}>
            <TabsList className="flex flex-wrap h-auto gap-1">
              {TABS.map(t => (
                <TabsTrigger key={t.kind} value={t.kind} className="flex items-center gap-1">
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                  <PendingCountBadge tab={t} />
                </TabsTrigger>
              ))}
            </TabsList>
            {TABS.map(t => (
              <TabsContent key={t.kind} value={t.kind} className="mt-4">
                {t.driverPage ? (
                  <Card className="p-6 text-center space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Drivers have a dedicated review page with vehicle, license, and document checks.
                    </p>
                    <Button onClick={() => navigate('/admin/applications')}>
                      Open Driver Applications
                    </Button>
                  </Card>
                ) : (
                  <PendingList tab={t} reviewerId={user?.id} />
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}

        {section === 'listings' && (
          <Tabs value={activeListingTab} onValueChange={setActiveListingTab}>
            <TabsList className="flex flex-wrap h-auto gap-1">
              {LISTING_TABS.map(t => (
                <TabsTrigger key={t.kind} value={t.kind} className="flex items-center gap-1">
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                  <ListingPendingCountBadge tab={t} />
                </TabsTrigger>
              ))}
            </TabsList>
            {LISTING_TABS.map(t => (
              <TabsContent key={t.kind} value={t.kind} className="mt-4">
                {t.kind === 'ad_sub' ? <AdSubscriptionApprovals reviewerId={user?.id} /> : <PendingListings tab={t} />}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </Layout>
  );
}

function ListingPendingCountBadge({ tab }: { tab: ListingTab }) {
  const { data } = useQuery({
    queryKey: ['admin-listing-pending-count', tab.kind],
    queryFn: async () => {
      // Ad subscriptions: pending = paid (status='active') AND admin_review_status='pending'.
      // The generic table filter would only count `requested` (unpaid), missing the rows that
      // actually need an admin decision.
      if (tab.kind === 'ad_sub') {
        const { count } = await (supabase as unknown)
          .from('advertising_subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
          .eq('admin_review_status', 'pending');
        return count ?? 0;
      }
      const { count } = await (supabase as unknown)
        .from(tab.table)
        .select('*', { count: 'exact', head: true })
        .eq(tab.pendingFilter.column, tab.pendingFilter.value);
      return count ?? 0;
    },
    refetchInterval: 60_000,
  });
  if (!data) return null;
  return <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">{data}</Badge>;
}

function AdSubscriptionApprovals({ reviewerId }: { reviewerId: string | undefined }) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  const { data: rows, isLoading } = useQuery({
    queryKey: ['admin-ad-subs', filter],
    queryFn: async () => {
      // Fetch the subscriptions joined with the package so we can show the user
      // exactly what tier and price they paid. Profile + auth.users come in a
      // second batched query because the join across schemas is awkward via PostgREST.
      let q = (supabase as unknown)
        .from('advertising_subscriptions')
        .select('id, user_id, vendor_kind, vendor_id, status, admin_review_status, admin_review_notes, current_period_start, current_period_end, stripe_session_id, stripe_subscription_id, created_at, package:advertising_packages(id, slug, name, monthly_price_vuv, days_per_week, description)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (filter === 'pending') q = q.eq('admin_review_status', 'pending').eq('status', 'active');
      else if (filter === 'approved') q = q.eq('admin_review_status', 'approved');
      else if (filter === 'rejected') q = q.eq('admin_review_status', 'rejected');
      const { data, error } = await q;
      if (error) throw error;
      const subs = data || [];
      if (subs.length === 0) return [];
      const userIds = Array.from(new Set(subs.map((s: unknown) => s.user_id)));
      const { data: profs } = await (supabase as unknown)
        .from('profiles')
        .select('id, full_name, phone, email, avatar_url')
        .in('id', userIds);
      const profById: Record<string, unknown> = {};
      (profs || []).forEach((p: unknown) => { profById[p.id] = p; });
      return subs.map((s: unknown) => ({ ...s, profile: profById[s.user_id] || {} }));
    },
    refetchInterval: 30_000,
  });

  const decideMutation = useMutation({
    mutationFn: async ({ row, approve, notes }: { row: unknown; approve: boolean; notes?: string }) => {
      const update: Record<string, unknown> = {
        admin_review_status: approve ? 'approved' : 'rejected',
        admin_reviewed_at: new Date().toISOString(),
        admin_reviewed_by: reviewerId || null,
        admin_review_notes: notes || null,
      };
      const { error } = await (supabase as unknown)
        .from('advertising_subscriptions')
        .update(update)
        .eq('id', row.id);
      if (error) throw error;

      // Notify the vendor in-app. Email goes through the same booking notification
      // pipeline used elsewhere on this page so we keep one delivery surface.
      const userId = row.user_id;
      const pkgName = row.package?.name || 'package';
      const subject = approve
        ? `Your ${pkgName} ad subscription is approved`
        : `Your ${pkgName} ad subscription was not approved`;
      const message = approve
        ? `Your featured listing is now live. It will appear on the home rails on the schedule for the ${pkgName} package.`
        : `Your ad subscription was not approved. Please contact support@vanuway.com — your payment will be reviewed for refund.`;
      if (userId) {
        await (supabase as unknown).from('notifications').insert({
          user_id: userId,
          title: subject,
          message,
          type: approve ? 'ad_subscription_approved' : 'ad_subscription_rejected',
          is_read: false,
        });
      }
    },
    onSuccess: (_d, vars) => {
      toast.success(vars.approve ? 'Ad approved — now featured' : 'Ad rejected');
      queryClient.invalidateQueries({ queryKey: ['admin-ad-subs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-listing-pending-count', 'ad_sub'] });
    },
    onError: (err: unknown) => toast.error(err.message || 'Failed to update'),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? 'default' : 'outline'}
            onClick={() => setFilter(f)}
            className="capitalize text-xs h-7"
          >
            {f}
          </Button>
        ))}
      </div>

      {(!rows || rows.length === 0) ? (
        <Card className="p-12 text-center">
          <CheckCircle2 className="h-10 w-10 mx-auto text-green-500 mb-2" />
          <p className="font-medium">No {filter} ad subscriptions</p>
          <p className="text-xs text-muted-foreground">{filter === 'pending' ? 'Nothing waiting for approval.' : 'No matches.'}</p>
        </Card>
      ) : (
        <p className="text-xs text-muted-foreground">{rows.length} {filter} ad subscription{rows.length === 1 ? '' : 's'}</p>
      )}

      {rows && rows.map((row: unknown) => {
        const pkg = row.package || {};
        const prof = row.profile || {};
        const vendorLabel = VENDOR_KIND_LABELS[row.vendor_kind] || row.vendor_kind;
        const stripePaid = !!(row.stripe_session_id || row.stripe_subscription_id);
        const reviewState = row.admin_review_status;
        return (
          <Card key={row.id} className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              {prof.avatar_url ? (
                <img src={prof.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <UserIcon className="h-5 w-5 text-orange-600" />
                </div>
              )}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold truncate">{prof.full_name || 'Unknown user'}</p>
                  <Badge variant="outline" className="text-[10px] h-5 capitalize">{vendorLabel}</Badge>
                  {reviewState === 'approved' && <Badge className="bg-green-600 text-[10px] h-5">Approved</Badge>}
                  {reviewState === 'rejected' && <Badge className="bg-red-600 text-[10px] h-5">Rejected</Badge>}
                  {reviewState === 'pending' && <Badge className="bg-amber-500 text-[10px] h-5">Pending review</Badge>}
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  {prof.email && <div className="flex items-center gap-1.5"><Mail className="h-3 w-3" />{prof.email}</div>}
                  {prof.phone && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{prof.phone}</div>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-gray-50 rounded-lg p-3">
              <div>
                <p className="text-muted-foreground text-[10px] uppercase tracking-wide">Package</p>
                <p className="font-bold flex items-center gap-1"><Sparkles className="h-3 w-3 text-orange-500" />{pkg.name || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-[10px] uppercase tracking-wide">Price</p>
                <p className="font-bold">VUV {Number(pkg.monthly_price_vuv || 0).toLocaleString()}<span className="text-muted-foreground font-normal text-[10px]">/mo</span></p>
              </div>
              <div>
                <p className="text-muted-foreground text-[10px] uppercase tracking-wide">Frequency</p>
                <p className="font-bold">{pkg.days_per_week || '—'}<span className="text-muted-foreground font-normal text-[10px]"> days/week</span></p>
              </div>
              <div>
                <p className="text-muted-foreground text-[10px] uppercase tracking-wide">Payment</p>
                <p className={`font-bold flex items-center gap-1 ${stripePaid ? 'text-green-700' : 'text-amber-700'}`}>
                  <CreditCard className="h-3 w-3" />
                  {stripePaid ? 'Paid (Stripe)' : 'Unpaid'}
                </p>
              </div>
            </div>

            {(row.current_period_start || row.current_period_end) && (
              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                Period: {row.current_period_start ? new Date(row.current_period_start).toLocaleDateString() : '—'} →{' '}
                {row.current_period_end ? new Date(row.current_period_end).toLocaleDateString() : '—'}
              </div>
            )}

            {row.admin_review_notes && (
              <p className="text-xs italic bg-amber-50 border border-amber-200 rounded px-2 py-1">
                Note: {row.admin_review_notes}
              </p>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              {row.user_id && row.vendor_kind === 'marketplace_seller' && (
                <Button size="sm" variant="outline" className="text-xs h-8" asChild>
                  <a href={`/marketplace?seller=${row.user_id}`} target="_blank" rel="noreferrer">View their listings</a>
                </Button>
              )}
              {reviewState === 'pending' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 ml-auto"
                    disabled={decideMutation.isPending}
                    onClick={() => {
                      const notes = window.prompt('Reason for rejection (optional, sent to vendor):') || undefined;
                      decideMutation.mutate({ row, approve: false, notes });
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    disabled={decideMutation.isPending}
                    onClick={() => decideMutation.mutate({ row, approve: true })}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                </>
              )}
              {reviewState !== 'pending' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-auto text-xs h-8"
                  disabled={decideMutation.isPending}
                  onClick={() => decideMutation.mutate({ row, approve: reviewState !== 'approved' })}
                >
                  {reviewState === 'approved' ? 'Revoke approval' : 'Re-approve'}
                </Button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function PendingListings({ tab }: { tab: ListingTab }) {
  const queryClient = useQueryClient();
  const { data: rows, isLoading } = useQuery({
    queryKey: ['admin-listing-pending', tab.kind],
    queryFn: async () => {
      const { data, error } = await (supabase as unknown)
        .from(tab.table)
        .select('*')
        .eq(tab.pendingFilter.column, tab.pendingFilter.value)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  const decideMutation = useMutation({
    mutationFn: async ({ row, approve }: { row: unknown; approve: boolean }) => {
      const target = approve ? tab.approve : tab.reject;
      const update: Record<string, unknown> = { [target.column]: target.value };
      // Ad subscriptions: when approving, stamp the 30-day period.
      if (tab.kind === 'ad_sub' && approve) {
        const now = new Date();
        update.current_period_start = now.toISOString();
        update.current_period_end = new Date(now.getTime() + 30 * 24 * 3600 * 1000).toISOString();
      }
      const { error } = await (supabase as unknown)
        .from(tab.table)
        .update(update)
        .eq('id', row.id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      toast.success(vars.approve ? 'Listing published' : 'Listing rejected');
      queryClient.invalidateQueries({ queryKey: ['admin-listing-pending', tab.kind] });
      queryClient.invalidateQueries({ queryKey: ['admin-listing-pending-count', tab.kind] });
    },
    onError: (err: unknown) => toast.error(err.message || 'Failed to update'),
  });

  const bulkApprove = useMutation({
    mutationFn: async () => {
      if (!rows || rows.length === 0) return;
      const ids = rows.map((r: unknown) => r.id);
      const { error } = await (supabase as unknown)
        .from(tab.table)
        .update({ [tab.approve.column]: tab.approve.value })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`Published ${rows?.length || 0} listings`);
      queryClient.invalidateQueries({ queryKey: ['admin-listing-pending', tab.kind] });
      queryClient.invalidateQueries({ queryKey: ['admin-listing-pending-count', tab.kind] });
    },
    onError: (err: unknown) => toast.error(err.message || 'Bulk approve failed'),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!rows || rows.length === 0) {
    return (
      <Card className="p-12 text-center">
        <CheckCircle2 className="h-10 w-10 mx-auto text-green-500 mb-2" />
        <p className="font-medium">No pending {tab.label.toLowerCase()}</p>
        <p className="text-xs text-muted-foreground">Everything has been reviewed.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{rows.length} pending {tab.label.toLowerCase()}</p>
        <Button size="sm" variant="outline" disabled={bulkApprove.isPending} onClick={() => bulkApprove.mutate()}>
          <CheckCircle2 className="h-4 w-4 mr-1 text-green-600" />
          Approve all
        </Button>
      </div>
      {rows.map((row: unknown) => {
        const img = row.image_url || (Array.isArray(row.images) ? row.images[0] : null);
        return (
          <Card key={row.id} className="p-3">
            <div className="flex items-start gap-3">
              {img ? (
                <img src={img} alt="" className="w-14 h-14 object-cover rounded flex-shrink-0 bg-muted" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <div className="w-14 h-14 rounded bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <tab.icon className="h-5 w-5 text-orange-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{row[tab.titleField] || 'Untitled'}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                  {tab.priceField && row[tab.priceField] !== null && row[tab.priceField] !== undefined && (
                    <span>VUV {Number(row[tab.priceField]).toLocaleString()}</span>
                  )}
                  {row.category && <span>{row.category}</span>}
                  {row.subcategory && <span>{row.subcategory}</span>}
                  {row.destination_island && <span>→ {row.destination_island}</span>}
                  <span>{new Date(row.created_at).toLocaleDateString()}</span>
                </div>
                {row.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{row.description}</p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" disabled={decideMutation.isPending} onClick={() => decideMutation.mutate({ row, approve: false })}>
                  <XCircle className="h-4 w-4" />
                </Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700" disabled={decideMutation.isPending} onClick={() => decideMutation.mutate({ row, approve: true })}>
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function PendingCountBadge({ tab }: { tab: VendorTab }) {
  const { data } = useQuery({
    queryKey: ['admin-pending-count', tab.kind],
    queryFn: async () => {
      const { count } = await (supabase as unknown)
        .from(tab.table)
        .select('*', { count: 'exact', head: true })
        .eq(tab.approvalColumn, tab.pendingValue);
      return count ?? 0;
    },
    refetchInterval: 60_000,
  });
  if (!data) return null;
  return <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">{data}</Badge>;
}

function PendingList({ tab, reviewerId }: { tab: VendorTab; reviewerId: string | undefined }) {
  const queryClient = useQueryClient();

  const { data: rows, isLoading } = useQuery({
    queryKey: ['admin-pending', tab.kind],
    queryFn: async () => {
      const { data, error } = await (supabase as unknown)
        .from(tab.table)
        .select('*')
        .eq(tab.approvalColumn, tab.pendingValue)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const decideMutation = useMutation({
    mutationFn: async ({ row, approve }: { row: unknown; approve: boolean }) => {
      const update: Record<string, unknown> = {
        [tab.approvalColumn]: approve ? tab.approvedValue : tab.rejectedValue,
        updated_at: new Date().toISOString(),
      };
      if (approve && tab.kind !== 'utility') {
        update.is_active = true;
      }
      const { error } = await (supabase as unknown)
        .from(tab.table)
        .update(update)
        .eq('id', row.id);
      if (error) throw error;

      // Send email + in-app notification
      const recipientEmail = row[tab.emailField];
      const recipientName = row[tab.nameField] || 'Vendor';
      const userId = row.user_id;
      const subject = approve ? `Your ${tab.label.replace(/s$/, '')} application is approved` : `Your ${tab.label.replace(/s$/, '')} application was not approved`;
      const message = approve
        ? `Welcome to VanuWay! Your ${tab.label.replace(/s$/, '').toLowerCase()} listing is now live. You can sign in and start managing your business from your dashboard.`
        : `We were unable to approve your application at this time. Please contact support@vanuway.com if you need clarification.`;

      if (userId) {
        await (supabase as unknown).from('notifications').insert({
          user_id: userId,
          title: subject,
          message,
          type: approve ? 'driver_approved' : 'driver_rejected',
          is_read: false,
        });
      }
      if (recipientEmail) {
        try {
          await supabase.functions.invoke('send-booking-notification', {
            body: {
              type: approve ? 'booking_confirmed' : 'booking_cancelled',
              recipientEmail,
              recipientName,
              bookingDate: subject,
              bookingTime: '',
              serviceCategory: 'ride',
              passengers: 1,
              otherPartyName: 'VanuWay',
              cancellationReason: approve ? '' : message,
            },
          });
        } catch (e) {
          console.warn('Email send failed', e);
        }
      }
    },
    onSuccess: (_d, vars) => {
      toast.success(vars.approve ? 'Approved' : 'Rejected');
      queryClient.invalidateQueries({ queryKey: ['admin-pending', tab.kind] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-count', tab.kind] });
    },
    onError: (err: unknown) => {
      toast.error(err.message || 'Failed to update');
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!rows || rows.length === 0) {
    return (
      <Card className="p-12 text-center">
        <CheckCircle2 className="h-10 w-10 mx-auto text-green-500 mb-2" />
        <p className="font-medium">No pending {tab.label.toLowerCase()}</p>
        <p className="text-xs text-muted-foreground">All applications are reviewed.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {rows.map((row: unknown) => (
        <Card key={row.id} className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
              <tab.icon className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{row[tab.nameField] || 'Untitled'}</p>
              <div className="flex flex-col sm:flex-row sm:gap-4 gap-1 text-xs text-muted-foreground mt-1">
                {row[tab.emailField] && (
                  <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{row[tab.emailField]}</span>
                )}
                {row[tab.phoneField] && (
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{row[tab.phoneField]}</span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Submitted {new Date(row.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
                disabled={decideMutation.isPending}
                onClick={() => decideMutation.mutate({ row, approve: false })}
              >
                <XCircle className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Reject</span>
              </Button>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                disabled={decideMutation.isPending}
                onClick={() => decideMutation.mutate({ row, approve: true })}
              >
                <CheckCircle2 className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Approve</span>
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
