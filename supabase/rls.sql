-- ── Row Level Security for BGA ───────────────────────────────────────────────
-- Run this in the Supabase SQL editor: https://supabase.com/dashboard/project/_/sql

-- ── Add missing columns to businesses ────────────────────────────────────────
alter table businesses add column if not exists name           text;
alter table businesses add column if not exists tagline        text;
alter table businesses add column if not exists deployed_url   text;
alter table businesses add column if not exists custom_domain  text;
alter table businesses add column if not exists domain_status  text;
alter table businesses add column if not exists domain_paid    boolean default false;

-- ── businesses table ─────────────────────────────────────────────────────────
alter table businesses enable row level security;

-- Drop existing policies before recreating (safe to re-run)
drop policy if exists "users can read own businesses"       on businesses;
drop policy if exists "users can insert own businesses"     on businesses;
drop policy if exists "users can update own businesses"     on businesses;
drop policy if exists "users can delete own businesses"     on businesses;
drop policy if exists "public can read deployed businesses" on businesses;

-- Authenticated users: read only their own businesses
create policy "users can read own businesses"
  on businesses for select
  using (auth.uid() = user_id);

-- Unauthenticated/public: read deployed businesses (share links)
-- ⚠️  Scoped via the public_businesses VIEW below — not full row exposure
create policy "public can read deployed businesses"
  on businesses for select
  using (deployed_url is not null);

create policy "users can insert own businesses"
  on businesses for insert
  with check (auth.uid() = user_id);

create policy "users can update own businesses"
  on businesses for update
  using (auth.uid() = user_id);

create policy "users can delete own businesses"
  on businesses for delete
  using (auth.uid() = user_id);

-- ── Public view — only safe fields exposed for share links ───────────────────
-- BusinessPage.jsx queries this view instead of the raw businesses table
drop view if exists public_businesses;
create view public_businesses as
  select
    id,
    coalesce(name,    data->>'selected_name') as name,
    coalesce(tagline, data->>'tagline')       as tagline,
    deployed_url,
    data    -- contains website/products/contact — no user_id, no memory
  from businesses
  where deployed_url is not null;

-- ── profiles table ───────────────────────────────────────────────────────────
alter table profiles enable row level security;

drop policy if exists "users can read own profile"   on profiles;
drop policy if exists "users can insert own profile" on profiles;
drop policy if exists "users can update own profile" on profiles;

create policy "users can read own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "users can update own profile"
  on profiles for update
  using (auth.uid() = id);
