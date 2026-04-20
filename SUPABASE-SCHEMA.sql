-- Run this entire file in Supabase Dashboard → SQL Editor

-- 1. Users table (replaces Firestore 'users' collection)
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  display_name text,
  photo_url text,
  email_verified boolean default false,
  provider text default 'password',
  providers text[] default array['password'],
  total_videos integer default 0,
  total_clips integer default 0,
  storage_used bigint default 0,
  company text default '',
  plan text default 'Free',
  total_credits integer default 30,
  credits_used integer default 0,
  credits_expiry_date timestamptz,
  subscription_status text default 'none',
  subscription_id text,
  razorpay_customer_id text,
  preferred_currency text,
  max_video_length integer default 900,
  export_quality text default '720p',
  has_watermark boolean default true,
  has_ai_virality_score boolean default false,
  has_custom_branding boolean default false,
  has_priority_processing boolean default false,
  has_api_access boolean default false,
  theme text default 'indigo',
  mode text default 'light',
  notifications jsonb default '{"processing": true, "weekly": true, "marketing": false}',
  created_at timestamptz default now(),
  last_login timestamptz default now()
);

-- 2. Login history (replaces Firestore 'users/{id}/loginHistory')
create table if not exists public.login_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  success boolean default true,
  method text,
  device_type text,
  browser text,
  os text,
  location text,
  ip_address text,
  flagged boolean default false,
  created_at timestamptz default now()
);

-- 3. Videos (replaces Firestore users/{id}/videos subcollection)
create table if not exists public.videos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  title text,
  status text default 'pending',
  progress integer default 0,
  thumbnail_url text,
  video_url text,
  youtube_url text,
  project_name text,
  session_id text,
  video_info jsonb,
  clips jsonb,
  error text,
  export_quality text,
  has_watermark boolean default true,
  ai_virality_score integer,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Subscriptions (replaces Firestore 'users/{id}/subscriptions')
create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  plan text not null,
  status text not null,
  razorpay_subscription_id text,
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz default now()
);

-- 5. Transactions (replaces Firestore 'users/{id}/transactions')
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  amount numeric not null,
  currency text default 'INR',
  status text not null,
  razorpay_payment_id text,
  plan text,
  created_at timestamptz default now()
);

-- 6. Social connections (replaces Firestore 'user_social_connections')
create table if not exists public.user_social_connections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  platform text not null,
  access_token text,
  refresh_token text,
  channel_id text,
  channel_name text,
  connected_at timestamptz default now(),
  expires_at timestamptz
);

-- 7. Usage tracking (replaces Firestore 'users/{id}/usage' subcollection)
create table if not exists public.usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  month_year text not null,
  subscription_id text,
  plan_name text,
  total_credits integer default 0,
  videos_processed integer default 0,
  total_minutes_used integer default 0,
  credits_remaining integer default 0,
  warnings_sent jsonb default '{"at75Percent": false, "at90Percent": false, "at100Percent": false}',
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, month_year)
);

-- Atomic credit increment function (replaces FieldValue.increment — prevents race conditions)
create or replace function increment_credits_used(p_user_id uuid, p_amount integer)
returns void language sql as $$
  update public.users set credits_used = credits_used + p_amount where id = p_user_id;
$$;

-- Enable Row Level Security on all tables (users can only see their own data)
alter table public.users enable row level security;
alter table public.login_history enable row level security;
alter table public.videos enable row level security;
alter table public.subscriptions enable row level security;
alter table public.transactions enable row level security;
alter table public.user_social_connections enable row level security;

-- RLS Policies (replaces Firestore security rules)
create policy "Users can read own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = id);

create policy "Users can read own login history" on public.login_history for select using (auth.uid() = user_id);
create policy "Users can insert own login history" on public.login_history for insert with check (auth.uid() = user_id);

create policy "Users can read own videos" on public.videos for select using (auth.uid() = user_id);
create policy "Users can insert own videos" on public.videos for insert with check (auth.uid() = user_id);
create policy "Users can update own videos" on public.videos for update using (auth.uid() = user_id);
create policy "Users can delete own videos" on public.videos for delete using (auth.uid() = user_id);

create policy "Users can read own subscriptions" on public.subscriptions for select using (auth.uid() = user_id);
create policy "Users can read own transactions" on public.transactions for select using (auth.uid() = user_id);

create policy "Users can read own social connections" on public.user_social_connections for select using (auth.uid() = user_id);
create policy "Users can manage own social connections" on public.user_social_connections for all using (auth.uid() = user_id);
