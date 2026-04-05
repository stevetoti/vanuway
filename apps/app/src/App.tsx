import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React, { Suspense, lazy } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { NetworkStatus } from "@/components/common/NetworkStatus";
import { PageSkeleton } from "@/components/common/LoadingSkeleton";
import { usePWA } from "@/hooks/usePWA";

// Lazy load pages for code splitting and performance
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const OnboardingWelcome = lazy(() => import("./pages/onboarding/Welcome"));
const OnboardingIndex = lazy(() => import("./pages/onboarding/Index"));
const Partners = lazy(() => import("./pages/partners/Index"));
const Services = lazy(() => import("./pages/Services"));
const Bookings = lazy(() => import("./pages/Bookings"));
const Wallet = lazy(() => import("./pages/Wallet"));
const Profile = lazy(() => import("./pages/Profile"));
const Notifications = lazy(() => import("./pages/Notifications"));
const RidesIndex = lazy(() => import("./pages/rides/Index"));
const RequestRide = lazy(() => import("./pages/rides/RequestRide"));
const TrackRide = lazy(() => import("./pages/rides/TrackRide"));
const Restaurants = lazy(() => import("./pages/food/Restaurants"));
const RestaurantDetail = lazy(() => import("./pages/food/RestaurantDetail"));
const Checkout = lazy(() => import("./pages/food/Checkout"));
const OrderTracking = lazy(() => import("./pages/food/OrderTracking"));
const DriverRegister = lazy(() => import("./pages/driver/Register"));
const DriverDashboard = lazy(() => import("./pages/driver/Dashboard"));
const ActiveRide = lazy(() => import("./pages/driver/ActiveRide"));
const DriverEarnings = lazy(() => import("./pages/driver/Earnings"));
const EnhancedEarnings = lazy(() => import("./pages/driver/EnhancedEarnings"));
const Payouts = lazy(() => import("./pages/driver/Payouts"));
const Availability = lazy(() => import("./pages/driver/Availability"));
const DeliverySettings = lazy(() => import("./pages/driver/DeliverySettings"));
const DeliveryIndex = lazy(() => import("./pages/delivery/Index"));
const DeliveryRequest = lazy(() => import("./pages/delivery/Request"));
const SavedAddresses = lazy(() => import("./pages/profile/SavedAddresses"));
const PaymentMethods = lazy(() => import("./pages/profile/PaymentMethods"));
const NotificationPreferences = lazy(() => import("./pages/profile/NotificationPreferences"));
const LanguageSelector = lazy(() => import("./pages/profile/LanguageSelector"));
const Support = lazy(() => import("./pages/Support"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const About = lazy(() => import("./pages/About"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminApplications = lazy(() => import("./pages/admin/Applications"));
const ApplicationReview = lazy(() => import("./pages/admin/ApplicationReview"));
const AdminHotelsManagement = lazy(() => import("./pages/admin/HotelsManagement"));
const AdminHotelReview = lazy(() => import("./pages/admin/HotelReview"));
const AdminDocuments = lazy(() => import("./pages/admin/Documents"));
const AdminDrivers = lazy(() => import("./pages/admin/Drivers"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminOrders = lazy(() => import("./pages/admin/Orders"));
const AdminRides = lazy(() => import("./pages/admin/Rides"));
const CruiseSchedule = lazy(() => import("./pages/cruise/Schedule"));
const HotelOwnerRegister = lazy(() => import("./pages/hotels/OwnerRegister"));
const HotelOwnerDashboard = lazy(() => import("./pages/hotels/OwnerDashboard"));
const HotelOwnerWelcome = lazy(() => import("./pages/hotels/OwnerWelcome"));
const AddHotel = lazy(() => import("./pages/hotels/AddHotel"));
const ManageRooms = lazy(() => import("./pages/hotels/ManageRooms"));
const BrowseHotels = lazy(() => import("./pages/hotels/Browse"));
const HotelDetails = lazy(() => import("./pages/hotels/HotelDetails"));
const HotelMessages = lazy(() => import("./pages/hotels/Messages"));
const RestaurantOwnerRegister = lazy(() => import("./pages/food/OwnerRegister"));
const RestaurantOwnerDashboard = lazy(() => import("./pages/food/OwnerDashboard"));
const RestaurantOwnerWelcome = lazy(() => import("./pages/food/OwnerWelcome"));
const AddRestaurant = lazy(() => import("./pages/food/AddRestaurant"));
const AdminRestaurantsManagement = lazy(() => import("./pages/admin/RestaurantsManagement"));
const BrowseTours = lazy(() => import("./pages/tours/Browse"));
const TourDetails = lazy(() => import("./pages/tours/TourDetails"));
const TourOperatorRegister = lazy(() => import("./pages/tours/operator/Register"));
const TourOperatorDashboard = lazy(() => import("./pages/tours/operator/Dashboard"));
const TourOperatorPending = lazy(() => import("./pages/tours/operator/Pending"));
const TourOperatorAddTour = lazy(() => import("./pages/tours/operator/AddTour"));
const AdminTourOperators = lazy(() => import("./pages/admin/TourOperators"));
const TourProviderRegister = lazy(() => import("./pages/tours/ProviderRegister"));
const TourProviderWelcome = lazy(() => import("./pages/tours/ProviderWelcome"));
const TourProviderDashboard = lazy(() => import("./pages/tours/ProviderDashboard"));
const RestaurantOwnerOrders = lazy(() => import("./pages/food/OwnerOrders"));
const HotelOwnerBookings = lazy(() => import("./pages/hotels/OwnerBookings"));
const EditHotel = lazy(() => import("./pages/hotels/EditHotel"));
const ActiveDelivery = lazy(() => import("./pages/driver/ActiveDelivery"));
const EmergencyIndex = lazy(() => import("./pages/emergency/Index"));
const EmergencyReport = lazy(() => import("./pages/emergency/Report"));
const DriverIndex = lazy(() => import("./pages/driver/Index"));
const DriverWelcome = lazy(() => import("./pages/driver/Welcome"));
const BislamaHome = lazy(() => import("./pages/bislama/WebView"));
const BislamaTopic = lazy(() => import("./pages/bislama/Topic"));
const BislamaLesson = lazy(() => import("./pages/bislama/Lesson"));
const BislamaProgress = lazy(() => import("./pages/bislama/Progress"));
const EventsIndex = lazy(() => import("./pages/events/Index"));
const EventDetails = lazy(() => import("./pages/events/EventDetails"));
const CreateEvent = lazy(() => import("./pages/events/CreateEvent"));
const MyEvents = lazy(() => import("./pages/events/MyEvents"));
const FerryIndex = lazy(() => import("./pages/ferry/Index"));
const FerryBook = lazy(() => import("./pages/ferry/Book"));
const FerryConfirmation = lazy(() => import("./pages/ferry/Confirmation"));
const FerryMyBookings = lazy(() => import("./pages/ferry/MyBookings"));
const ProvidersIndex = lazy(() => import("./pages/providers/Index"));
const ProviderDetails = lazy(() => import("./pages/providers/ProviderDetails"));
const CreateServiceRequest = lazy(() => import("./pages/providers/CreateRequest"));
const MyServiceRequests = lazy(() => import("./pages/providers/MyRequests"));
const ShopIndex = lazy(() => import("./pages/shop/Index"));
const ShopDetails = lazy(() => import("./pages/shop/ShopDetails"));
const ShopCheckout = lazy(() => import("./pages/shop/Checkout"));
const ShopMyOrders = lazy(() => import("./pages/shop/MyOrders"));
const MarketplaceIndex = lazy(() => import("./pages/marketplace/Index"));
const MarketplaceListingDetails = lazy(() => import("./pages/marketplace/ListingDetails"));
const MarketplaceCreateListing = lazy(() => import("./pages/marketplace/CreateListing"));
const MarketplaceMyListings = lazy(() => import("./pages/marketplace/MyListings"));
const RealEstateIndex = lazy(() => import("./pages/realestate/Index"));
const PropertyDetails = lazy(() => import("./pages/realestate/PropertyDetails"));
const CreateProperty = lazy(() => import("./pages/realestate/CreateProperty"));
const MyProperties = lazy(() => import("./pages/realestate/MyProperties"));
// VanuHealth
const HealthIndex = lazy(() => import("./pages/health/Index"));
const PharmacyBrowse = lazy(() => import("./pages/health/pharmacy/Browse"));
const PharmacyDetails = lazy(() => import("./pages/health/pharmacy/Details"));
const PharmacyCheckout = lazy(() => import("./pages/health/pharmacy/Checkout"));
const PharmacyRegister = lazy(() => import("./pages/health/pharmacy/Register"));
const HospitalBrowse = lazy(() => import("./pages/health/hospital/Browse"));
const HospitalDetails = lazy(() => import("./pages/health/hospital/Details"));
const LabBrowse = lazy(() => import("./pages/health/lab/Browse"));
const LabDetails = lazy(() => import("./pages/health/lab/Details"));
// VanuJobs
const JobsIndex = lazy(() => import("./pages/jobs/Index"));
const JobDetails = lazy(() => import("./pages/jobs/JobDetails"));
const PostJob = lazy(() => import("./pages/jobs/PostJob"));
const MyApplications = lazy(() => import("./pages/jobs/MyApplications"));
const Freelancers = lazy(() => import("./pages/jobs/Freelancers"));
const FreelancerProfile = lazy(() => import("./pages/jobs/FreelancerProfile"));
const BecomeFreelancer = lazy(() => import("./pages/jobs/BecomeFreelancer"));
// Ferry Operator
const FerryOperatorRegister = lazy(() => import("./pages/ferry/operator/Register"));
const FerryOperatorDashboard = lazy(() => import("./pages/ferry/operator/Dashboard"));
const FerryOperatorAddRoute = lazy(() => import("./pages/ferry/operator/AddRoute"));
const FerryOperatorAddSchedule = lazy(() => import("./pages/ferry/operator/AddSchedule"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent = () => {
  usePWA();

  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ErrorBoundary>
            <Toaster />
            <Sonner />
            <NetworkStatus />
            <PWAInstallPrompt />
            <Suspense fallback={<PageSkeleton />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                <Route path="/onboarding" element={<ProtectedRoute><OnboardingIndex /></ProtectedRoute>} />
                <Route path="/onboarding/welcome" element={<ProtectedRoute><OnboardingWelcome /></ProtectedRoute>} />
                <Route path="/partners" element={<ProtectedRoute><Partners /></ProtectedRoute>} />

                <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/services" element={<ProtectedRoute><Services /></ProtectedRoute>} />
                <Route path="/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
                <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

                <Route path="/rides" element={<ProtectedRoute><RidesIndex /></ProtectedRoute>} />
                <Route path="/rides/request" element={<ProtectedRoute><RequestRide /></ProtectedRoute>} />
                <Route path="/rides/request/:serviceType" element={<ProtectedRoute><RequestRide /></ProtectedRoute>} />
                <Route path="/rides/track/:bookingId" element={<ProtectedRoute><TrackRide /></ProtectedRoute>} />

                <Route path="/food" element={<ProtectedRoute><Restaurants /></ProtectedRoute>} />
                <Route path="/food/restaurant/:id" element={<ProtectedRoute><RestaurantDetail /></ProtectedRoute>} />
                <Route path="/food/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                <Route path="/food/order/:orderId" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
                <Route path="/food/owner/register" element={<ProtectedRoute><RestaurantOwnerRegister /></ProtectedRoute>} />
                <Route path="/food/owner/dashboard" element={<ProtectedRoute><RestaurantOwnerDashboard /></ProtectedRoute>} />
                <Route path="/food/owner/welcome" element={<ProtectedRoute><RestaurantOwnerWelcome /></ProtectedRoute>} />
                <Route path="/food/owner/add-restaurant" element={<ProtectedRoute><AddRestaurant /></ProtectedRoute>} />
                <Route path="/food/owner/orders" element={<ProtectedRoute><RestaurantOwnerOrders /></ProtectedRoute>} />
                <Route path="/driver" element={<ProtectedRoute><DriverIndex /></ProtectedRoute>} />
                <Route path="/driver/register" element={<ProtectedRoute><DriverRegister /></ProtectedRoute>} />
                <Route path="/driver/welcome" element={<ProtectedRoute><DriverWelcome /></ProtectedRoute>} />
                <Route path="/driver/dashboard" element={<ProtectedRoute><DriverDashboard /></ProtectedRoute>} />
                <Route path="/driver/ride/:rideId" element={<ProtectedRoute><ActiveRide /></ProtectedRoute>} />
                <Route path="/driver/earnings" element={<ProtectedRoute><DriverEarnings /></ProtectedRoute>} />
                <Route path="/driver/earnings/detailed" element={<ProtectedRoute><EnhancedEarnings /></ProtectedRoute>} />
                <Route path="/driver/payouts" element={<ProtectedRoute><Payouts /></ProtectedRoute>} />
                <Route path="/driver/availability" element={<ProtectedRoute><Availability /></ProtectedRoute>} />
                <Route path="/driver/delivery-settings" element={<ProtectedRoute><DeliverySettings /></ProtectedRoute>} />
                <Route path="/driver/delivery/:orderId" element={<ProtectedRoute><ActiveDelivery /></ProtectedRoute>} />
                <Route path="/delivery" element={<ProtectedRoute><DeliveryIndex /></ProtectedRoute>} />
                <Route path="/delivery/request" element={<ProtectedRoute><DeliveryRequest /></ProtectedRoute>} />

                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/applications" element={<AdminRoute><AdminApplications /></AdminRoute>} />
                <Route path="/admin/applications/:id" element={<AdminRoute><ApplicationReview /></AdminRoute>} />
                <Route path="/admin/documents" element={<AdminRoute><AdminDocuments /></AdminRoute>} />
                <Route path="/admin/drivers" element={<AdminRoute><AdminDrivers /></AdminRoute>} />
                <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
                <Route path="/admin/hotels" element={<AdminRoute><AdminHotelsManagement /></AdminRoute>} />
                <Route path="/admin/hotels/:hotelId" element={<AdminRoute><AdminHotelReview /></AdminRoute>} />
                <Route path="/admin/restaurants" element={<AdminRoute><AdminRestaurantsManagement /></AdminRoute>} />
                <Route path="/admin/tour-operators" element={<AdminRoute><AdminTourOperators /></AdminRoute>} />
                <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
                <Route path="/admin/rides" element={<AdminRoute><AdminRides /></AdminRoute>} />

                <Route path="/hotels" element={<ProtectedRoute><BrowseHotels /></ProtectedRoute>} />
                <Route path="/hotels/messages" element={<ProtectedRoute><HotelMessages /></ProtectedRoute>} />
                <Route path="/hotels/:hotelId" element={<ProtectedRoute><HotelDetails /></ProtectedRoute>} />
                <Route path="/hotels/owner/register" element={<ProtectedRoute><HotelOwnerRegister /></ProtectedRoute>} />
                <Route path="/hotels/owner/dashboard" element={<ProtectedRoute><HotelOwnerDashboard /></ProtectedRoute>} />
                <Route path="/hotels/owner/welcome" element={<ProtectedRoute><HotelOwnerWelcome /></ProtectedRoute>} />
                <Route path="/hotels/owner/add-hotel" element={<ProtectedRoute><AddHotel /></ProtectedRoute>} />
                <Route path="/hotels/owner/rooms/:hotelId" element={<ProtectedRoute><ManageRooms /></ProtectedRoute>} />
                <Route path="/hotels/owner/bookings" element={<ProtectedRoute><HotelOwnerBookings /></ProtectedRoute>} />
                <Route path="/hotels/owner/edit/:hotelId" element={<ProtectedRoute><EditHotel /></ProtectedRoute>} />
                <Route path="/tours" element={<ProtectedRoute><BrowseTours /></ProtectedRoute>} />
                <Route path="/cruise/schedule" element={<ProtectedRoute><CruiseSchedule /></ProtectedRoute>} />
                <Route path="/tours/:tourId" element={<ProtectedRoute><TourDetails /></ProtectedRoute>} />
<Route path="/tours/operator/register" element={<ProtectedRoute><TourOperatorRegister /></ProtectedRoute>} />
                <Route path="/tours/operator/dashboard" element={<ProtectedRoute><TourOperatorDashboard /></ProtectedRoute>} />
                <Route path="/tours/operator/pending" element={<ProtectedRoute><TourOperatorPending /></ProtectedRoute>} />
                <Route path="/tours/operator/add" element={<ProtectedRoute><TourOperatorAddTour /></ProtectedRoute>} />
                <Route path="/tours/provider/register" element={<ProtectedRoute><TourProviderRegister /></ProtectedRoute>} />
                <Route path="/tours/provider/welcome" element={<ProtectedRoute><TourProviderWelcome /></ProtectedRoute>} />
                <Route path="/tours/provider/dashboard" element={<ProtectedRoute><TourProviderDashboard /></ProtectedRoute>} />

                <Route path="/emergency" element={<ProtectedRoute><EmergencyIndex /></ProtectedRoute>} />
                <Route path="/emergency/report" element={<ProtectedRoute><EmergencyReport /></ProtectedRoute>} />

                <Route path="/bislama" element={<ProtectedRoute><BislamaHome /></ProtectedRoute>} />
                <Route path="/bislama/topic/:id" element={<ProtectedRoute><BislamaTopic /></ProtectedRoute>} />
                <Route path="/bislama/lesson/:id" element={<ProtectedRoute><BislamaLesson /></ProtectedRoute>} />
                <Route path="/bislama/progress" element={<ProtectedRoute><BislamaProgress /></ProtectedRoute>} />

                <Route path="/events" element={<ProtectedRoute><EventsIndex /></ProtectedRoute>} />
                <Route path="/events/create" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
                <Route path="/events/my-events" element={<ProtectedRoute><MyEvents /></ProtectedRoute>} />
                <Route path="/events/:eventId" element={<ProtectedRoute><EventDetails /></ProtectedRoute>} />

                <Route path="/ferry" element={<ProtectedRoute><FerryIndex /></ProtectedRoute>} />
                <Route path="/ferry/book/:tripId" element={<ProtectedRoute><FerryBook /></ProtectedRoute>} />
                <Route path="/ferry/confirmation/:bookingId" element={<ProtectedRoute><FerryConfirmation /></ProtectedRoute>} />
                <Route path="/ferry/bookings" element={<ProtectedRoute><FerryMyBookings /></ProtectedRoute>} />
                <Route path="/ferry/operator/register" element={<ProtectedRoute><FerryOperatorRegister /></ProtectedRoute>} />
                <Route path="/ferry/operator/dashboard" element={<ProtectedRoute><FerryOperatorDashboard /></ProtectedRoute>} />
                <Route path="/ferry/operator/add-route" element={<ProtectedRoute><FerryOperatorAddRoute /></ProtectedRoute>} />
                <Route path="/ferry/operator/add-schedule" element={<ProtectedRoute><FerryOperatorAddSchedule /></ProtectedRoute>} />

                <Route path="/providers" element={<ProtectedRoute><ProvidersIndex /></ProtectedRoute>} />
                <Route path="/providers/:providerId" element={<ProtectedRoute><ProviderDetails /></ProtectedRoute>} />
                <Route path="/providers/request" element={<ProtectedRoute><CreateServiceRequest /></ProtectedRoute>} />
                <Route path="/providers/my-requests" element={<ProtectedRoute><MyServiceRequests /></ProtectedRoute>} />

                <Route path="/shop" element={<ProtectedRoute><ShopIndex /></ProtectedRoute>} />
                <Route path="/shop/:shopId" element={<ProtectedRoute><ShopDetails /></ProtectedRoute>} />
                <Route path="/shop/checkout/:shopId" element={<ProtectedRoute><ShopCheckout /></ProtectedRoute>} />
                <Route path="/shop/orders" element={<ProtectedRoute><ShopMyOrders /></ProtectedRoute>} />

                <Route path="/marketplace" element={<ProtectedRoute><MarketplaceIndex /></ProtectedRoute>} />
                <Route path="/marketplace/create" element={<ProtectedRoute><MarketplaceCreateListing /></ProtectedRoute>} />
                <Route path="/marketplace/my-listings" element={<ProtectedRoute><MarketplaceMyListings /></ProtectedRoute>} />
                <Route path="/marketplace/:listingId" element={<ProtectedRoute><MarketplaceListingDetails /></ProtectedRoute>} />

                <Route path="/realestate" element={<ProtectedRoute><RealEstateIndex /></ProtectedRoute>} />
                <Route path="/realestate/create" element={<ProtectedRoute><CreateProperty /></ProtectedRoute>} />
                <Route path="/realestate/my-properties" element={<ProtectedRoute><MyProperties /></ProtectedRoute>} />
                <Route path="/realestate/:propertyId" element={<ProtectedRoute><PropertyDetails /></ProtectedRoute>} />

                <Route path="/health" element={<ProtectedRoute><HealthIndex /></ProtectedRoute>} />
                <Route path="/health/pharmacies" element={<ProtectedRoute><PharmacyBrowse /></ProtectedRoute>} />
                <Route path="/health/pharmacy/register" element={<ProtectedRoute><PharmacyRegister /></ProtectedRoute>} />
                <Route path="/health/pharmacy/checkout/:pharmacyId" element={<ProtectedRoute><PharmacyCheckout /></ProtectedRoute>} />
                <Route path="/health/pharmacy/:pharmacyId" element={<ProtectedRoute><PharmacyDetails /></ProtectedRoute>} />
                <Route path="/health/hospitals" element={<ProtectedRoute><HospitalBrowse /></ProtectedRoute>} />
                <Route path="/health/hospital/:hospitalId" element={<ProtectedRoute><HospitalDetails /></ProtectedRoute>} />
                <Route path="/health/labs" element={<ProtectedRoute><LabBrowse /></ProtectedRoute>} />
                <Route path="/health/lab/:labId" element={<ProtectedRoute><LabDetails /></ProtectedRoute>} />

                <Route path="/jobs" element={<ProtectedRoute><JobsIndex /></ProtectedRoute>} />
                <Route path="/jobs/post" element={<ProtectedRoute><PostJob /></ProtectedRoute>} />
                <Route path="/jobs/my-applications" element={<ProtectedRoute><MyApplications /></ProtectedRoute>} />
                <Route path="/jobs/freelancers" element={<ProtectedRoute><Freelancers /></ProtectedRoute>} />
                <Route path="/jobs/freelancer/:freelancerId" element={<ProtectedRoute><FreelancerProfile /></ProtectedRoute>} />
                <Route path="/jobs/become-freelancer" element={<ProtectedRoute><BecomeFreelancer /></ProtectedRoute>} />
                <Route path="/jobs/:jobId" element={<ProtectedRoute><JobDetails /></ProtectedRoute>} />

                <Route path="/profile/addresses" element={<ProtectedRoute><SavedAddresses /></ProtectedRoute>} />
                <Route path="/profile/payments" element={<ProtectedRoute><PaymentMethods /></ProtectedRoute>} />
                <Route path="/profile/notifications" element={<ProtectedRoute><NotificationPreferences /></ProtectedRoute>} />
                <Route path="/profile/language" element={<ProtectedRoute><LanguageSelector /></ProtectedRoute>} />

                <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/about" element={<About />} />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppContent />
  </QueryClientProvider>
);

export default App;
