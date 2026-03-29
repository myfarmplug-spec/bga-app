-- ── BGA Row Level Security — run in Supabase SQL editor ─────────────────────
-- Safe to re-run (all DROP IF EXISTS guards)

-- ── Add / ensure all required columns ────────────────────────────────────────
alter table businesses add column if not exists name           text;
alter table businesses add column if not exists tagline        text;
alter table businesses add column if not exists idea           text;
alter table businesses add column if not exists deployed_url   text;
alter table businesses add column if not exists custom_domain  text;
alter table businesses add column if not exists domain_status  text;
alter table businesses add column if not exists domain_paid    boolean default false;
alter table businesses add column if not exists is_anonymous   boolean default true;
alter table businesses add column if not exists tokens         int     default 3;

-- ── Enable RLS ────────────────────────────────────────────────────────────────
alter table businesses enable row level security;

-- ── Drop all existing policies (clean slate) ─────────────────────────────────
drop policy if exists "users can read own businesses"        on businesses;
drop policy if exists "users can insert own businesses"      on businesses;
drop policy if exists "users can update own businesses"      on businesses;
drop policy if exists "users can delete own businesses"      on businesses;
drop policy if exists "public can read deployed businesses"  on businesses;
drop policy if exists "anon can insert anonymous businesses" on businesses;
drop policy if exists "anon can update anonymous businesses" on businesses;

-- ── Authenticated users: full access to their own rows ───────────────────────
create policy "users can read own businesses"
  on businesses for select
  using (auth.uid() = user_id);

create policy "users can insert own businesses"
  on businesses for insert
  with check (auth.uid() = user_id);

create policy "users can update own businesses"
  on businesses for update
  using (auth.uid() = user_id);

create policy "users can delete own businesses"
  on businesses for delete
  using (auth.uid() = user_id);

-- ── Anonymous users: can create and update their own anonymous rows ───────────
-- The backend service key bypasses these entirely; these are a safety net
-- for any direct anon-key writes.
create policy "anon can insert anonymous businesses"
  on businesses for insert
  with check (user_id is null and is_anonymous = true);

create policy "anon can update anonymous businesses"
  on businesses for update
  using (user_id is null and is_anonymous = true);

-- ── Public read: any row with a deployed_url is publicly readable ─────────────
create policy "public can read deployed businesses"
  on businesses for select
  using (deployed_url is not null);

-- ── Public view — only safe fields for share links ────────────────────────────
-- BusinessPage.jsx queries this view (no user_id, memory, or internal fields)
drop view if exists public_businesses;
create view public_businesses as
  select
    id,
    coalesce(name,    data->>'selected_name') as name,
    coalesce(tagline, data->>'tagline')        as tagline,
    deployed_url,
    data
  from businesses
  where deployed_url is not null;

-- ── profiles table ────────────────────────────────────────────────────────────
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
