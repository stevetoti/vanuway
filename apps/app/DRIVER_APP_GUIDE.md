# VanuCar & VanuRide Driver App - Complete Guide

## 📋 Overview

The driver app enables drivers to accept and complete ride requests for both VanuCar (cars) and VanuRide (motorcycles). This guide covers setup, testing, and deployment.

---

## 🚀 Quick Setup

### 1. Run Database Setup

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `SUPABASE_SETUP.sql`
4. Click **Run** to execute the script

This will:
- ✅ Create the `drivers` table
- ✅ Set up Row Level Security policies
- ✅ Create indexes for performance
- ✅ Enable real-time subscriptions
- ✅ Add helper views

### 2. API Requirements

**Required:**
- ✅ Supabase (Already configured in `.env`)
  - URL: `VITE_SUPABASE_URL`
  - Publishable Key: `VITE_SUPABASE_PUBLISHABLE_KEY`

**Optional (for maps):**
- Google Maps API Key (can be added via app interface)
  - Stored in localStorage as `googleMapsApiKey`
  - Required APIs:
    - Maps JavaScript API
    - Places API
    - Geocoding API
  - Get from: https://console.cloud.google.com/google/maps-apis

**Not Required:**
- ❌ No third-party payment APIs needed (using internal wallet)
- ❌ No SMS APIs needed yet (notifications via app)
- ❌ No other external APIs required

---

## 📱 Driver App Features

### 1. Driver Registration (`/driver/register`)
- Choose vehicle type (VanuCar or VanuRide)
- Enter vehicle details (model, color, license plate)
- Provide license information
- Submit insurance details
- Automatic driver role assignment
- Pending verification status

### 2. Driver Dashboard (`/driver/dashboard`)
- **Stats Overview:**
  - Total earnings
  - Total rides completed
  - Driver rating
- **Online/Offline Toggle:**
  - Go online to receive ride requests
  - Automatic location tracking when online
- **Available Rides List:**
  - See all pending ride requests nearby
  - View pickup/dropoff locations
  - See fare amount
  - One-click accept
- **Real-time Updates:**
  - New ride requests appear automatically
  - Push notifications for new rides

### 3. Active Ride Management (`/driver/ride/:rideId`)
- **Interactive Map:**
  - Pickup marker (green)
  - Dropoff marker (red)
  - Automatic bounds fitting
- **Navigation:**
  - One-click Google Maps navigation
- **Ride Workflow:**
  1. Accept → Status: "Accepted"
  2. "I'm On My Way" → Status: "Arriving"
  3. "Start Trip" → Status: "In Progress"
  4. "Complete Trip" → Status: "Completed"
- **Communication:**
  - Call passenger button
  - Message passenger button
- **Automatic:**
  - Passenger notifications on each status change
  - Earnings added to driver account on completion
  - Transaction record created
  - Driver stats updated

### 4. Earnings & Stats (`/driver/earnings`)
- **Overview Cards:**
  - Total lifetime earnings
  - This week's earnings and rides
  - Today's earnings and rides
  - Average earnings per ride
- **Transaction History:**
  - All ride earnings
  - Detailed descriptions
  - Timestamps
- **Ride History:**
  - Completed and cancelled rides
  - Passenger ratings
  - Route information

---

## 🔄 Complete Ride Flow

### Passenger Side:
1. User requests ride via `/rides/request`
2. Ride created with status "pending"
3. System attempts auto-assignment

### Driver Side:
4. Driver sees new ride in dashboard
5. Driver accepts ride → Status: "accepted"
6. Driver clicks "I'm On My Way" → Status: "arriving"
7. Driver arrives, clicks "Start Trip" → Status: "in_progress"
8. Driver completes trip → Status: "completed"

### System Actions:
9. Driver earnings updated (+VUV amount)
10. Total rides incremented
11. Transaction record created
12. Driver status → "available" again
13. Passenger can rate the ride

---

## 🧪 Testing Guide

### Test on Production
Your app is live at: **https://app.vanuway.com/**

### Step 1: Create Test Accounts

1. **Create Driver Account:**
   - Go to `/register`
   - Sign up with: `driver@test.com` / password
   - Complete profile setup

2. **Create Passenger Account:**
   - Open incognito window
   - Go to `/register`
   - Sign up with: `passenger@test.com` / password

### Step 2: Register as Driver

1. Login with driver account
2. Go to Services → "Become a Driver"
3. Fill out registration form:
   - Vehicle Type: VanuCar or VanuRide
   - Vehicle Model: Toyota Corolla
   - Color: White
   - License Plate: TEST123
   - License: DL12345, expiry: future date
   - Insurance: INS9876, expiry: future date
4. Submit application

### Step 3: Verify Driver (Supabase Dashboard)

Since there's no admin panel yet:
1. Go to Supabase Dashboard
2. Navigate to Table Editor → `drivers`
3. Find your driver record
4. Set `is_verified` to `TRUE`
5. Save changes

### Step 4: Test Driver Dashboard

1. Go to `/driver/dashboard`
2. You should see:
   - ✅ Your vehicle info
   - ✅ Stats (all zeros initially)
   - ✅ Online/Offline toggle
3. Toggle to **Online**
4. Location tracking starts automatically

### Step 5: Request a Ride (Passenger)

1. Switch to passenger account (incognito)
2. Go to Services → Ride-Hailing
3. Enter pickup: "Port Vila Market"
4. Enter dropoff: "Bauerfield Airport"
5. Select vehicle type (matching driver)
6. Review fare breakdown
7. Click "Request Ride"

### Step 6: Accept & Complete Ride (Driver)

1. Switch back to driver account
2. New ride should appear automatically!
3. Click "Accept Ride"
4. You're taken to `/driver/ride/:rideId`
5. Click "I'm On My Way"
6. Click "Start Trip"
7. Click "Complete Trip"
8. Check your earnings increased!

### Step 7: Verify Everything Works

**Driver Dashboard:**
- ✅ Total earnings updated
- ✅ Total rides = 1
- ✅ Driver back to "available"

**Earnings Page:**
- ✅ New transaction in history
- ✅ Completed ride in ride history

**Passenger Side:**
- ✅ Ride shows as "completed" in Bookings
- ✅ Can rate the ride

---

## 🗄️ Database Schema

### `drivers` Table
```sql
id                UUID (PK)
user_id           UUID → auth.users
vehicle_type      TEXT ('car' | 'moto')
vehicle_model     TEXT
vehicle_color     TEXT
license_plate     TEXT (unique)
status            TEXT ('available' | 'busy' | 'offline')
is_verified       BOOLEAN
current_lat       DOUBLE PRECISION
current_lng       DOUBLE PRECISION
current_ride_id   UUID → ride_bookings
rating            DECIMAL(3,2)
total_rides       INTEGER
total_earnings    DECIMAL(10,2)
license_number    TEXT
license_expiry    DATE
insurance_number  TEXT
insurance_expiry  DATE
created_at        TIMESTAMPTZ
updated_at        TIMESTAMPTZ
last_active_at    TIMESTAMPTZ
```

### `ride_bookings` Table (Updated)
Now includes:
- `driver_id` UUID → drivers table

---

## 🔐 Security (Row Level Security)

### Driver Policies:
- ✅ Drivers can view their own profile
- ✅ Drivers can update their own profile
- ✅ Drivers can insert their own profile
- ✅ Users can view active/verified drivers only
- ✅ Admins can manage all drivers

### Data Protection:
- Driver documents (license, insurance) only visible to owner
- Location data only visible when driver is active
- Earnings data protected by RLS

---

## 📊 Real-Time Features

### Live Updates via Supabase Realtime:

1. **Driver Dashboard:**
   - New ride requests appear instantly
   - Toast notification for new rides

2. **Active Ride:**
   - Status changes sync in real-time
   - Passenger sees driver status updates

3. **Location Tracking:**
   - Driver location updates every 10 seconds when online
   - Can be changed in `DriverLocationService` constructor

---

## 🐛 Troubleshooting

### "No driver profile found"
- Driver hasn't registered yet
- Go to `/driver/register`

### "Application Under Review"
- Driver not verified in database
- Go to Supabase → drivers table → set `is_verified = TRUE`

### No rides showing up
- Make sure driver is **Online**
- Check vehicle type matches ride request
- Verify location permissions granted

### Location not updating
- Check browser location permissions
- Ensure HTTPS (required for geolocation)
- Check console for errors

### Realtime not working
- Verify realtime is enabled in Supabase project settings
- Check that tables are added to `supabase_realtime` publication
- Refresh browser/clear cache

---

## 🚀 Next Steps

### Immediate:
1. ✅ Run SQL setup script
2. ✅ Create test accounts
3. ✅ Test complete ride flow

### Short-term Enhancements:
- [ ] Admin panel to verify drivers
- [ ] Driver document upload (license, insurance photos)
- [ ] Push notifications (web push or FCM)
- [ ] Ride rating improvements
- [ ] Driver analytics dashboard

### Long-term Features:
- [ ] Driver heat map showing busy areas
- [ ] Scheduled rides
- [ ] Multi-stop rides
- [ ] Driver referral program
- [ ] Performance bonuses
- [ ] Driver training module

---

## 📞 Support

If you run into issues:
1. Check browser console for errors
2. Verify Supabase connection
3. Check database policies
4. Review real-time subscriptions
5. Test with fresh accounts

---

## ✅ Checklist Before Going Live

- [ ] SQL setup script executed
- [ ] RLS policies verified
- [ ] Real-time enabled on tables
- [ ] Test driver account created and verified
- [ ] Complete ride flow tested end-to-end
- [ ] Earnings calculation verified
- [ ] Location tracking tested
- [ ] Real-time updates working
- [ ] Mobile responsive design checked
- [ ] Driver verification process documented
- [ ] Admin verification workflow established

---

**Built with ❤️ for Vanuatu**

VanuCar & VanuRide - Empowering local drivers, connecting communities.
