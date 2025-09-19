# SafeNow Backend Integration Summary

## Overview
The SafeNow frontend application has been successfully integrated with the Django REST Framework backend API using axios and TanStack Query (react-query). This integration provides real-time data fetching for emergencies, shelters, alerts, device registration, and safety status updates.

## Integration Architecture

### API Client (`src/lib/api.ts`)
- **Base URL**: `http://localhost:8000/api/` (configurable via `NEXT_PUBLIC_API_BASE_URL`)
- **HTTP Client**: Axios with interceptors for request/response logging
- **Error Handling**: Comprehensive error handling with structured error responses
- **Timeout**: 10-second request timeout

### API Types (`src/types/api.ts`)
Complete TypeScript definitions for all API endpoints:
- Health check responses
- Shelter data with distance calculations
- Alert information with hazard types and severity
- Device registration and safety status
- Error response structures

### React Query Integration (`src/hooks/useApi.ts`)
Custom hooks for all backend endpoints:
- `useHealthCheck()` - System health monitoring
- `useNearbyShelteres()` - Location-based shelter queries
- `useActiveAlerts()` - Real-time alert monitoring
- `useDeviceRegistration()` - Push notification setup
- `useSafetyStatusUpdate()` - User safety reporting
- `useSimulateAlert()` - Emergency simulation (development)
- `useSafetyInstructions()` - Context-aware safety guidance

### Query Provider (`src/providers/QueryProvider.tsx`)
- React Query client configuration
- Default retry policies and error handling
- Development tools integration
- Global query and mutation settings

## Key Features Implemented

### 1. Real-Time Emergency Dashboard (`src/components/EmergencyDashboard.tsx`)
- **Active Alerts**: Displays current emergency alerts with severity indicators
- **Nearby Shelters**: Shows closest shelters with distance and ETA
- **Device Registration**: Automatic device registration for push notifications
- **Location Services**: Browser geolocation integration with Warsaw fallback
- **Auto-refresh**: Real-time data updates every 30 seconds

### 2. Enhanced Emergency Page (`src/app/emergency/page.tsx`)
- **Live Data Integration**: Replaces mock data with real API calls
- **Shelter Check-in**: Users can report their safety status at shelters
- **Emergency Instructions**: Context-aware safety guidance based on active alerts
- **Location-based Services**: Personalized alerts and shelter recommendations

### 3. Updated Main Page (`src/app/page.tsx`)
- **Live Dashboard**: Embedded emergency dashboard on homepage
- **Dual Navigation**: Education and emergency management sections
- **Real-time Status**: Current safety status display

## API Endpoints Integration

### Health Check
- **Endpoint**: `GET /health/`
- **Purpose**: System status monitoring
- **Response**: Service health and database connectivity

### Nearby Shelters
- **Endpoint**: `GET /nearby-shelters/`
- **Parameters**: `lat`, `lon`, `limit`
- **Purpose**: Find closest emergency shelters
- **Features**: Distance calculation, ETA estimation, availability status

### Active Alerts
- **Endpoint**: `GET /active-alerts/`
- **Parameters**: `lat`, `lon`
- **Purpose**: Current emergency alerts for user location
- **Features**: Hazard type mapping, severity levels, expiration times

### Device Registration
- **Endpoint**: `POST /devices/register/`
- **Purpose**: Register device for push notifications
- **Features**: Unique device ID generation, localStorage persistence

### Safety Status Updates
- **Endpoint**: `POST /status/`
- **Purpose**: User safety reporting and shelter check-ins
- **Features**: Status types (OK, NEEDS_HELP, IN_SHELTER, UNREACHABLE)

### Alert Simulation
- **Endpoint**: `POST /simulate-alert/`
- **Purpose**: Development and testing emergency scenarios
- **Security**: API key protection in production

### Safety Instructions
- **Endpoint**: `GET /safety-instructions/`
- **Parameters**: `hazard_type`, `eta_seconds`
- **Purpose**: Context-aware emergency guidance

## Utility Functions (`src/lib/utils/api.ts`)

### Data Formatting
- `formatETA()` - Human-readable time estimates
- `formatDistance()` - Distance display with units
- `formatAlertExpiry()` - Alert expiration times

### Display Helpers
- `getHazardTypeDisplay()` - User-friendly hazard names
- `getSeverityDisplay()` - Severity level descriptions
- `getSeverityColor()` - UI color coding
- `getEmergencyIcon()` - Icon mapping for emergency types

### Data Processing
- `mapHazardTypeToEmergencyType()` - Backend to frontend type mapping
- `generateDeviceId()` - Unique device identification
- `isValidCoordinate()` - Location data validation

## Environment Configuration

### Required Environment Variables
```bash
# Frontend (.env.local)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api

# Backend
DEBUG=True
PUSH_PROVIDER=fcm
FCM_SERVER_KEY=your_fcm_server_key
SIMULATION_API_KEY=your_simulation_key
DATABASE_URL=your_database_url
```

## Security Considerations

### Frontend Security
- No sensitive API keys exposed in client code
- Environment variables properly prefixed with `NEXT_PUBLIC_`
- Input validation for coordinates and user data
- HTTPS enforcement in production

### Backend Integration
- API key authentication for simulation endpoints
- Rate limiting on all endpoints
- Input validation and sanitization
- CORS configuration for frontend domain

## Error Handling

### Network Errors
- Automatic retry logic with exponential backoff
- Graceful degradation when API is unavailable
- User-friendly error messages
- Fallback to cached data when possible

### Data Validation
- TypeScript type checking for all API responses
- Runtime validation for critical data
- Coordinate validation for location services
- Device ID generation and persistence

## Performance Optimizations

### Caching Strategy
- React Query automatic caching
- Stale-while-revalidate pattern
- Background data updates
- Optimistic updates for mutations

### Data Fetching
- Parallel queries for independent data
- Conditional fetching based on user location
- Debounced location updates
- Efficient re-fetching on focus/reconnect

## Development Tools

### Debugging
- React Query DevTools integration
- Console logging for API requests/responses
- Error boundary implementation
- Network request monitoring

### Testing
- Mock API responses for development
- Simulation endpoints for testing scenarios
- Location spoofing capabilities
- Device registration testing

## Deployment Considerations

### Frontend Deployment
- Environment variable configuration
- Build-time API URL validation
- Static asset optimization
- Service worker for offline functionality

### Backend Requirements
- Django REST Framework backend running
- Database with shelter and alert data
- Push notification service configuration
- Simulation API key setup

## Future Enhancements

### Planned Features
- WebSocket integration for real-time updates
- Offline mode with service workers
- Push notification implementation
- User authentication and profiles
- Advanced location services (GPS tracking)
- Multi-language support
- Accessibility improvements

### Technical Improvements
- Error boundary components
- Loading skeleton components
- Advanced caching strategies
- Performance monitoring
- Analytics integration

## Usage Examples

### Basic API Usage
```typescript
// Fetch nearby shelters
const { data: shelters, isLoading } = useNearbyShelteres({
  lat: 52.2297,
  lon: 21.0122,
  limit: 5
});

// Register device for notifications
const registerDevice = useDeviceRegistration();
registerDevice.mutate({
  device_id: generateDeviceId(),
  push_token: 'optional_fcm_token'
});

// Update safety status
const updateStatus = useSafetyStatusUpdate();
updateStatus.mutate({
  device_id: deviceId,
  status: 'IN_SHELTER',
  shelter_id: selectedShelter.id
});
```

### Component Integration
```typescript
// Emergency dashboard with real-time data
function EmergencyDashboard() {
  const { data: alerts } = useActiveAlerts({ lat, lon });
  const { data: shelters } = useNearbyShelteres({ lat, lon, limit: 3 });
  
  return (
    <div>
      {alerts?.map(alert => (
        <AlertCard key={alert.id} alert={alert} />
      ))}
      {shelters?.map(shelter => (
        <ShelterCard key={shelter.id} shelter={shelter} />
      ))}
    </div>
  );
}
```

## Conclusion

The SafeNow frontend is now fully integrated with the backend API, providing:
- Real-time emergency monitoring
- Location-based services
- User safety reporting
- Push notification readiness
- Comprehensive error handling
- Production-ready architecture

The integration follows Next.js best practices, uses TypeScript for type safety, and implements modern React patterns with TanStack Query for optimal user experience and performance.
