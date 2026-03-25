# VanuCar & VanuRide Services

Complete ride-hailing service API for Vanu Way platform.

## Services

### 🚗 VanuCar
- 4-passenger capacity
- Base fare: VUV 500
- Per km: VUV 50
- Per minute: VUV 10

### 🏍️ VanuRide
- 1-passenger capacity
- Base fare: VUV 300
- Per km: VUV 30
- Per minute: VUV 7

## Features

### ✅ Dynamic Pricing
- Distance-based calculation
- Time-based pricing
- Surge pricing (peak hours, late night)
- Transparent fare breakdowns

### ✅ Driver Assignment
- Auto-assignment to nearest available driver
- Manual driver selection
- Broadcast to multiple drivers
- Real-time availability checking

### ✅ Location Tracking
- Real-time driver location updates
- ETA calculations
- Route visualization
- Geolocation services

### ✅ Ride Management
- Create ride requests
- Update ride status
- Cancel rides
- Rate completed rides
- View ride history

## Usage Examples

### Create a Ride Request

```typescript
import { createRideRequest, getRideEstimate } from '@/lib/rides';

// Get price estimate
const estimate = getRideEstimate(
  { lat: -17.7333, lng: 168.3167 },  // pickup
  { lat: -17.7500, lng: 168.3300 },  // dropoff
  'car' // 'car' or 'moto'
);

// Create the ride
const result = await createRideRequest({
  userId: user.id,
  pickupLocation: 'Port Vila Market',
  pickupLat: -17.7333,
  pickupLng: 168.3167,
  dropoffLocation: 'Bauerfield Airport',
  dropoffLat: -17.7500,
  dropoffLng: 168.3300,
  vehicleType: 'car',
  passengerCount: 2,
  priceEstimate: estimate,
});
```

### Track Driver Location

```typescript
import { subscribeToDriverLocation } from '@/lib/rides';

const channel = subscribeToDriverLocation(driverId, (location) => {
  console.log('Driver location:', location.lat, location.lng);
  // Update map marker
});

// Cleanup
supabase.removeChannel(channel);
```

### Check Driver Availability

```typescript
import { checkDriverAvailability } from '@/lib/rides';

const result = await checkDriverAvailability(
  -17.7333, // lat
  168.3167, // lng
  'car' // vehicle type
);

if (result.success) {
  console.log(`${result.data.count} drivers available`);
}
```

### Rate a Ride

```typescript
import { rateRide } from '@/lib/rides';

await rateRide(
  rideId,
  userId,
  5, // rating 1-5
  'Great driver!' // optional comment
);
```

## Database Schema

### `drivers` Table
- Driver profiles
- Vehicle information
- Current location
- Status (available/busy/offline)
- Statistics (rating, total rides)

### `ride_bookings` Table
- Ride requests
- Pickup/dropoff locations
- Status tracking
- Price and payment info
- Ratings

## Status Flow

```
pending → accepted → arriving → in_progress → completed
                               ↘ cancelled
```

## Surge Pricing

Automatically applied based on:
- **Peak hours** (7-9 AM, 5-7 PM): 1.5x
- **Late night** (10 PM - 5 AM): 1.3x
- **Normal hours**: 1.0x

## Next Steps

1. **Driver App** - Build driver interface to accept/complete rides
2. **Push Notifications** - Real-time alerts for users and drivers
3. **Payment Integration** - Connect with wallet system
4. **Advanced Routing** - Google Directions API integration
5. **Ride Sharing** - Multiple passengers, split fares
6. **Schedule Rides** - Book rides in advance

## API Reference

See individual service files for detailed API documentation:
- `pricing.ts` - Fare calculation
- `driver-assignment.ts` - Driver matching logic
- `location-tracking.ts` - Real-time location services
- `ride-service.ts` - Main ride management API
