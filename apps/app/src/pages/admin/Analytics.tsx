import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart3,
  ArrowLeft,
  Clock,
  TrendingUp,
  Users,
  Car,
  DollarSign,
  Calendar,
  Hotel,
} from "lucide-react";

interface AnalyticsData {
  totalDrivers: number;
  activeDrivers: number;
  pendingApplications: number;
  totalRides: number;
  totalEarnings: number;
  totalHotels: number;
  pendingHotels: number;
  totalBookings: number;
}

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7d");
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalDrivers: 0,
    activeDrivers: 0,
    pendingApplications: 0,
    totalRides: 0,
    totalEarnings: 0,
    totalHotels: 0,
    pendingHotels: 0,
    totalBookings: 0,
  });

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Get date range based on period
      const now = new Date();
      const startDate = new Date();
      switch (period) {
        case "24h":
          startDate.setHours(now.getHours() - 24);
          break;
        case "7d":
          startDate.setDate(now.getDate() - 7);
          break;
        case "30d":
          startDate.setDate(now.getDate() - 30);
          break;
        case "90d":
          startDate.setDate(now.getDate() - 90);
          break;
      }

      // Fetch all analytics data in parallel
      const [
        driversResult,
        activeDriversResult,
        pendingAppsResult,
        ridesResult,
        earningsResult,
        hotelsResult,
        pendingHotelsResult,
        bookingsResult,
      ] = await Promise.all([
        supabase.from("drivers").select("id", { count: "exact", head: true }),
        supabase
          .from("drivers")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true),
        supabase
          .from("driver_applications")
          .select("id", { count: "exact", head: true })
          .eq("status", "submitted"),
        supabase
          .from("ride_bookings")
          .select("id", { count: "exact", head: true })
          .gte("created_at", startDate.toISOString()),
        supabase
          .from("driver_earnings")
          .select("total_fare")
          .gte("created_at", startDate.toISOString()),
        supabase.from("hotels").select("id", { count: "exact", head: true }),
        supabase
          .from("hotels")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("hotel_bookings")
          .select("id", { count: "exact", head: true })
          .gte("created_at", startDate.toISOString()),
      ]);

      const totalEarnings = earningsResult.data?.reduce(
        (sum, e) => sum + (e.total_fare || 0),
        0
      ) || 0;

      setAnalytics({
        totalDrivers: driversResult.count || 0,
        activeDrivers: activeDriversResult.count || 0,
        pendingApplications: pendingAppsResult.count || 0,
        totalRides: ridesResult.count || 0,
        totalEarnings,
        totalHotels: hotelsResult.count || 0,
        pendingHotels: pendingHotelsResult.count || 0,
        totalBookings: bookingsResult.count || 0,
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Drivers",
      value: analytics.totalDrivers,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Active Drivers",
      value: analytics.activeDrivers,
      icon: Car,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Pending Applications",
      value: analytics.pendingApplications,
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "Total Rides",
      value: analytics.totalRides,
      icon: TrendingUp,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      periodBased: true,
    },
    {
      title: "Total Earnings",
      value: `$${analytics.totalEarnings.toLocaleString()}`,
      icon: DollarSign,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      periodBased: true,
    },
    {
      title: "Total Hotels",
      value: analytics.totalHotels,
      icon: Hotel,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "Pending Hotels",
      value: analytics.pendingHotels,
      icon: Clock,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      title: "Hotel Bookings",
      value: analytics.totalBookings,
      icon: Calendar,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
      periodBased: true,
    },
  ];

  const getPeriodLabel = () => {
    switch (period) {
      case "24h":
        return "Last 24 Hours";
      case "7d":
        return "Last 7 Days";
      case "30d":
        return "Last 30 Days";
      case "90d":
        return "Last 90 Days";
      default:
        return "";
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Platform Analytics</h1>
              <p className="text-muted-foreground">Overview of platform performance</p>
            </div>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Clock className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">Loading analytics...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                    {stat.periodBased && (
                      <span className="block text-xs opacity-70">{getPeriodLabel()}</span>
                    )}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Charts Coming Soon</p>
              <p className="text-sm">
                Detailed analytics charts and graphs will be available here.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
