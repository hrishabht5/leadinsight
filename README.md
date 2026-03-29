# ⚡ LeadPulse — Full Stack

Real-time Lead Management CRM for Facebook & Instagram ads.

```
Frontend  →  React + Vite + Tailwind       (port 3000)
Backend   →  FastAPI + Supabase            (port 8000)
Realtime  →  Server-Sent Events (SSE)
Webhooks  →  Meta Graph API
```

---

## 🚀 Quick Start (Local Dev)

### 1. Clone & configure
```bash
git clone https://github.com/yourorg/leadpulse
cd leadpulse

# Backend
cp backend/.env.example backend/.env
# → fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, FACEBOOK_APP_ID, FACEBOOK_APP_SECRET

# Frontend
cp frontend/.env.example frontend/.env
# → fill in VITE_FACEBOOK_APP_ID
```

### 2. Set up Supabase database
1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste the full contents of `backend/supabase_schema.sql` → Run

### 3. Start the stack
```bash
# Option A — Docker (recommended)
docker compose --profile dev up --build
# API:      http://localhost:8000/docs
# Frontend: http://localhost:3000
# ngrok:    http://localhost:4040

# Option B — Manual
# Terminal 1 — Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

### 4. Expose webhook to Meta (dev)
```bash
# If not using Docker ngrok profile:
ngrok http 8000

# Copy the HTTPS URL (e.g. https://abc123.ngrok.io)
# Go to developers.facebook.com → Your App → Webhooks:
#   Callback URL:  https://abc123.ngrok.io/webhook/facebook
#   Verify Token:  value of FACEBOOK_WEBHOOK_VERIFY_TOKEN in backend/.env
#   Field:         leadgen
```

---

## 📁 Project Structure

```
leadpulse/
├── backend/                   FastAPI backend
│   ├── app/
│   │   ├── main.py            App factory, middleware, routers
│   │   ├── core/
│   │   │   ├── config.py      Environment-based settings
│   │   │   └── security.py    JWT + bcrypt
│   │   ├── db/supabase.py     Supabase client singleton
│   │   ├── api/routes/
│   │   │   ├── auth.py        Register, login, FB OAuth
│   │   │   ├── leads.py       CRUD + SSE /stream
│   │   │   ├── webhook.py     Meta webhook receiver
│   │   │   ├── analytics.py   Stats + daily trend
│   │   │   └── users.py       Profile
│   │   ├── schemas/           Pydantic request/response models
│   │   └── services/
│   │       ├── facebook.py    Graph API, signature verify, OAuth
│   │       ├── lead_service.py Supabase DB operations
│   │       └── notifications.py SSE pub/sub broadcast
│   ├── tests/                 pytest test suite
│   ├── supabase_schema.sql    Full DB schema
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                  React + Vite frontend
│   ├── src/
│   │   ├── App.jsx            Router + auth guard
│   │   ├── context/
│   │   │   └── AuthContext.jsx JWT auth state
│   │   ├── hooks/
│   │   │   └── useSSE.js      SSE connection + auto-reconnect
│   │   ├── services/
│   │   │   ├── api.js         Axios instance + interceptors
│   │   │   └── leads.js       Lead + analytics API calls
│   │   ├── components/
│   │   │   ├── AppLayout.jsx  Sidebar + mobile nav + SSE wiring
│   │   │   ├── Sidebar.jsx    Desktop navigation
│   │   │   ├── LeadCard.jsx   Lead list row
│   │   │   ├── LeadPanel.jsx  Lead detail slide-in panel
│   │   │   └── StatCard.jsx   KPI card
│   │   ├── pages/
│   │   │   ├── SplashPage.jsx Landing / marketing
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx ← main page with live SSE
│   │   │   ├── LeadsPage.jsx  Full paginated list
│   │   │   ├── AnalyticsPage.jsx Recharts charts
│   │   │   └── SettingsPage.jsx  FB connect + toggles
│   │   └── utils.js           timeAgo, initials, colorForName
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── docker-compose.yml         Full stack orchestration
```

---

## 🔌 API Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/register` | Public | Create account + workspace |
| POST | `/api/v1/auth/login` | Public | Login → JWT |
| POST | `/api/v1/auth/facebook/connect` | JWT | Connect FB pages via OAuth |
| GET | `/api/v1/leads` | JWT | List leads (filter, search, paginate) |
| GET | `/api/v1/leads/stream?token=` | JWT | **SSE** real-time events |
| GET | `/api/v1/leads/{id}` | JWT | Full lead + notes |
| PATCH | `/api/v1/leads/{id}/status` | JWT | Update status |
| POST | `/api/v1/leads/{id}/notes` | JWT | Add note |
| GET | `/api/v1/analytics/summary` | JWT | Stats by status + source |
| GET | `/api/v1/analytics/trend` | JWT | Daily volume (30 days) |
| GET | `/webhook/facebook` | Public | Meta verification challenge |
| POST | `/webhook/facebook` | Signed | Receive lead events from Meta |

Interactive docs: `http://localhost:8000/docs`

---

## 🏗️ Deploy to Production

### Backend (Railway / Render)
1. Push repo to GitHub
2. Create new service → connect repo → set root to `backend/`
3. Set all env vars from `backend/.env.example`
4. Deploy — Railway/Render auto-detects the Dockerfile

### Frontend (Vercel)
1. Create new project → connect repo → set root to `frontend/`
2. Set `VITE_API_URL=https://your-api-domain.com`
3. Set `VITE_FACEBOOK_APP_ID`
4. Deploy

### Meta Webhook (Production)
1. Go to developers.facebook.com → Webhooks
2. Callback URL: `https://your-api-domain.com/webhook/facebook`
3. Verify Token: your `FACEBOOK_WEBHOOK_VERIFY_TOKEN`
4. Subscribe to `leadgen` field

---

## 🧪 Tests
```bash
cd backend
pytest tests/ -v
```
