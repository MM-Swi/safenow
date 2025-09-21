# SafeNow Authentication System Setup

This document provides comprehensive setup and usage instructions for the JWT-based authentication system implemented in SafeNow.

## 🚀 Overview

The SafeNow authentication system provides:
- JWT-based authentication with access and refresh tokens
- Custom User model with roles and additional fields
- User profiles with preferences and notification settings
- Comprehensive API endpoints for authentication and user management
- Full integration with Django admin
- Extensive test coverage

## 📋 Features

### 1. Custom User Model
- **Role-based access**: USER (default) and ADMIN roles
- **Additional fields**: phone_number, is_verified, created_at, updated_at
- **Profile integration**: Automatic UserProfile creation via Django signals

### 2. User Profile System
- **Language preferences**: Polish (default), English, Ukrainian
- **Notification settings**: Email, Push, SMS notifications
- **Location settings**: Auto-location detection, alert radius configuration

### 3. JWT Authentication
- **Access tokens**: 60-minute lifetime
- **Refresh tokens**: 7-day lifetime with rotation
- **Token blacklisting**: Secure logout functionality
- **CORS support**: Configured for frontend integration

### 4. API Endpoints
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `POST /api/auth/token/refresh/` - Token refresh
- `GET/PUT /api/auth/me/` - User profile management
- `GET/PUT /api/auth/preferences/` - User preferences
- `POST /api/auth/change-password/` - Password change

## 🛠️ Installation & Setup

### 1. Install Dependencies

The authentication system requires `djangorestframework-simplejwt`:

```bash
# Activate virtual environment
source venv/bin/activate

# Install JWT package (already added to requirements.txt)
pip install djangorestframework-simplejwt>=5.3
```

### 2. Django Settings Configuration

The following settings have been configured in `safenow_project/settings.py`:

```python
# Custom User Model
AUTH_USER_MODEL = 'authentication.User'

# Installed Apps
INSTALLED_APPS = [
    # ... other apps
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'authentication',
]

# DRF Authentication
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    # ... other settings
}

# JWT Configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    # ... other JWT settings
}

# CORS Settings (updated for authentication)
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]
CORS_ALLOW_CREDENTIALS = True
```

### 3. Database Migration

```bash
# Create and apply migrations
python manage.py makemigrations authentication
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

### 4. URL Configuration

Authentication URLs are included in `safenow_project/urls.py`:

```python
urlpatterns = [
    # ... other URLs
    path('api/auth/', include('authentication.urls')),
]
```

## 📚 API Usage Examples

### User Registration

```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "user@example.com",
    "password": "securepass123",
    "password2": "securepass123",
    "first_name": "John",
    "last_name": "Doe",
    "phone_number": "+48123456789"
  }'
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "newuser",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone_number": "+48123456789",
    "role": "USER",
    "is_verified": false,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "profile": {
      "preferred_language": "pl",
      "email_notifications": true,
      "push_notifications": true,
      "sms_notifications": false,
      "auto_location": true,
      "alert_radius": 10
    }
  },
  "tokens": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
}
```

### User Login

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "password": "securepass123"
  }'
```

**Login with Email:**
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user@example.com",
    "password": "securepass123"
  }'
```

### Get User Profile

```bash
curl -X GET http://localhost:8000/api/auth/me/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Update User Profile

```bash
curl -X PUT http://localhost:8000/api/auth/me/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "last_name": "Smith",
    "phone_number": "+48987654321"
  }'
```

### Get User Preferences

```bash
curl -X GET http://localhost:8000/api/auth/preferences/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Update User Preferences

```bash
curl -X PUT http://localhost:8000/api/auth/preferences/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "preferred_language": "en",
    "email_notifications": false,
    "alert_radius": 25
  }'
```

### Change Password

```bash
curl -X POST http://localhost:8000/api/auth/change-password/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "old_password": "securepass123",
    "new_password": "newsecurepass456",
    "new_password2": "newsecurepass456"
  }'
```

### Token Refresh

```bash
curl -X POST http://localhost:8000/api/auth/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "YOUR_REFRESH_TOKEN"
  }'
```

### User Logout

```bash
curl -X POST http://localhost:8000/api/auth/logout/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "YOUR_REFRESH_TOKEN"
  }'
```

## 🔧 Technical Specifications

### User Model Fields

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| username | CharField | Unique username | Required |
| email | EmailField | User email address | Required |
| first_name | CharField | User's first name | Required |
| last_name | CharField | User's last name | Required |
| phone_number | CharField | International phone number | Optional |
| role | CharField | User role (USER/ADMIN) | USER |
| is_verified | BooleanField | Account verification status | False |
| created_at | DateTimeField | Account creation timestamp | Auto |
| updated_at | DateTimeField | Last update timestamp | Auto |

### UserProfile Model Fields

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| preferred_language | CharField | UI language preference | Polish |
| email_notifications | BooleanField | Email notification setting | True |
| push_notifications | BooleanField | Push notification setting | True |
| sms_notifications | BooleanField | SMS notification setting | False |
| auto_location | BooleanField | Auto-location detection | True |
| alert_radius | IntegerField | Alert radius in kilometers | 10 |

### JWT Token Configuration

| Setting | Value | Description |
|---------|-------|-------------|
| ACCESS_TOKEN_LIFETIME | 60 minutes | Access token validity period |
| REFRESH_TOKEN_LIFETIME | 7 days | Refresh token validity period |
| ROTATE_REFRESH_TOKENS | True | Generate new refresh token on refresh |
| BLACKLIST_AFTER_ROTATION | True | Blacklist old refresh tokens |
| UPDATE_LAST_LOGIN | True | Update last_login on token refresh |

## 🧪 Testing

The authentication system includes comprehensive tests covering:

### Model Tests
- User model creation and validation
- UserProfile auto-creation via signals
- Model string representations
- Default values and field constraints

### API Tests
- User registration (success and validation errors)
- User login (username/email, invalid credentials)
- Token-based authentication
- Profile management (get/update)
- Preferences management
- Password change functionality
- Logout and token blacklisting

### Running Tests

```bash
# Run all authentication tests
python manage.py test authentication

# Run specific test class
python manage.py test authentication.tests.UserModelTest

# Run with pytest
pytest authentication/tests.py -v
```

## 🔒 Security Considerations

### Password Validation
- Minimum 8 characters
- Cannot be too similar to username/email
- Cannot be a common password
- Cannot be entirely numeric

### JWT Security
- Tokens signed with Django SECRET_KEY
- Refresh token rotation prevents replay attacks
- Token blacklisting for secure logout
- CORS properly configured for frontend

### API Security
- Authentication required for protected endpoints
- Proper permission classes on all views
- Input validation and sanitization
- Error handling without information leakage

## 🚨 Troubleshooting

### Common Issues

#### 1. Migration Conflicts
If you encounter migration conflicts when adding authentication to existing project:

```bash
# Reset database (development only)
python -c "
import os, django
from django.conf import settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'safenow_project.settings')
django.setup()
from django.db import connection
cursor = connection.cursor()
cursor.execute('DROP SCHEMA public CASCADE;')
cursor.execute('CREATE SCHEMA public;')
cursor.execute('GRANT ALL ON SCHEMA public TO postgres;')
cursor.execute('GRANT ALL ON SCHEMA public TO public;')
"

# Run migrations
python manage.py migrate
```

#### 2. Token Validation Errors
- Ensure `Authorization: Bearer <token>` header format
- Check token expiration (60 minutes for access tokens)
- Verify CORS settings for cross-origin requests

#### 3. User Profile Not Created
If UserProfile is not automatically created:
- Check Django signals are properly connected
- Verify `authentication` app is in INSTALLED_APPS
- Run migrations to ensure signal handlers are registered

## 🔄 Integration with Existing SafeNow Features

### Public Endpoints
All existing emergency service endpoints remain publicly accessible:
- `/api/alerts/` - Emergency alerts
- `/api/shelters/` - Shelter locations
- `/api/safety-instructions/` - Safety guidance

### Future Authentication Integration
The authentication system is ready for:
- Alert ownership and user-submitted alerts
- Voting system for alert verification
- Personalized emergency notifications
- User location preferences for alerts

## 📖 API Documentation

Full API documentation is available at:
- **Swagger UI**: http://localhost:8000/api/docs/
- **OpenAPI Schema**: http://localhost:8000/api/schema/

The authentication endpoints are fully documented with request/response schemas, validation rules, and example payloads.

## 🎯 Next Steps

With the authentication system in place, you can now:

1. **Frontend Integration**: Implement authentication context and hooks in React
2. **Alert Ownership**: Add user ownership to Alert model
3. **Voting System**: Implement alert verification through user voting
4. **Admin Interface**: Enhance Django admin for user and alert management
5. **Email Verification**: Add email verification for new user accounts
6. **Password Reset**: Implement password reset functionality

The authentication foundation is solid and production-ready for SafeNow's emergency response platform!
