# SafeNow - Quick Start

**System alertów i schronów awaryjnych - tylko to co potrzeba żeby odpalić.**

## Backend (Django API)

```bash
cd safenow
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py load_demo  # Ładuje przykładowe dane
python manage.py runserver  # http://localhost:8000

## 🔐 Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| **User** | `user@safenow.com` | `user` |
| **Admin** | `admin@safenow.com` | `admin` |

## Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev  # http://localhost:3000
```

## Gotowe!

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/health/
- **Admin Panel**: http://localhost:8000/admin/ (django admin)

## Szybki test

```bash
# Sprawdź czy API działa
curl http://localhost:8000/api/health/

# Stwórz alert testowy
curl -X POST http://localhost:8000/api/simulate-alert/ \
  -H "Content-Type: application/json" \
  -d '{"hazard_type":"MISSILE","center_lat":52.22,"center_lon":21.01,"radius_m":5000,"severity":"CRITICAL","valid_minutes":10}'
```

**Koniec. Więcej szczegółów w README.md**
