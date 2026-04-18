-- ─────────────────────────────────────────────────────────────────────────────
-- LeadPulse — Complete Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
--
-- This is IDEMPOTENT — safe to run multiple times.
-- Uses "IF NOT EXISTS" for tables and "CREATE OR REPLACE" for functions.
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. WORKSPACES  (one per business / account)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspaces (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. USERS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  email         TEXT UNIQUE NOT NULL,
  full_name     TEXT,
  phone         TEXT,
  password_hash TEXT NOT NULL,
  preferences   JSONB DEFAULT '{}'::jsonb,   -- ✅ NEW: stores notification & lead settings
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- If users table already exists but is missing the preferences column:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'preferences'
  ) THEN
    ALTER TABLE users ADD COLUMN preferences JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE '✅ Added "preferences" column to users table';
  END IF;
END $$;

-- If users table already exists but is missing the updated_at column:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    RAISE NOTICE '✅ Added "updated_at" column to users table';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_email        ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_workspace_id ON users(workspace_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. CONNECTED PAGES  (Facebook / Instagram pages linked to a workspace)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS connected_pages (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id       UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  page_id            TEXT NOT NULL,
  page_name          TEXT,
  page_access_token  TEXT NOT NULL,   -- long-lived page token
  user_access_token  TEXT,
  created_at         TIMESTAMPTZ DEFAULT now(),
  UNIQUE (workspace_id, page_id)
);

CREATE INDEX IF NOT EXISTS idx_connected_pages_workspace ON connected_pages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_connected_pages_page_id  ON connected_pages(page_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. LEADS
-- ─────────────────────────────────────────────────────────────────────────────

-- Create types if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_status') THEN
    CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'converted', 'lost');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_source') THEN
    CREATE TYPE lead_source AS ENUM ('facebook', 'instagram');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Contact info (fetched from Graph API)
  name            TEXT NOT NULL DEFAULT 'Unknown',
  phone           TEXT,
  email           TEXT,
  city            TEXT,

  -- Meta / Ad metadata
  source          lead_source NOT NULL DEFAULT 'facebook',
  fb_lead_id      TEXT,             -- Meta's leadgen_id (unique per submission)
  fb_page_id      TEXT,
  fb_ad_id        TEXT,
  fb_adset_id     TEXT,
  fb_campaign_id  TEXT,
  fb_form_id      TEXT,
  campaign_name   TEXT,
  adset_name      TEXT,
  form_name       TEXT,

  -- CRM state
  status          lead_status NOT NULL DEFAULT 'new',

  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),

  UNIQUE (workspace_id, fb_lead_id)   -- prevents duplicate ingestion
);


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. NOTES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     UUID REFERENCES leads(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notes_lead_id ON notes(lead_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. TRIGGERS — Auto-update updated_at on any row change
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Leads updated_at trigger
DROP TRIGGER IF EXISTS leads_updated_at ON leads;
CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Users updated_at trigger
DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. INDEXES — Performance for common queries
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_leads_workspace_id ON leads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_leads_status       ON leads(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_source       ON leads(workspace_id, source);
CREATE INDEX IF NOT EXISTS idx_leads_created_at   ON leads(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_fb_lead_id   ON leads(workspace_id, fb_lead_id);

-- Full-text search index for search queries
CREATE INDEX IF NOT EXISTS idx_leads_search ON leads USING gin(
  to_tsvector('simple',
    coalesce(name,'') || ' ' ||
    coalesce(phone,'') || ' ' ||
    coalesce(email,'') || ' ' ||
    coalesce(campaign_name,'')
  )
);


-- ─────────────────────────────────────────────────────────────────────────────
-- 8. RPC FUNCTIONS — Called by the backend API
-- ─────────────────────────────────────────────────────────────────────────────

-- 8a. Daily lead volume trend (used by /api/v1/analytics/trend)
CREATE OR REPLACE FUNCTION leads_daily_trend(p_workspace_id UUID, p_days INT DEFAULT 30)
RETURNS TABLE (day DATE, count BIGINT)
LANGUAGE sql STABLE AS $$
  SELECT
    date_trunc('day', created_at)::date AS day,
    count(*) AS count
  FROM leads
  WHERE workspace_id = p_workspace_id
    AND created_at >= now() - (p_days || ' days')::interval
  GROUP BY 1
  ORDER BY 1 ASC;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 9. ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────────────────────────────
-- Each workspace can only see its own data.
-- The backend uses the service-role key which bypasses RLS.
-- Enable RLS here as a safety net if you ever expose Supabase directly.

ALTER TABLE workspaces      ENABLE ROW LEVEL SECURITY;
ALTER TABLE users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE connected_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads           ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes           ENABLE ROW LEVEL SECURITY;

-- Service-role key bypasses all RLS — no explicit policies needed for backend.
-- If you ever use Supabase client-side (anon key), add policies like:
--
-- CREATE POLICY "Users can read own data" ON users
--   FOR SELECT USING (id = auth.uid());
--
-- CREATE POLICY "Users can read workspace leads" ON leads
--   FOR SELECT USING (workspace_id = (
--     SELECT workspace_id FROM users WHERE id = auth.uid()
--   ));


-- ─────────────────────────────────────────────────────────────────────────────
-- ✅ DONE — Schema is ready for LeadPulse
-- ─────────────────────────────────────────────────────────────────────────────
-- Tables created:
--   1. workspaces       — Business accounts
--   2. users            — User accounts with preferences JSONB
--   3. connected_pages  — Facebook/Instagram page integrations
--   4. leads            — CRM leads with full Meta ad metadata
--   5. notes            — Notes attached to leads
--
-- Functions:
--   - update_updated_at()     — Trigger function for auto-timestamps
--   - leads_daily_trend()     — RPC for analytics trend chart
--
-- Indexes:
--   - workspace_id, status, source, created_at, fb_lead_id, full-text search
-- ─────────────────────────────────────────────────────────────────────────────
