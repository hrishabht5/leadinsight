# LeadPulse — Backend

FastAPI + Supabase backend for the LeadPulse Lead Management CRM.

## Stack
- **FastAPI** — async Python web framework
- **Supabase** — Postgres database + Auth
- **python-jose** — JWT tokens
- **httpx** — async HTTP client for Meta Graph API
- **SSE** — Server-Sent Events for real-time lead push

---

## Quick Start

### 1. Clone & install
```bash
git clone https://github.com/yourorg/leadpulse-backend
cd leadpulse-backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure environment
```bash
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, FACEBOOK_APP_ID, etc.
```

### 3. Set up Supabase database
1. Create a project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and run the full contents of `supabase_schema.sql`

### 4. Run the server
```bash
uvicorn app.main:app --reload
# API docs: http://localhost:8000/docs
```

### 5. Expose webhook to Meta (dev)
```bash
# Install ngrok: https://ngrok.com
ngrok http 8000
# Copy the HTTPS URL, e.g. https://abc123.ngrok.io
# Set webhook in Meta App Dashboard:
#   Callback URL: https://abc123.ngrok.io/webhook/facebook
#   Verify Token: value from FACEBOOK_WEBHOOK_VERIFY_TOKEN in .env
```

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Create account + workspace |
| POST | `/api/v1/auth/login` | Login, get JWT |
| POST | `/api/v1/auth/facebook/connect` | OAuth — connect FB pages |
| GET | `/api/v1/auth/facebook/pages` | List connected pages |
| GET | `/api/v1/leads` | List leads (paginated) |
| GET | `/api/v1/leads/stream` | **SSE** real-time lead events |
| GET | `/api/v1/leads/{id}` | Single lead detail |
| PATCH | `/api/v1/leads/{id}/status` | Update lead status |
| POST | `/api/v1/leads/{id}/notes` | Add a note |
| GET | `/api/v1/analytics/summary` | Counts by status + source |
| GET | `/api/v1/analytics/trend` | Daily volume (last 30 days) |
| GET | `/webhook/facebook` | Meta webhook verification |
| POST | `/webhook/facebook` | Meta webhook lead events |

Full interactive docs: `http://localhost:8000/docs`

---

## Running Tests
```bash
pytest tests/ -v
```

## Docker
```bash
docker compose up --build          # API + Redis
docker compose --profile dev up    # + ngrok tunnel
```

---

## Meta App Setup Checklist
- [ ] Create a Meta App at developers.facebook.com
- [ ] Add **Facebook Login** and **Leads Access** products
- [ ] Set `FACEBOOK_APP_ID` and `FACEBOOK_APP_SECRET` in `.env`
- [ ] Add webhook: Callback URL = `https://yourdomain.com/webhook/facebook`
- [ ] Set Verify Token = value of `FACEBOOK_WEBHOOK_VERIFY_TOKEN` in `.env`
- [ ] Subscribe to `leadgen` field
- [ ] Connect Facebook account via `/api/v1/auth/facebook/connect`
