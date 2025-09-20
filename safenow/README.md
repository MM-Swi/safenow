# SafeNow - Civilian Safety API

**SafeNow tells you where to go and what to do when seconds matter. Not a social app — a life-saving one.**

A Django REST Framework backend for real-time safety alerts, shelter locations, and emergency response coordination.

## Features

- **🏥 Shelter Locator**: Find nearest shelters with walking distance and ETA calculations
- **🚨 Active Alerts**: Real-time hazard alerts with geo-filtering
- **📱 Device Management**: Register devices for push notifications
- **🛡️ Safety Status**: Track user safety status and shelter check-ins
- **📊 Health Monitoring**: System health and statistics endpoint
- **📥 Data Import**: CSV import for shelter data management

## Quick Start

### 1. Setup Environment

```bash
# Create virtual environment
make venv

# Or manually:
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Database Setup

```bash
# Create PostgreSQL database and user
createdb safenow
createuser -s safenow

# Copy environment file
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
make migrate
```

### 3. Import Sample Data

```bash
# Import Warsaw shelter sample data
python manage.py import_shelters fixtures/shelters_sample.csv

# Verify import
python manage.py shell -c "from shelters.models import Shelter; print(f'Shelters: {Shelter.objects.count()}')"
```

### 4. Start Development Server

```bash
make run
# Server runs at http://localhost:8000
```

### 5. Access Django Admin

```bash
# Create superuser (if not already created)
python manage.py createsuperuser

# Access admin interface
open http://localhost:8000/admin/
```

**Admin Features for Live Demo:**
- **Shelters**: View/edit shelter data with filters for type, status, and verification
- **Alerts**: Manage emergency alerts with "Expire now" bulk action
- **Devices**: Monitor registered devices and their push tokens
- **Safety Status**: Track user safety reports and shelter check-ins

## Demo Shortcuts

SafeNow includes convenient management commands to quickly load and reset demo data for presentations and testing.

### Load Demo Data

```bash
# Load complete demo dataset
python manage.py load_demo
```

**Expected Output:**
```
Loading SafeNow demo data...

1. Loading shelter data...
   ✓ Shelters loaded successfully
2. Loading device data...
   ✓ Demo devices loaded successfully
3. Creating demo alerts...
   ✓ Created CRITICAL MISSILE alert (ID: 10)
   ✓ Created MEDIUM FIRE alert (ID: 11)

Summary:
  Shelters: 8
  Active alerts: 2
  Devices: 2
  Safety statuses: 0

Ready for demo! Visit:
  • API: http://localhost:8000/api/health/
  • Admin: http://localhost:8000/admin/
  • Docs: http://localhost:8000/api/docs/
```

### Reset Demo Data

```bash
# Reset and reload fresh demo data
python manage.py reset_demo --yes

# Interactive mode (prompts for confirmation)
python manage.py reset_demo
```

**What gets loaded:**
- **8 Warsaw shelters** from `fixtures/shelters_sample.csv`
- **2 demo devices** from `fixtures/devices_sample.json` with fake FCM tokens
- **2 active alerts**: CRITICAL MISSILE + MEDIUM FIRE with realistic durations
- **Push notifications** automatically sent to demo devices (mock mode logs to console)

### Create All Alert Types

For comprehensive testing of all hazard types, use the `create_alerts.py` script to generate alerts for every supported hazard type:

```bash
# Create alerts for all hazard types (AIR_RAID, DRONE, MISSILE, FLOOD, FIRE, INDUSTRIAL)
python create_alerts.py
```


### Quick Demo Verification

```bash
# Check system health
curl http://localhost:8000/api/health/ | jq

# Test nearby shelters
curl "http://localhost:8000/api/nearby-shelters?lat=52.221&lon=21.017&limit=3" | jq

# Check active alerts
curl "http://localhost:8000/api/active-alerts?lat=52.221&lon=21.017" | jq
```

## Quick Smoke Test

Test all core API endpoints with these curl commands:

```bash
# Health check
curl -s http://localhost:8000/api/health | jq

# Import shelters
python manage.py import_shelters fixtures/shelters_sample.csv

# Nearby shelters
curl -s "http://localhost:8000/api/nearby-shelters?lat=52.221&lon=21.017&limit=3" | jq

# Simulate alert
curl -s -X POST http://localhost:8000/api/simulate-alert \
 -H "Content-Type: application/json" \
 -d '{"hazard_type":"MISSILE","center_lat":52.22,"center_lon":21.01,"radius_m":1200,"severity":"CRITICAL","valid_minutes":10}' | jq

# Active alerts
curl -s "http://localhost:8000/api/active-alerts?lat=52.221&lon=21.017" | jq

# Device register
curl -s -X POST http://localhost:8000/api/devices/register \
 -H "Content-Type: application/json" \
 -d '{"device_id":"abc-123","push_token":"demo"}' | jq

# Update status
curl -s -X POST http://localhost:8000/api/status \
 -H "Content-Type: application/json" \
 -d '{"device_id":"abc-123","status":"IN_SHELTER","shelter_id":1}' | jq

# Safety instructions
curl -s "http://localhost:8000/api/safety-instructions?hazard_type=MISSILE&eta_seconds=120" | jq
```

## API Documentation

SafeNow provides interactive API documentation powered by OpenAPI/Swagger.

### 📖 **Interactive Documentation**
- **Swagger UI**: http://localhost:8000/api/docs/
- **OpenAPI Schema**: http://localhost:8000/api/schema/

### **Features**
- **Interactive testing**: Try API calls directly from the browser
- **Parameter documentation**: Detailed descriptions for all query parameters
- **Response schemas**: Complete data models for all endpoints
- **Authentication info**: API key requirements and rate limiting details

### **Quick Links**
```bash
# Open interactive API docs
open http://localhost:8000/api/docs/

# Get OpenAPI schema (JSON)
curl -H "Accept: application/json" http://localhost:8000/api/schema/

# Get OpenAPI schema (YAML)
curl http://localhost:8000/api/schema/
```

## API Collection

SafeNow includes ready-to-use API collections for Postman and VS Code/IntelliJ HTTP clients to streamline testing and development.

### 📦 **Postman Collection**

**File**: `postman/SafeNow.postman_collection.json`

**Features:**
- **Complete endpoint coverage**: All 8 core API endpoints
- **Built-in test scripts**: Automatic validation of responses
- **Environment variables**: Configurable base URL and coordinates
- **Request chaining**: Store device IDs and alert IDs between requests
- **Error scenarios**: Test validation and edge cases

**Usage:**
1. Import `postman/SafeNow.postman_collection.json` into Postman
2. Set environment variables:
   - `baseUrl`: `http://localhost:8000`
   - `userLat`: `52.2297` (Warsaw coordinates)
   - `userLon`: `21.0122`
3. Run collection or individual requests

### 🔥 **VS Code/IntelliJ HTTP Client**

**File**: `requests.http`

**Features:**
- **22 predefined requests**: Core endpoints + error testing + performance scenarios
- **Inline documentation**: Clear descriptions and usage examples
- **Variable templates**: Easy customization of coordinates and IDs
- **Error testing**: Invalid inputs and edge cases
- **Performance testing**: Benchmarking scenarios

**Usage:**
1. Open `requests.http` in VS Code (with REST Client extension) or IntelliJ/PyCharm
2. Modify variables at the top of the file if needed
3. Click "Send Request" on any request line
4. View responses inline

### 🚀 **Quick Test Sequence**

```bash
# 1. Start server
make run

# 2. Load demo data
python manage.py reset_demo --yes

# 3. Test core workflow (using curl or HTTP clients):
# Health → Simulate Alert → Get Active Alerts → Get Nearby Shelters → Register Device → Update Status
```

**Postman Test Results:**
- ✅ All endpoints return expected status codes
- ✅ Response schemas match OpenAPI specification
- ✅ Authentication and validation work correctly
- ✅ Error handling returns proper JSON error format

## API Endpoints

### Health Check
```bash
curl http://localhost:8000/api/health/
```
**Response:**
```json
{
  "status": "ok",
  "version": "mvp",
  "counts": {
    "shelters": 8,
    "active_alerts": 0
  }
}
```

### Find Nearby Shelters
```bash
curl "http://localhost:8000/api/nearby-shelters/?lat=52.2297&lon=21.0122&limit=3"
```
**Response:**
```json
[
  {
    "id": 1,
    "name": "Warsaw Central Station Shelter",
    "address": "Aleje Jerozolimskie 54 Warsaw",
    "distance_km": 0.0,
    "eta_seconds": 0,
    "is_open_now": true
  }
]
```

### Get Active Alerts
```bash
curl "http://localhost:8000/api/active-alerts/?lat=52.2297&lon=21.0122"
```

### Register Device
```bash
curl -X POST http://localhost:8000/api/devices/register/ \
  -H "Content-Type: application/json" \
  -d '{"device_id": "device123", "push_token": "fcm_token_here"}'
```

### Update Safety Status
```bash
curl -X POST http://localhost:8000/api/status/ \
  -H "Content-Type: application/json" \
  -d '{"device_id": "device123", "status": "OK"}'
```

### Create Emergency Alert Simulation
```bash
curl -X POST http://localhost:8000/api/simulate-alert/ \
  -H "Content-Type: application/json" \
  -d '{
    "hazard_type": "MISSILE",
    "severity": "CRITICAL",
    "center_lat": 52.2297,
    "center_lon": 21.0122,
    "radius_m": 5000,
    "valid_minutes": 60
  }'
```

## Data Management

### Import Shelters from CSV

The `import_shelters` management command allows you to import shelter data from CSV files.

**CSV Format:**
```csv
name,address,lat,lon,is_verified,capacity,is_open_now,source
Warsaw Central Station,Aleje Jerozolimskie 54,52.2297,21.0122,true,500,true,municipal
```

**Required Fields:**
- `name`: Shelter name (string)
- `address`: Full address (string)
- `lat`: Latitude (-90 to 90)
- `lon`: Longitude (-180 to 180)
- `is_verified`: Verification status (true/false)
- `capacity`: Maximum capacity (integer or empty)
- `is_open_now`: Current availability (true/false)
- `source`: Data source identifier (string)

**Usage:**
```bash
# Dry run (preview without saving)
python manage.py import_shelters --dry-run path/to/shelters.csv

# Import data
python manage.py import_shelters path/to/shelters.csv

# Import sample data
python manage.py import_shelters fixtures/shelters_sample.csv
```

**Features:**
- **Upsert behavior**: Updates existing shelters based on (name, address, lat, lon)
- **Validation**: Validates coordinates, data types, and required fields
- **Error handling**: Skips invalid rows with detailed error messages
- **Progress reporting**: Shows import summary with success/error counts

## Emergency Simulation Demo

SafeNow includes a powerful simulation system for testing emergency scenarios.

### HTML Simulation Panel

Visit **http://localhost:8000/simulate/** for an interactive web form to create emergency alerts.

**Features:**
- **Bootstrap UI** with real-time validation
- **Preset locations** (Warsaw coordinates)
- **All hazard types**: Air Raid, Drone, Missile, Flood, Fire, Industrial
- **Severity levels**: Low, Medium, High, Critical
- **Configurable radius** and duration
- **Immediate feedback** with alert details

### API Simulation

Create alerts programmatically via the API:

```bash
# Create a critical missile alert
curl -X POST http://localhost:8000/api/simulate-alert/ \
  -H "Content-Type: application/json" \
  -d '{
    "hazard_type": "MISSILE",
    "severity": "CRITICAL",
    "center_lat": 52.2297,
    "center_lon": 21.0122,
    "radius_m": 5000,
    "valid_minutes": 60
  }'
```

**Authentication:**
- **DEBUG=True**: No authentication required (development)
- **DEBUG=False**: Requires `X-API-KEY` header (production)

### Demo Workflow

1. **Import shelter data:**
   ```bash
   python manage.py import_shelters fixtures/shelters_sample.csv
   ```

2. **Create a simulation alert:**
   - Visit http://localhost:8000/simulate/
   - Fill the form with Warsaw coordinates (preset)
   - Select "MISSILE" + "CRITICAL"
   - Set 5000m radius, 60 minutes duration
   - Submit form

3. **Check alert appears in API:**
   ```bash
   # Verify alert is active
   curl "http://localhost:8000/api/active-alerts/?lat=52.2297&lon=21.0122"

   # Check system health shows active alerts
   curl http://localhost:8000/api/health/
   ```

4. **Find nearest shelters:**
   ```bash
   curl "http://localhost:8000/api/nearby-shelters/?lat=52.2297&lon=21.0122&limit=3"
   ```

5. **Register device and update status:**
   ```bash
   # Register device
   curl -X POST http://localhost:8000/api/devices/register/ \
     -H "Content-Type: application/json" \
     -d '{"device_id": "demo_device", "push_token": "demo_token"}'

   # Update safety status to "in shelter"
   curl -X POST http://localhost:8000/api/status/ \
     -H "Content-Type: application/json" \
     -d '{"device_id": "demo_device", "status": "IN_SHELTER", "shelter_id": 1}'
   ```

## Testing

```bash
# Run all tests
make test

# Run specific test suites
python manage.py test api.tests
python manage.py test backend.safenow.common.test_geo
```

## CI Setup

SafeNow uses GitHub Actions for continuous integration with PostgreSQL 16 service container.

### Configuration

- **Platform**: ubuntu-latest
- **Database**: PostgreSQL 16 service container
- **Python**: 3.11 with pip caching
- **Environment**: Based on `.env.example` with CI-specific database overrides

### Triggers

- **Push** to `main` branch
- **Pull requests** to `main` branch

### Environment Setup

The CI environment is configured from `.env.example` with these overrides:
- `DB_HOST=localhost` (points to PostgreSQL service)
- `DB_PORT=5432` (mapped service port)
- `DEBUG=0` (catches production-like issues)
- `FCM_SERVER_KEY=ci-dummy` (prevents crashes from missing keys)

### Database Handling

Django automatically creates a test database with `test_` prefix when running migrations and tests. The PostgreSQL service provides the database server, and Django handles test database lifecycle.

### Monitoring

View CI logs and status in the **Actions** tab of the GitHub repository. Each workflow run shows:
- Dependency installation with pip caching
- Database service health checks
- Migration execution
- Test results with verbose output

## Performance Benchmarking

SafeNow includes a micro-benchmark command to test the performance of the nearby shelters endpoint with geo-optimization features.

### Benchmark Command

```bash
# Benchmark nearby shelters query performance
python manage.py bench_nearby --lat 52.221 --lon 21.017 --n 1000
```

**Parameters:**
- `--lat`: Latitude for the benchmark query (required)
- `--lon`: Longitude for the benchmark query (required)
- `--n`: Number of iterations to run (default: 1000)

**Example Output:**
```
Benchmarking nearby shelters query:
  Location: (52.221, 21.017)
  Iterations: 1000
  Limit: 3

Total shelters in database: 8
Results:
  Shelters in bounding box: 4
  Results returned: 3
  Average query time: 0.85ms
  Total benchmark time: 850.23ms

Nearest shelter:
  Name: Warsaw Central Station Shelter
  Distance: 0.523km
  ETA: 374s
```

### Performance Optimizations

The `/api/nearby-shelters` endpoint implements several optimizations for handling thousands of shelter records:

1. **Database Indexes**: Dedicated indexes on `lat` and `lon` fields for faster range queries
2. **Bounding Box Prefilter**: Reduces search space by ~10km radius before Haversine calculations
3. **Configurable Limits**: Default limit of 3 results, maximum of 20 (user input is clamped)
4. **Two-Stage Query**: Fast SQL bbox filter → Python distance calculation → sort and limit

**Query Strategy:**
- Calculate approximate bounding box using degree deltas
- Filter shelters within bbox using indexed `lat`/`lon` ranges
- Apply precise Haversine distance calculation to filtered results
- Sort by distance and apply user limit

This approach provides good performance for MVPs with thousands of shelters while maintaining accuracy.

## Project Structure

```
safenow/
├── api/                    # Main API endpoints
├── shelters/              # Shelter management
├── alerts/                # Alert system
├── devices/               # Device registration
├── backend/safenow/common/ # Geo utilities
├── fixtures/              # Sample data
└── requirements.txt       # Dependencies
```

## Push Notifications

SafeNow integrates Firebase Cloud Messaging (FCM) for real-time emergency alerts with a testable mock provider for development.

### Push Provider Configuration

SafeNow supports two push notification providers:

- **Mock Provider**: Logs notifications to console (default in DEBUG mode)
- **FCM Provider**: Real Firebase Cloud Messaging for production

**Configure Push Provider:**
```bash
# Add to .env file
PUSH_PROVIDER=mock    # For development/testing (default when DEBUG=1)
PUSH_PROVIDER=fcm     # For production with real FCM

# FCM configuration (required when using fcm provider)
FCM_SERVER_KEY=your-firebase-server-key
```

### Development with Mock Provider

In DEBUG mode, notifications are logged to console instead of sent via FCM:

```bash
# Default in development - notifications logged as:
MOCK PUSH -> token=abc123... title='🚨 Critical Missile' body='Nearest shelter 200m away, ETA 80s' data={...}
```

### Production FCM Setup

1. **Configure FCM for Production:**
   ```bash
   # Add to .env file
   DEBUG=0
   PUSH_PROVIDER=fcm
   FCM_SERVER_KEY=your-firebase-server-key
   ```

2. **Test Push Notifications:**
   ```bash
   # Register device with demo push token
   curl -X POST http://localhost:8000/api/devices/register/ \
     -H "Content-Type: application/json" \
     -d '{"device_id": "test_device", "push_token": "demo_push_token_xyz789", "lat": 52.2297, "lon": 21.0122}'

   # Create alert to trigger automatic push
   curl -X POST http://localhost:8000/api/simulate-alert/ \
     -H "Content-Type: application/json" \
     -d '{"hazard_type": "MISSILE", "severity": "CRITICAL", "center_lat": 52.2297, "center_lon": 21.0122, "radius_m": 5000, "valid_minutes": 60}'

   # Or manually trigger push for existing alert
   python manage.py send_alert_push <alert_id>
   ```

3. **Push Notification Format:**
   - **Title**: `🚨 Critical Missile` (emoji + severity + hazard type)
   - **Body**: `Nearest shelter 200m away, ETA 80s` (distance and walking time)
   - **Data**: Alert details, shelter info, navigation action

### How It Works

- When a new Alert is created, a **post_save signal** automatically triggers
- System finds all devices with push tokens within the alert radius
- For each device, calculates nearest open shelter with distance/ETA
- Sends personalized push notification with shelter guidance
- Failed/expired push tokens are logged for cleanup

## Development Commands

```bash
make venv      # Create virtual environment
make run       # Start development server
make migrate   # Run database migrations
make test      # Run test suite
```

## Security Notes

SafeNow implements several security measures to protect the emergency response system:

### API Security
- **Simulation Endpoint Protection**: `/api/simulate-alert` requires `X-API-KEY` header when `DEBUG=False`
- **Rate Limiting**:
  - General endpoints: 10 requests/minute per IP
  - Simulation endpoint: 3 requests/minute per IP
- **Input Validation**: Strict validation of all request parameters with proper error handling
- **Error Standardization**: All errors return JSON format `{"error": {"code": int, "message": string}}`

### Production Deployment
- **Reverse Proxy Support**: Configure `SECURE_PROXY_SSL_HEADER` when using nginx/traefik
- **Environment Variables**: All sensitive data (API keys, database credentials) via environment variables
- **Debug Mode**: Ensure `DEBUG=False` in production for security and API key enforcement

### Request Validation
- **Coordinate Bounds**: Latitude (-90 to 90), Longitude (-180 to 180)
- **Range Limits**: Alert radius max 50km, duration max 24 hours
- **Data Types**: Strict type checking for all numeric fields
- **String Sanitization**: Whitespace trimming and empty string validation

### Example Production Configuration
```bash
# .env for production
DEBUG=0
SECRET_KEY=your-secure-secret-key
PUSH_PROVIDER=fcm
FCM_SERVER_KEY=your-firebase-key
SIMULATION_API_KEY=your-secure-simulation-key
```

## Technology Stack

- **Backend**: Django 5 + Django REST Framework
- **Database**: PostgreSQL 16
- **Testing**: pytest + pytest-django
- **Geospatial**: Haversine distance calculations
- **API**: RESTful JSON API with throttling

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
SECRET_KEY=your-secret-key
DEBUG=1
DB_NAME=safenow
DB_USER=safenow
DB_PASS=safenow
DB_HOST=localhost
DB_PORT=5432
PUSH_PROVIDER=mock
FCM_SERVER_KEY=your-fcm-key
SIMULATION_API_KEY=your-simulation-key
APP_VERSION=mvp
```

## Contributing

1. Follow Django coding standards
2. Add tests for new features
3. Run `make test` before submitting
4. Use the provided CSV format for shelter data

## License

Built for humanitarian purposes. Emergency response data should be freely accessible.