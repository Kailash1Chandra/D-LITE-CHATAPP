-- Blocked users table
create table if not exists public.blocked_users (
  blocker_id uuid references public.profiles(id) on delete cascade,
  blocked_id  uuid references public.profiles(id) on delete cascade,
  created_at  timestamp with time zone default now(),
  primary key (blocker_id, blocked_id)
);

alter table public.blocked_users enable row level security;

create policy "blocked_select" on public.blocked_users for select to authenticated
  using (auth.uid() = blocker_id);
create policy "blocked_insert" on public.blocked_users for insert to authenticated
  with check (auth.uid() = blocker_id);
create policy "blocked_delete" on public.blocked_users for delete to authenticated
  using (auth.uid() = blocker_id);

-- Allow admins/owners to kick (remove any member except owner)
drop policy if exists "gm_delete" on public.group_members;
create policy "gm_delete" on public.group_members for delete to authenticated
  using (
    auth.uid() = user_id
    or (
      role != 'Owner'
      and group_id in (
        select group_id from public.group_members
        where user_id = auth.uid() and role in ('Owner', 'Admin')
      )
    )
  );
