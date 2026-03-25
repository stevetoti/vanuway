# VanuWay Driver Onboarding & Admin Dashboard System

## Overview
Complete driver onboarding and admin dashboard implementation for VanuWay platform (Phase 2-A & 2-B).

## 📋 What Was Built

### Database Tables (14 new tables)

#### Driver System (8 tables):
1. **drivers** - Core driver profiles with application status, verification, and performance metrics
2. **driver_vehicles** - Vehicle registration with accessibility features
3. **driver_documents** - Document uploads with verification status and expiry tracking
4. **driver_applications** - Multi-step application workflow tracking
5. **driver_availability** - Driver schedule management (recurring and one-time)
6. **driver_locations** - Real-time GPS tracking with PostGIS support
7. **driver_earnings** - Per-ride earnings tracking with commission calculation
8. **driver_payouts** - Batch payout management with multiple payment methods

#### Admin System (6 tables):
1. **admin_users** - Role-based admin accounts with granular permissions
2. **admin_activity_logs** - Complete audit trail of all admin actions
3. **system_settings** - Configurable platform settings by category
4. **platform_analytics** - Pre-calculated metrics (hourly/daily/weekly/monthly)
5. **notification_templates** - System notification templates
6. **scheduled_reports** - Automated report generation

### SQL Setup Files

#### FILE 6: `DRIVER_ONBOARDING_SETUP.sql`
```bash
# Features:
- 8 tables for complete driver management
- PostGIS integration for location tracking
- Row Level Security (RLS) for data privacy
- find_nearby_drivers() function with geospatial search
- Real-time subscriptions for driver status
- Automatic stat updates on ride completion
```

#### FILE 7: `ADMIN_DASHBOARD_SETUP.sql`
```bash
# Features:
- 6 tables for admin operations
- Role-based access control (7 roles)
- get_dashboard_stats() function with period filtering
- approve_driver_application() function
- reject_driver_application() function
- log_admin_activity() function for audit trail
- Default system settings pre-populated
```

### Services (TypeScript)

#### 1. `src/lib/driver/driver-service.ts`
Complete driver operations service:
- `createDriverProfile()` - Create new driver profile
- `getDriverProfile()` - Get driver by user ID
- `addDriverVehicle()` - Register vehicle
- `uploadDriverDocument()` - Upload documents to Supabase Storage
- `getDriverDocuments()` - Retrieve all documents
- `submitDriverApplication()` - Submit for review
- `updateDriverStatus()` - Change online/available status
- `updateDriverLocation()` - Update real-time GPS location
- `getDriverEarnings()` - Get earnings with summary
- `findNearbyDrivers()` - Geospatial driver search
- `getDriverStats()` - Performance statistics

#### 2. `src/lib/admin/admin-service.ts`
Complete admin operations service:
- `isAdmin()` - Check admin privileges
- `getAdminProfile()` - Get admin user profile
- `getDashboardStats()` - Get platform statistics
- `getAllDrivers()` - Get drivers with filters
- `getDriverDetails()` - Full driver information
- `approveDriverApplication()` - Approve driver
- `rejectDriverApplication()` - Reject driver with reason
- `suspendDriver()` - Suspend driver account
- `activateDriver()` - Reactivate driver
- `getPendingRefunds()` - Get refund requests
- `approveRefund()` / `rejectRefund()` - Refund management
- `getActiveSafetyAlerts()` - Get safety alerts
- `acknowledgeSafetyAlert()` - Respond to alerts
- `logAdminActivity()` - Create audit log
- `getSystemSettings()` - Get platform settings
- `updateSystemSetting()` - Update configuration

### UI Components

#### 1. `src/pages/DriverRegistration.tsx`
5-step driver registration wizard:
- **Step 1**: Personal information (name, contact, address)
- **Step 2**: Driver's license details with expiry
- **Step 3**: Vehicle information (type, make, model, license plate)
- **Step 4**: Document uploads (license, registration, insurance, photo)
- **Step 5**: Review and submit application

Features:
- Progress indicator
- Form validation
- File upload with preview
- Province dropdown for Vanuatu
- Auto-saves progress

#### 2. `src/pages/DriverDashboard.tsx`
Comprehensive driver dashboard:
- Application status alerts
- Online/Available toggle controls
- Real-time earnings display (total, pending, paid)
- Performance metrics (rides, rating, acceptance rate)
- Quick actions (view map, earnings, manage vehicle)

Stats Cards:
- Total Earnings (VUV)
- Pending Earnings
- Total Rides
- Average Rating

#### 3. `src/pages/AdminDashboard.tsx`
Admin control center with real-time monitoring:
- Period selector (today/week/month/year)
- Platform statistics dashboard
- Alerts for:
  - Active safety alerts
  - Pending driver applications
  - Pending refunds
- Tabbed interface:
  - Overview with quick actions
  - Drivers (pending applications)
  - Refunds (pending requests)
  - Safety (active alerts)

Stats Grid:
- Total Rides (completed/cancelled breakdown)
- Total Revenue (with commission)
- Total Users (with active count)
- Drivers (total/online count)

#### 4. `src/pages/AdminDrivers.tsx`
Driver management interface:
- Driver list with search and filters
- Status badges (pending/approved/rejected/suspended)
- Detailed driver profile view showing:
  - Personal information
  - Registered vehicles
  - Uploaded documents with verification status
  - Performance statistics
  - Application timeline
- Approve/Reject dialogs with notes
- Document viewer (opens in new tab)
- Real-time status indicators

## 🔒 Security Features

### Row Level Security (RLS)
All tables have RLS policies:
- Drivers can only view/edit their own data
- Public can view approved active drivers
- Admins have role-based access
- Activity logs are audit-protected

### Role-Based Access Control
Admin roles:
- `super_admin` - Full system access
- `admin` - General admin privileges
- `operations_manager` - Operations oversight
- `customer_support` - User assistance
- `finance_manager` - Payment/refund management
- `driver_manager` - Driver approval and management
- `analyst` - Analytics and reporting

### Permissions System
Granular permissions JSON:
```json
{
  "view_dashboard": boolean,
  "manage_users": boolean,
  "manage_drivers": boolean,
  "manage_rides": boolean,
  "approve_refunds": boolean,
  "view_analytics": boolean,
  "manage_settings": boolean,
  "manage_admins": boolean,
  "export_data": boolean
}
```

## 🚀 Key Features

### Driver Onboarding
- ✅ Multi-step registration wizard
- ✅ Document upload with verification
- ✅ Background check tracking
- ✅ Vehicle registration with photos
- ✅ License expiry tracking
- ✅ Application review workflow
- ✅ Email/SMS notifications (infrastructure ready)

### Real-Time Location Tracking
- ✅ PostGIS geospatial database
- ✅ GPS coordinate storage
- ✅ Heading, speed, accuracy tracking
- ✅ `find_nearby_drivers()` function
- ✅ Distance-based search (default 5km radius)

### Earnings Management
- ✅ Per-ride earnings calculation
- ✅ Platform commission tracking (configurable %)
- ✅ Bonus and deduction support
- ✅ Payment status workflow
- ✅ Batch payout processing
- ✅ Multiple payout methods (bank, mobile money, cash)

### Admin Dashboard
- ✅ Real-time statistics
- ✅ Period filtering (today/week/month/year)
- ✅ Pending items alerts
- ✅ Driver approval workflow
- ✅ Refund management
- ✅ Safety alert monitoring
- ✅ Activity audit trail
- ✅ System settings configuration

## 📊 Database Functions

### `find_nearby_drivers()`
```sql
find_nearby_drivers(
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_radius_meters INTEGER DEFAULT 5000,
  p_vehicle_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
```
Returns nearby available drivers sorted by distance.

### `get_dashboard_stats()`
```sql
get_dashboard_stats(
  p_period TEXT DEFAULT 'today' -- 'today', 'week', 'month', 'year'
)
```
Returns comprehensive platform statistics for the specified period.

### `approve_driver_application()`
```sql
approve_driver_application(
  p_driver_id UUID,
  p_admin_user_id UUID,
  p_notes TEXT DEFAULT NULL
)
```
Approves driver, updates status, logs activity.

### `reject_driver_application()`
```sql
reject_driver_application(
  p_driver_id UUID,
  p_admin_user_id UUID,
  p_reason TEXT
)
```
Rejects driver with reason, updates status, logs activity.

## 🎯 Integration Points

### With Existing Systems

1. **Safety Features** (Phase 1-A)
   - Safety alerts monitored in admin dashboard
   - Driver can trigger SOS during rides

2. **Calling System** (Phase 1-B)
   - Phone masking for driver-passenger calls
   - Call logs tracked per ride

3. **Ride Scheduling** (Phase 1-C)
   - Drivers can accept scheduled rides
   - Schedule preferences tracking

4. **Cancellation & Refunds** (Phase 1-D)
   - Admin refund approval workflow
   - Driver cancellation fee tracking

5. **Accessibility** (Phase 1-E)
   - Wheelchair-accessible vehicle filtering
   - Driver accessibility training tracking

## 📦 File Structure

```
vanu-way/
├── DRIVER_ONBOARDING_SETUP.sql       # File 6: Driver system database
├── ADMIN_DASHBOARD_SETUP.sql          # File 7: Admin system database
├── DRIVER_ADMIN_SYSTEM_README.md      # This file
├── src/
│   ├── lib/
│   │   ├── driver/
│   │   │   └── driver-service.ts      # Driver operations
│   │   └── admin/
│   │       └── admin-service.ts       # Admin operations
│   └── pages/
│       ├── DriverRegistration.tsx     # Driver onboarding wizard
│       ├── DriverDashboard.tsx        # Driver control panel
│       ├── AdminDashboard.tsx         # Admin overview
│       └── AdminDrivers.tsx           # Driver approval interface
```

## 🔄 Workflow

### Driver Onboarding Flow
1. User signs up and starts driver registration
2. Completes 5-step wizard (personal → license → vehicle → documents → review)
3. Application status changes to 'pending'
4. Admin reviews application in AdminDrivers page
5. Admin approves or rejects with notes/reason
6. Driver receives notification
7. If approved, driver can go online and accept rides

### Ride Matching Flow (Integration Ready)
1. Passenger requests ride
2. System calls `find_nearby_drivers()` with location
3. Available drivers within radius are returned
4. System sends ride request to nearest driver
5. Driver accepts/rejects
6. On acceptance, ride begins
7. Earnings calculated on completion

### Admin Monitoring Flow
1. Admin logs in and views dashboard
2. Sees real-time stats for selected period
3. Reviews pending items (drivers, refunds, alerts)
4. Takes action (approve, reject, acknowledge)
5. All actions logged to `admin_activity_logs`

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first, works on all devices
- **Real-time Updates**: Status changes reflect immediately
- **Progress Indicators**: Clear feedback on multi-step processes
- **Badge System**: Visual status indicators (pending/approved/rejected)
- **Search & Filters**: Easy data navigation
- **Toast Notifications**: User feedback on all actions
- **Dialog Confirmations**: Prevent accidental actions
- **Loading States**: Spinners while fetching data

## 🔧 Configuration

### Default System Settings (Pre-populated)
```javascript
// General
platform_name: "VanuWay"
platform_timezone: "Pacific/Efate"
support_email: "support@vanuway.vu"

// Rides
min_ride_fare: 200 VUV
max_ride_distance_km: 100
driver_search_radius_km: 10
ride_timeout_minutes: 5

// Pricing
platform_commission_percentage: 20%
base_fare: 200 VUV
per_km_rate: 50 VUV
per_minute_rate: 10 VUV

// Driver
min_driver_rating: 3.5
```

## 🚦 Next Steps (Recommended)

1. **Ride Matching Engine**
   - Implement real-time driver-passenger matching
   - Use `find_nearby_drivers()` function
   - Add ride request notifications

2. **Driver App**
   - Create dedicated driver mobile app
   - Real-time location updates
   - Push notifications for ride requests

3. **Analytics Dashboard**
   - Build detailed analytics views
   - Charts and graphs for metrics
   - Export functionality

4. **Rating System**
   - Passenger rates driver after ride
   - Driver rates passenger
   - Average rating calculation

5. **Automated Reports**
   - Implement `scheduled_reports` system
   - Email reports to admins
   - PDF/Excel generation

## 📝 Installation Instructions

### Step 1: Run SQL Files
```bash
# In Supabase SQL Editor, run in order:
1. DRIVER_ONBOARDING_SETUP.sql
2. ADMIN_DASHBOARD_SETUP.sql
```

### Step 2: Configure Storage
```bash
# Create storage bucket for documents
# In Supabase Dashboard → Storage → Create bucket
Bucket name: "documents"
Public: false (private access)
```

### Step 3: Set Up Admin Users
```sql
-- Create your first admin user
INSERT INTO public.admin_users (
  user_id,
  first_name,
  last_name,
  email,
  role,
  is_active
) VALUES (
  '<your-supabase-auth-user-id>',
  'Admin',
  'User',
  'admin@vanuway.vu',
  'super_admin',
  true
);
```

## ✅ Testing Checklist

### Driver Registration
- [ ] Can complete all 5 steps
- [ ] Documents upload successfully
- [ ] Application submits with 'pending' status
- [ ] Driver sees pending status on dashboard

### Admin Approval
- [ ] Admin can see pending application
- [ ] Can view all driver details
- [ ] Approve function works
- [ ] Reject function requires reason
- [ ] Activity is logged

### Driver Dashboard
- [ ] Shows correct stats
- [ ] Online toggle works
- [ ] Available toggle works (only when online)
- [ ] Earnings display correctly

### Admin Dashboard
- [ ] Stats update per period
- [ ] Alerts show correct counts
- [ ] Can navigate to detail pages
- [ ] Search and filters work

## 🎉 Summary

You now have a complete driver onboarding and admin dashboard system with:
- ✅ 14 new database tables
- ✅ 2 comprehensive SQL setup files
- ✅ 2 TypeScript service layers
- ✅ 4 full-featured UI pages
- ✅ Real-time location tracking
- ✅ Earnings management
- ✅ Document verification
- ✅ Admin approval workflow
- ✅ Role-based access control
- ✅ Complete audit trail

**Phase 2-A & 2-B: COMPLETE! 🚀**
