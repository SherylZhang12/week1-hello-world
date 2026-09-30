-- Run once in the Supabase SQL Editor for the existing Week 2 project.
-- Safe to rerun: existing profile details are preserved.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  last_name text,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Also works when a profiles table was created earlier with only an id.
alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_name text;
alter table public.profiles add column if not exists avatar_path text;

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists week3_new_user_profile on auth.users;
create trigger week3_new_user_profile
  after insert on auth.users
  for each row execute procedure public.create_profile_for_new_user();

-- Backfill anyone who signed in before this trigger was installed.
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

alter table public.profiles enable row level security;
grant select, insert, update on public.profiles to authenticated;

drop policy if exists "week3_select_own_profile" on public.profiles;
create policy "week3_select_own_profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "week3_insert_own_profile" on public.profiles;
create policy "week3_insert_own_profile" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);

drop policy if exists "week3_update_own_profile" on public.profiles;
create policy "week3_update_own_profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Keep images in Storage and only their path in the relational table.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "week3_select_own_avatar" on storage.objects;
create policy "week3_select_own_avatar" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "week3_upload_own_avatar" on storage.objects;
create policy "week3_upload_own_avatar" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
