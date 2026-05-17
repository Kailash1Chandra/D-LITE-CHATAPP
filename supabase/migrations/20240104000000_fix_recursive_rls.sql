-- Fix recursive RLS policies that cause HTTP 500 on nested queries.
--
-- Problem: gm_select policy on group_members queries group_members itself.
-- When PostgREST evaluates this nested embed, RLS triggers a self-referential
-- subquery → query planning explosion → 500.
--
-- Fix: use a SECURITY DEFINER function so the inner lookup bypasses RLS,
-- breaking the recursion.

create or replace function public.get_my_group_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select group_id from group_members where user_id = auth.uid()
$$;

-- group_members: replace recursive policy
drop policy if exists "gm_select" on public.group_members;
create policy "gm_select" on public.group_members for select to authenticated
  using (
    auth.uid() = user_id
    or group_id in (select public.get_my_group_ids())
  );

-- group_messages: same fix — was referencing group_members which had recursive RLS
drop policy if exists "gmsg_select" on public.group_messages;
create policy "gmsg_select" on public.group_messages for select to authenticated
  using (group_id in (select public.get_my_group_ids()));
