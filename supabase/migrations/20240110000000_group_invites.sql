-- Group invite system: owner sends invite → user accepts/declines → then added to group_members

create table if not exists public.group_invites (
  id              uuid        primary key default gen_random_uuid(),
  group_id        uuid        not null references public.groups(id) on delete cascade,
  invited_user_id uuid        not null references public.profiles(id) on delete cascade,
  invited_by      uuid        not null references public.profiles(id) on delete cascade,
  status          text        not null default 'pending'
                              check (status in ('pending', 'accepted', 'declined')),
  created_at      timestamptz not null default now(),
  unique (group_id, invited_user_id)
);

alter table public.group_invites enable row level security;

-- Invited user sees their own pending invites
create policy "invites_select_invited" on public.group_invites
  for select to authenticated
  using (auth.uid() = invited_user_id);

-- Group owner/admin sees invites for their group
create policy "invites_select_admin" on public.group_invites
  for select to authenticated
  using (
    exists (
      select 1 from public.group_members
      where group_id = group_invites.group_id
        and user_id = auth.uid()
        and role in ('Owner', 'Admin')
    )
  );

-- Group owner/admin can send invites
create policy "invites_insert" on public.group_invites
  for insert to authenticated
  with check (
    auth.uid() = invited_by and
    exists (
      select 1 from public.group_members
      where group_id = group_invites.group_id
        and user_id = auth.uid()
        and role in ('Owner', 'Admin')
    )
  );

-- Invited user can accept or decline
create policy "invites_update" on public.group_invites
  for update to authenticated
  using (auth.uid() = invited_user_id)
  with check (auth.uid() = invited_user_id);

-- Owner/inviter can cancel an invite
create policy "invites_delete" on public.group_invites
  for delete to authenticated
  using (
    auth.uid() = invited_by or
    exists (
      select 1 from public.group_members
      where group_id = group_invites.group_id
        and user_id = auth.uid()
        and role in ('Owner', 'Admin')
    )
  );

alter publication supabase_realtime add table public.group_invites;
