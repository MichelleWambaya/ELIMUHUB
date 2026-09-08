-- ElimuHub schema (Supabase / Postgres)
-- Run this in the Supabase SQL editor, or via `supabase db push`.

create extension if not exists "uuid-ossp";

-- ========== USERS & PROFILES ==========
-- auth.users is managed by Supabase Auth. This table extends it.
create type user_role as enum ('student', 'teacher', 'admin');
create type teaching_mode as enum ('online', 'in_person', 'both');
create type moderation_status as enum ('draft', 'pending_review', 'approved', 'changes_requested', 'rejected');
create type order_status as enum ('pending', 'paid', 'failed', 'refunded');
create type booking_status as enum ('pending', 'confirmed', 'cancelled', 'completed');
create type payout_status as enum ('pending', 'processing', 'paid', 'failed');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role user_role not null default 'student',
  avatar_url text,
  created_at timestamptz not null default now()
);

-- A user becomes a "teacher" by having a teacher_profiles row, and can
-- independently offer tutoring by having a tutor_profiles row. The two
-- are not tied together.
create table teacher_profiles (
  user_id uuid primary key references profiles(id) on delete cascade,
  bio text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table tutor_profiles (
  user_id uuid primary key references profiles(id) on delete cascade,
  bio text,
  subjects text[] not null default '{}',
  education_levels text[] not null default '{}',
  qualifications text,
  years_experience int,
  teaching_mode teaching_mode not null default 'online',
  location text,
  hourly_rate_kes numeric(10,2) not null default 0,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

-- ========== TAXONOMY ==========
create table subjects (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique
);

create table education_levels (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique
);

create table categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique
);

-- ========== RESOURCES (marketplace products) ==========
create table resources (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text not null,
  category_id uuid references categories(id),
  subject_id uuid references subjects(id),
  education_level_id uuid references education_levels(id),
  price_kes numeric(10,2) not null default 0,
  status moderation_status not null default 'draft',
  rejection_reason text,
  cover_image_path text,
  preview_file_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_resources_status on resources(status);
create index idx_resources_teacher on resources(teacher_id);

create table resource_files (
  id uuid primary key default uuid_generate_v4(),
  resource_id uuid not null references resources(id) on delete cascade,
  storage_path text not null,     -- private bucket path, never public
  file_name text not null,
  created_at timestamptz not null default now()
);

create table moderation_reviews (
  id uuid primary key default uuid_generate_v4(),
  resource_id uuid not null references resources(id) on delete cascade,
  reviewer_id uuid references profiles(id),
  decision moderation_status not null,
  notes text,
  created_at timestamptz not null default now()
);

-- ========== COMMERCE ==========
create table platform_settings (
  key text primary key,
  value jsonb not null
);
insert into platform_settings (key, value) values
  ('commission_rate_default', '0.50');

-- Manual (till/QR) payment settings — edited from the admin panel, not code.
insert into platform_settings (key, value) values
  ('till_number', '""'),
  ('till_qr_url', '""');

-- Minimal starting plans — an admin can edit these from the admin panel.
insert into subscription_plans (name, price_kes, max_resources, featured_listings, description) values
  ('Free', 0, 5, false, 'Up to 5 listed resources, basic profile.'),
  ('Pro', 500, null, true, 'Unlimited resources and featured marketplace placement.');

create table orders (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references profiles(id),
  resource_id uuid not null references resources(id),
  gross_amount_kes numeric(10,2) not null,
  commission_rate numeric(4,3) not null,
  commission_kes numeric(10,2) not null,
  teacher_earnings_kes numeric(10,2) not null,
  status order_status not null default 'pending',
  payment_reference text,
  manual_code text,             -- transaction code the student typed in, for manual verification
  created_at timestamptz not null default now()
);

create index idx_orders_student on orders(student_id);
create index idx_orders_resource on orders(resource_id);

-- Grants a student access to a purchased resource's files.
create table entitlements (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  student_id uuid not null references profiles(id),
  resource_id uuid not null references resources(id),
  created_at timestamptz not null default now(),
  unique (student_id, resource_id)
);

create table teacher_balances (
  teacher_id uuid primary key references profiles(id) on delete cascade,
  pending_kes numeric(10,2) not null default 0,
  available_kes numeric(10,2) not null default 0
);

create table payouts (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references profiles(id),
  amount_kes numeric(10,2) not null,
  status payout_status not null default 'pending',
  requested_at timestamptz not null default now(),
  paid_at timestamptz
);

create table reviews (
  id uuid primary key default uuid_generate_v4(),
  resource_id uuid references resources(id),
  tutor_id uuid references profiles(id),
  student_id uuid not null references profiles(id),
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

-- ========== TUTORING ==========
create table availability (
  id uuid primary key default uuid_generate_v4(),
  tutor_id uuid not null references profiles(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null
);

create table bookings (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references profiles(id),
  tutor_id uuid not null references profiles(id),
  subject text not null,
  session_date date not null,
  start_time time not null,
  end_time time not null,
  price_kes numeric(10,2) not null,
  status booking_status not null default 'pending',
  notes text,
  created_at timestamptz not null default now()
);

create table learners (
  id uuid primary key default uuid_generate_v4(),
  tutor_id uuid not null references profiles(id) on delete cascade,
  student_id uuid not null references profiles(id),
  subject text not null,
  education_level text,
  notes text,
  created_at timestamptz not null default now(),
  unique (tutor_id, student_id, subject)
);

-- Raw M-Pesa C2B confirmations for the till. Buy Goods (till) payments
-- don't carry a custom reference field, so matching to an order is
-- amount-based and can be ambiguous — unmatched ones need an admin to
-- pick the right order by hand (see /admin/c2b/unmatched).
create table c2b_transactions (
  id uuid primary key default uuid_generate_v4(),
  trans_id text not null unique,
  amount_kes numeric(10,2) not null,
  phone text,
  matched_order_id uuid references orders(id),
  raw jsonb,
  created_at timestamptz not null default now()
);

-- ========== SUBSCRIPTIONS (teacher SaaS plans) ==========
create table subscription_plans (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,          -- e.g. 'free', 'starter', 'pro'
  price_kes numeric(10,2) not null default 0,
  billing_period text not null default 'monthly', -- 'monthly' | 'yearly'
  max_resources int,                  -- null = unlimited
  featured_listings boolean not null default false,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table subscriptions (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references profiles(id) on delete cascade,
  plan_id uuid not null references subscription_plans(id),
  status text not null default 'active', -- 'active' | 'cancelled' | 'expired'
  payment_reference text,
  started_at timestamptz not null default now(),
  renews_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_subscriptions_teacher on subscriptions(teacher_id);

-- ========== APPEARANCE / ACCESSIBILITY ==========
create table user_settings (
  user_id uuid primary key references profiles(id) on delete cascade,
  theme text not null default 'dark',           -- 'dark' | 'light'
  accent_color text not null default '62 250 118', -- "r g b" triplet
  font_scale numeric(3,2) not null default 1.0, -- 0.85–1.3
  reduce_motion boolean not null default false,
  high_contrast boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ========== ANNOUNCEMENTS (dashboard feed, not marketing content) ==========
create table announcements (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  body text not null,
  audience user_role,       -- null = everyone
  created_at timestamptz not null default now()
);

-- ========== NOTIFICATIONS ==========
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ========== AUDIT ==========
create table audit_log (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references profiles(id),
  action text not null,
  target_table text,
  target_id uuid,
  created_at timestamptz not null default now()
);

-- Row Level Security must be enabled per-table in Supabase before launch.
-- e.g.:
-- alter table resources enable row level security;
-- create policy "public can read approved resources"
--   on resources for select using (status = 'approved');
-- create policy "teacher manages own resources"
--   on resources for all using (teacher_id = auth.uid());
