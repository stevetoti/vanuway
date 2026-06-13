import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/layout/BottomNav';
import {
  Car, Building2, Utensils, Compass, Ship, Stethoscope, Wrench, Zap,
  ArrowLeft, ArrowRight, ChevronRight, Star, Briefcase, Users, Heart,
  ShoppingBag, Home, CalendarDays,
} from 'lucide-react';

const partnerTypes = [
  {
    icon: Car,
    title: 'Driver',
    desc: 'Drive & earn on your schedule',
    path: '/driver/register',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    accent: 'border-orange-200',
    popular: true,
  },
  {
    icon: Utensils,
    title: 'Restaurant',
    desc: 'List your restaurant for delivery & orders',
    path: '/food/owner/register',
    color: 'text-green-600',
    bg: 'bg-green-50',
    accent: 'border-green-200',
    popular: true,
  },
  {
    icon: Building2,
    title: 'Hotel',
    desc: 'Reach more guests with online bookings',
    path: '/hotels/owner/register',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    accent: 'border-blue-200',
  },
  {
    icon: Compass,
    title: 'Tours & Experiences',
    desc: 'Offer tours to local & international visitors',
    path: '/tours/provider/register',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    accent: 'border-amber-200',
  },
  {
    icon: Home,
    title: 'Real Estate',
    desc: 'List properties for sale or rent',
    path: '/realestate/create',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    accent: 'border-emerald-200',
  },
  {
    icon: ShoppingBag,
    title: 'Marketplace Seller',
    desc: 'Apply to sell items to buyers across Vanuatu',
    path: '/marketplace/seller/register',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    accent: 'border-purple-200',
  },
  {
    icon: CalendarDays,
    title: 'Event Organiser',
    desc: 'List concerts, markets, festivals & more',
    path: '/events/create',
    color: 'text-pink-600',
    bg: 'bg-pink-50',
    accent: 'border-pink-200',
  },
  {
    icon: Ship,
    title: 'Ferry / Transport',
    desc: 'List ferry routes & inter-island services',
    path: '/ferry/operator/register',
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
    accent: 'border-cyan-200',
  },
  {
    icon: Stethoscope,
    title: 'Pharmacy',
    desc: 'Sell medicines & health products online',
    path: '/health/pharmacy/register',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    accent: 'border-rose-200',
  },
  {
    icon: Heart,
    title: 'Hospital / Lab',
    desc: 'Register your hospital or laboratory',
    path: '/health/pharmacy/register',
    color: 'text-red-500',
    bg: 'bg-red-50',
    accent: 'border-red-200',
  },
  {
    icon: Briefcase,
    title: 'Post a Job',
    desc: 'Hire staff or find contractors',
    path: '/jobs/post',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    accent: 'border-indigo-200',
  },
  {
    icon: Users,
    title: 'Become a Freelancer',
    desc: 'Offer your skills & get hired',
    path: '/jobs/become-freelancer',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    accent: 'border-purple-200',
  },
  {
    icon: Wrench,
    title: 'Service Provider',
    desc: 'Plumbing, electrical, cleaning & more',
    path: '/providers',
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    accent: 'border-slate-200',
  },
  {
    icon: Zap,
    title: 'Utility Company',
    desc: 'UNELCO, water, telecom — send alerts to users',
    path: '/utility/register',
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    accent: 'border-yellow-200',
  },
];

const dashboards = [
  { label: 'Driver', path: '/driver/dashboard' },
  { label: 'Hotel', path: '/hotels/owner/dashboard' },
  { label: 'Restaurant', path: '/food/owner/dashboard' },
  { label: 'Tours', path: '/tours/provider/dashboard' },
  { label: 'Ferry', path: '/ferry/operator/dashboard' },
  { label: 'Real Estate', path: '/realestate/my-properties' },
  { label: 'Marketplace', path: '/marketplace/my-listings' },
  { label: 'Events', path: '/events/my-events' },
  { label: 'Utility', path: '/utility/dashboard' },
];

const PartnersIndex = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Compact header */}
      <div className="bg-gradient-to-br from-[#233C6F] to-[#19294d] text-white">
        <div className="container px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">Partner with VanuWay</h1>
              <p className="text-[10px] text-white/50">Register your business and start earning</p>
            </div>
          </div>

          {/* Stats row — compact */}
          <div className="flex gap-2">
            {[
              { val: '80%', label: 'You keep' },
              { val: '0', label: 'Upfront' },
              { val: '24/7', label: 'Access' },
            ].map(s => (
              <div key={s.label} className="flex-1 bg-white/10 rounded-xl py-2 text-center">
                <p className="text-sm font-bold text-orange-400">{s.val}</p>
                <p className="text-[9px] text-white/50">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container px-4 py-4 max-w-lg space-y-3">
        {/* Partner type list — native list style */}
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Choose your business type</p>

        <div className="space-y-2">
          {partnerTypes.map((partner) => {
            const Icon = partner.icon;
            return (
              <button
                key={partner.title}
                className={`w-full flex items-center gap-3 p-3.5 bg-white rounded-xl border ${partner.accent} text-left active:scale-[0.98] transition-transform hover:shadow-sm`}
                onClick={() => navigate(partner.path)}
              >
                <div className={`h-11 w-11 rounded-xl ${partner.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`h-5 w-5 ${partner.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold">{partner.title}</p>
                    {partner.popular && (
                      <Badge className="bg-orange-500 text-white text-[8px] h-4 px-1.5 gap-0.5">
                        <Star className="h-2.5 w-2.5 fill-white" />
                        Popular
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{partner.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
              </button>
            );
          })}
        </div>

        {/* Already a partner? */}
        <div className="pt-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Already a partner?</p>
          <div className="flex gap-2 flex-wrap">
            {dashboards.map(d => (
              <button
                key={d.label}
                className="px-3 py-1.5 bg-white border rounded-lg text-[11px] font-medium text-gray-700 hover:bg-gray-50 active:scale-95 transition-transform"
                onClick={() => navigate(d.path)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default PartnersIndex;
