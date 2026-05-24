-- Add avatar background frame color to groups
alter table public.groups add column if not exists avatar_bg text default null;

-- Allow group owner/admin to update avatar_url and avatar_bg
drop policy if exists "groups_update" on public.groups;
create policy "groups_update" on public.groups
  for update to authenticated
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);
