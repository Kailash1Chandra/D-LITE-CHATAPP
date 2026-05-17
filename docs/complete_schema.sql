-- ============================================================
--  D-Lite — Complete Database Schema
--  Safe to re-run on an existing DB (idempotent).
--  Fresh project: paste into Supabase SQL Editor → Run
-- ============================================================


-- ── Extensions ───────────────────────────────────────────────

create extension if not exists "uuid-ossp";


-- ── Tables ───────────────────────────────────────────────────

create table if not exists public.profiles (
  id            uuid        primary key references auth.users on delete cascade,
  email         text,
  username      text        unique,
  display_name  text,
  avatar_url    text,
  bio           text,
  gender        text,
  status        text        default 'Available',
  last_seen_at  timestamptz default now(),
  created_at    timestamptz default now()
);

create table if not exists public.direct_messages (
  id          uuid        primary key default uuid_generate_v4(),
  sender_id   uuid        references public.profiles(id) on delete cascade,
  receiver_id uuid        references public.profiles(id) on delete cascade,
  content     text,
  media_url   text,
  reply_to_id uuid        references public.direct_messages(id) on delete set null,
  status      text        default 'sent',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists public.message_reactions (
  id         uuid        primary key default uuid_generate_v4(),
  message_id uuid        references public.direct_messages(id) on delete cascade,
  user_id    uuid        references public.profiles(id) on delete cascade,
  emoji      text,
  created_at timestamptz default now(),
  unique(message_id, user_id, emoji)
);

create table if not exists public.groups (
  id          uuid        primary key default uuid_generate_v4(),
  name        text        not null,
  description text,
  avatar_url  text,
  is_public   boolean     default false,
  created_by  uuid        references public.profiles(id) on delete set null,
  created_at  timestamptz default now()
);

create table if not exists public.group_members (
  group_id  uuid        references public.groups(id) on delete cascade,
  user_id   uuid        references public.profiles(id) on delete cascade,
  role      text        default 'Member',
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);

create table if not exists public.group_messages (
  id          uuid        primary key default uuid_generate_v4(),
  group_id    uuid        references public.groups(id) on delete cascade,
  sender_id   uuid        references public.profiles(id) on delete set null,
  content     text,
  media_url   text,
  reply_to_id uuid        references public.group_messages(id) on delete set null,
  created_at  timestamptz default now()
);

create table if not exists public.calls (
  id          uuid        primary key default uuid_generate_v4(),
  caller_id   uuid        references public.profiles(id) on delete cascade,
  receiver_id uuid        references public.profiles(id) on delete set null,
  group_id    uuid        references public.groups(id) on delete set null,
  type        text,
  status      text        default 'connecting',
  started_at  timestamptz default now(),
  ended_at    timestamptz
);


-- ── Helper function (breaks RLS recursion) ───────────────────
--
-- SECURITY DEFINER means the inner query runs as the function owner
-- (postgres) and bypasses RLS — this prevents infinite recursion when
-- group_members policies reference group_members themselves.

create or replace function public.get_my_group_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select group_id from group_members where user_id = auth.uid()
$$;


-- ── Trigger: auto-create profile on signup ────────────────────
--
-- Handles username conflicts by appending a random suffix.
-- Wrapped in EXCEPTION so a profile failure never blocks account creation.

create or replace function public.handle_new_user()
returns trigger as $$
declare
  _username text;
begin
  _username := new.raw_user_meta_data->>'username';

  if _username is not null and exists (
    select 1 from public.profiles where username = _username
  ) then
    _username := _username || '_' || substr(md5(random()::text), 1, 4);
  end if;

  insert into public.profiles (id, email, username, display_name, avatar_url, gender)
  values (
    new.id,
    new.email,
    _username,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'gender'
  )
  on conflict (id) do update
    set display_name = excluded.display_name,
        avatar_url   = excluded.avatar_url,
        gender       = excluded.gender;

  return new;
exception when others then
  raise warning 'handle_new_user failed: % %', sqlerrm, sqlstate;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ── Row Level Security ────────────────────────────────────────

alter table public.profiles          enable row level security;
alter table public.direct_messages   enable row level security;
alter table public.message_reactions enable row level security;
alter table public.groups            enable row level security;
alter table public.group_members     enable row level security;
alter table public.group_messages    enable row level security;
alter table public.calls             enable row level security;


-- profiles
drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_insert" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;

create policy "profiles_select" on public.profiles
  for select to authenticated using (true);
create policy "profiles_insert" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update" on public.profiles
  for update to authenticated using (auth.uid() = id);


-- direct_messages
drop policy if exists "dm_select" on public.direct_messages;
drop policy if exists "dm_insert" on public.direct_messages;
drop policy if exists "dm_update" on public.direct_messages;
drop policy if exists "dm_delete" on public.direct_messages;

create policy "dm_select" on public.direct_messages
  for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "dm_insert" on public.direct_messages
  for insert to authenticated with check (auth.uid() = sender_id);
create policy "dm_update" on public.direct_messages
  for update to authenticated using (auth.uid() = sender_id);
create policy "dm_delete" on public.direct_messages
  for delete to authenticated using (auth.uid() = sender_id);


-- message_reactions
drop policy if exists "reactions_select" on public.message_reactions;
drop policy if exists "reactions_insert" on public.message_reactions;
drop policy if exists "reactions_delete" on public.message_reactions;

create policy "reactions_select" on public.message_reactions
  for select to authenticated using (true);
create policy "reactions_insert" on public.message_reactions
  for insert to authenticated with check (auth.uid() = user_id);
create policy "reactions_delete" on public.message_reactions
  for delete to authenticated using (auth.uid() = user_id);


-- groups
drop policy if exists "groups_select" on public.groups;
drop policy if exists "groups_insert" on public.groups;
drop policy if exists "groups_update" on public.groups;
drop policy if exists "groups_delete" on public.groups;

create policy "groups_select" on public.groups
  for select to authenticated
  using (is_public = true or id in (select public.get_my_group_ids()));
create policy "groups_insert" on public.groups
  for insert to authenticated with check (auth.uid() = created_by);
create policy "groups_update" on public.groups
  for update to authenticated using (auth.uid() = created_by);
create policy "groups_delete" on public.groups
  for delete to authenticated using (auth.uid() = created_by);


-- group_members
drop policy if exists "gm_select" on public.group_members;
drop policy if exists "gm_insert" on public.group_members;
drop policy if exists "gm_delete" on public.group_members;

create policy "gm_select" on public.group_members
  for select to authenticated
  using (auth.uid() = user_id or group_id in (select public.get_my_group_ids()));
create policy "gm_insert" on public.group_members
  for insert to authenticated
  with check (
    auth.uid() = user_id or
    group_id in (
      select gm.group_id from public.group_members gm
      where gm.user_id = auth.uid() and gm.role in ('Owner', 'Admin')
    )
  );
create policy "gm_delete" on public.group_members
  for delete to authenticated using (auth.uid() = user_id);


-- group_messages
drop policy if exists "gmsg_select" on public.group_messages;
drop policy if exists "gmsg_insert" on public.group_messages;
drop policy if exists "gmsg_update" on public.group_messages;
drop policy if exists "gmsg_delete" on public.group_messages;

create policy "gmsg_select" on public.group_messages
  for select to authenticated
  using (group_id in (select public.get_my_group_ids()));
create policy "gmsg_insert" on public.group_messages
  for insert to authenticated
  with check (auth.uid() = sender_id and group_id in (select public.get_my_group_ids()));
create policy "gmsg_update" on public.group_messages
  for update to authenticated using (auth.uid() = sender_id);
create policy "gmsg_delete" on public.group_messages
  for delete to authenticated using (auth.uid() = sender_id);


-- calls
drop policy if exists "calls_select" on public.calls;
drop policy if exists "calls_insert" on public.calls;
drop policy if exists "calls_update" on public.calls;

create policy "calls_select" on public.calls
  for select to authenticated
  using (auth.uid() = caller_id or auth.uid() = receiver_id);
create policy "calls_insert" on public.calls
  for insert to authenticated with check (auth.uid() = caller_id);
create policy "calls_update" on public.calls
  for update to authenticated
  using (auth.uid() = caller_id or auth.uid() = receiver_id);


-- ── Grants ───────────────────────────────────────────────────
--
-- After a fresh DROP + re-CREATE, Supabase does not automatically
-- re-grant table access. Without these, all REST API calls return 403.

grant usage on schema public to anon, authenticated;

grant select                       on public.profiles          to anon, authenticated;
grant insert, update               on public.profiles          to authenticated;

grant select, insert, update, delete on public.direct_messages   to authenticated;
grant select, insert, delete         on public.message_reactions  to authenticated;

grant select                         on public.groups             to anon, authenticated;
grant insert, update, delete         on public.groups             to authenticated;

grant select, insert, delete         on public.group_members      to authenticated;
grant select, insert, update, delete on public.group_messages     to authenticated;

grant select, insert, update         on public.calls              to authenticated;

grant execute on function public.get_my_group_ids() to authenticated;


-- ── Realtime ──────────────────────────────────────────────────

alter publication supabase_realtime add table public.direct_messages;
alter publication supabase_realtime add table public.message_reactions;
alter publication supabase_realtime add table public.group_messages;
alter publication supabase_realtime add table public.profiles;
