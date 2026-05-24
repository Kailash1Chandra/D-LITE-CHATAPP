-- Fix: ensure groups INSERT policy is correctly in place.
-- groups_select was also querying group_members directly (recursive RLS risk).
-- Replace both using the existing get_my_group_ids() security-definer function.

drop policy if exists "groups_select" on public.groups;
create policy "groups_select" on public.groups
  for select to authenticated
  using (is_public = true or id in (select public.get_my_group_ids()));

drop policy if exists "groups_insert" on public.groups;
create policy "groups_insert" on public.groups
  for insert to authenticated
  with check (auth.uid() = created_by);

drop policy if exists "groups_update" on public.groups;
create policy "groups_update" on public.groups
  for update to authenticated
  using (auth.uid() = created_by);

drop policy if exists "groups_delete" on public.groups;
create policy "groups_delete" on public.groups
  for delete to authenticated
  using (auth.uid() = created_by);
