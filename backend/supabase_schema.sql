-- ─────────────────────────────────────────────────────────────────────────────
-- LeadPulse — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
-- WORKSPACES  (one per business / account)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid references workspaces(id) on delete cascade,
  email         text unique not null,
  full_name     text,
  phone         text,
  password_hash text not null,
  created_at    timestamptz default now()
);

create index if not exists idx_users_email        on users(email);
create index if not exists idx_users_workspace_id on users(workspace_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- CONNECTED PAGES  (Facebook / Instagram pages linked to a workspace)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists connected_pages (
  id                 uuid primary key default gen_random_uuid(),
  workspace_id       uuid references workspaces(id) on delete cascade,
  page_id            text not null,
  page_name          text,
  page_access_token  text not null,   -- long-lived page token (encrypted at rest via Supabase Vault in prod)
  user_access_token  text,
  created_at         timestamptz default now(),
  unique (workspace_id, page_id)
);

create index if not exists idx_connected_pages_workspace on connected_pages(workspace_id);
create index if not exists idx_connected_pages_page_id  on connected_pages(page_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- LEADS
-- ─────────────────────────────────────────────────────────────────────────────
create type lead_status as enum ('new', 'contacted', 'converted', 'lost');
create type lead_source as enum ('facebook', 'instagram');

create table if not exists leads (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid references workspaces(id) on delete cascade,

  -- Contact info (fetched from Graph API)
  name            text not null default 'Unknown',
  phone           text,
  email           text,
  city            text,

  -- Meta / Ad metadata
  source          lead_source not null default 'facebook',
  fb_lead_id      text,             -- Meta's leadgen_id (unique per submission)
  fb_page_id      text,
  fb_ad_id        text,
  fb_adset_id     text,
  fb_campaign_id  text,
  fb_form_id      text,
  campaign_name   text,
  adset_name      text,
  form_name       text,

  -- CRM state
  status          lead_status not null default 'new',

  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),

  unique (workspace_id, fb_lead_id)   -- prevents duplicate ingestion
);

-- Auto-update updated_at on any row change
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger leads_updated_at
  before update on leads
  for each row execute function update_updated_at();

-- Indexes
create index if not exists idx_leads_workspace_id on leads(workspace_id);
create index if not exists idx_leads_status       on leads(workspace_id, status);
create index if not exists idx_leads_source       on leads(workspace_id, source);
create index if not exists idx_leads_created_at   on leads(workspace_id, created_at desc);
create index if not exists idx_leads_fb_lead_id   on leads(workspace_id, fb_lead_id);
create index if not exists idx_leads_search       on leads using gin(
  to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(phone,'') || ' ' || coalesce(email,'') || ' ' || coalesce(campaign_name,''))
);

-- ─────────────────────────────────────────────────────────────────────────────
-- NOTES
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists notes (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid references leads(id) on delete cascade,
  content     text not null,
  created_by  uuid references users(id) on delete set null,
  created_at  timestamptz default now()
);

create index if not exists idx_notes_lead_id on notes(lead_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- ANALYTICS RPC — Daily trend (called by /api/v1/analytics/trend)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function leads_daily_trend(p_workspace_id uuid, p_days int default 30)
returns table (day date, count bigint)
language sql stable as $$
  select
    date_trunc('day', created_at)::date as day,
    count(*) as count
  from leads
  where workspace_id = p_workspace_id
    and created_at >= now() - (p_days || ' days')::interval
  group by 1
  order by 1 asc;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY  (RLS)
-- Each workspace can only see its own data.
-- The backend uses the service-role key which bypasses RLS.
-- Enable RLS here as a safety net if you ever expose Supabase directly.
-- ─────────────────────────────────────────────────────────────────────────────
alter table workspaces      enable row level security;
alter table users           enable row level security;
alter table connected_pages enable row level security;
alter table leads           enable row level security;
alter table notes           enable row level security;

-- Service role bypasses all RLS — no policies needed for backend use.
-- Add policies here only if you use Supabase client-side auth directly.
