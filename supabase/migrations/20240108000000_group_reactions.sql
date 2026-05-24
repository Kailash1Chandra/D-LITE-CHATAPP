-- Reactions for group messages (separate from DM message_reactions)
create table if not exists public.group_message_reactions (
  id uuid default uuid_generate_v4() primary key,
  message_id uuid references public.group_messages(id) on delete cascade,
  user_id    uuid references public.profiles(id) on delete cascade,
  emoji      text not null,
  created_at timestamp with time zone default now(),
  unique (message_id, user_id, emoji)
);

alter table public.group_message_reactions enable row level security;

create policy "gmr_select" on public.group_message_reactions
  for select to authenticated using (true);
create policy "gmr_insert" on public.group_message_reactions
  for insert to authenticated with check (auth.uid() = user_id);
create policy "gmr_delete" on public.group_message_reactions
  for delete to authenticated using (auth.uid() = user_id);

alter publication supabase_realtime add table public.group_message_reactions;
