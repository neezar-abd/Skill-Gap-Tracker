-- ============================================================
-- Skill Gap Tracker — Supabase SQL Schema
-- Jalankan di Supabase SQL Editor (Settings → SQL Editor)
-- ============================================================

-- Enable UUID
create extension if not exists "uuid-ossp";

-- ── 1. job_roles (Master Data) ────────────────────────────────
create table public.job_roles (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  description text,
  created_at  timestamptz default now()
);

-- ── 2. skills (Master Data) ───────────────────────────────────
create table public.skills (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  category    text,           -- 'programming' | 'tools' | 'knowledge' | 'design'
  created_at  timestamptz default now()
);

-- ── 3. job_role_skills (Relasi Role ↔ Skill) ─────────────────
create table public.job_role_skills (
  id          uuid primary key default uuid_generate_v4(),
  job_role_id uuid not null references public.job_roles(id) on delete cascade,
  skill_id    uuid not null references public.skills(id) on delete cascade,
  importance  text not null default 'required', -- 'required' | 'nice_to_have'
  unique (job_role_id, skill_id)
);

-- ── 4. profiles ───────────────────────────────────────────────
-- id sama dengan auth.users.id (1-to-1)
create table public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  current_role     text,
  target_role_id   uuid references public.job_roles(id) on delete set null,
  readiness_score  numeric(5,2) default 0,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ── 5. user_skills (Skill yang Dimiliki User) ─────────────────
create table public.user_skills (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  skill_id   uuid not null references public.skills(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, skill_id)
);

-- ── 6. user_progress (Tracking Belajar) ──────────────────────
create table public.user_progress (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  skill_id     uuid not null references public.skills(id) on delete cascade,
  status       text not null default 'learning', -- 'learning' | 'completed'
  completed_at timestamptz,
  created_at   timestamptz default now(),
  unique (user_id, skill_id)
);

-- ── 7. roadmaps (Cache AI Roadmap) ───────────────────────────
create table public.roadmaps (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  target_role_id uuid references public.job_roles(id) on delete set null,
  content        jsonb,   -- hasil dari Gemini
  gap_skills     jsonb,   -- snapshot skill gap saat generate
  created_at     timestamptz default now()
);

-- ============================================================
-- Row Level Security (RLS)
-- User hanya bisa baca/tulis data miliknya sendiri
-- ============================================================

alter table public.profiles enable row level security;
alter table public.user_skills enable row level security;
alter table public.user_progress enable row level security;
alter table public.roadmaps enable row level security;

-- profiles
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- user_skills
create policy "Users can manage own skills" on public.user_skills for all using (auth.uid() = user_id);

-- user_progress
create policy "Users can manage own progress" on public.user_progress for all using (auth.uid() = user_id);

-- roadmaps
create policy "Users can manage own roadmaps" on public.roadmaps for all using (auth.uid() = user_id);

-- Master data (job_roles, skills, job_role_skills) bisa dibaca siapa saja
create policy "Public read job_roles" on public.job_roles for select using (true);
create policy "Public read skills" on public.skills for select using (true);
create policy "Public read job_role_skills" on public.job_role_skills for select using (true);
alter table public.job_roles enable row level security;
alter table public.skills enable row level security;
alter table public.job_role_skills enable row level security;
