-- Make the profile trigger resilient to username conflicts and other errors.
-- Previously, a duplicate username would cause an unhandled exception and
-- Supabase would return HTTP 500 on the signup endpoint.

create or replace function public.handle_new_user()
returns trigger as $$
declare
  _username text;
begin
  _username := new.raw_user_meta_data->>'username';

  -- If username is already taken, append a short random suffix
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
    set
      display_name = excluded.display_name,
      avatar_url   = excluded.avatar_url,
      gender       = excluded.gender;

  return new;
exception when others then
  -- Never block user creation due to profile insert failure.
  -- The profile can be created later via the app.
  raise warning 'handle_new_user: % %', sqlerrm, sqlstate;
  return new;
end;
$$ language plpgsql security definer;
