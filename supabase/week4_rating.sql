-- Week 4, same Supabase project as Weeks 2–3. Run in SQL Editor.
-- Transactional and safe to rerun; no user data is deleted.
begin;

create table if not exists public.caption_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scene text not null check (char_length(scene) between 10 and 500),
  dish text not null check (dish in ('pizza','ramen','sushi','tacos','bagel','coffee')),
  tone text not null check (tone in ('Deadpan','Chronically online','Wholesome')),
  caption text not null check (char_length(caption) between 1 and 240),
  prompt text not null check (char_length(prompt) between 1 and 2000),
  system_prompt text not null check (char_length(system_prompt) between 1 and 4000),
  model text not null check (char_length(model) between 1 and 100),
  created_at timestamptz not null default now()
);
-- Extend earlier Week 4 schemas without deleting rows.
alter table public.caption_generations add column if not exists animal_action text not null default 'Eating with a spoon';
alter table public.caption_generations drop constraint if exists caption_generations_scene_check;
alter table public.caption_generations add constraint caption_generations_scene_check check(char_length(scene) <= 500);
alter table public.caption_generations drop constraint if exists food_animal_action_check;
alter table public.caption_generations add constraint food_animal_action_check check(animal_action in ('Eating with a spoon','Holding a tiny fork','Sneaking a bite'));
alter table public.caption_generations add column if not exists reply_style text not null default 'Roast';
alter table public.caption_generations add column if not exists language text not null default 'English';
alter table public.caption_generations add column if not exists media_kind text not null default 'image';
alter table public.caption_generations drop constraint if exists caption_generations_caption_check;
alter table public.caption_generations add constraint caption_generations_caption_check check(char_length(caption) between 1 and 800);
alter table public.caption_generations drop constraint if exists food_pet_post_check;
alter table public.caption_generations add constraint food_pet_post_check check(reply_style in ('Roast','Hype','Roast then hype') and language in ('English','中文') and media_kind in ('image','animal_text','chef_text'));
alter table public.caption_generations add column if not exists original_path text;
alter table public.caption_generations add column if not exists image_path text;
alter table public.caption_generations add column if not exists restaurant text not null default '';
alter table public.caption_generations add column if not exists neighborhood text not null default '';
alter table public.caption_generations add column if not exists display_name text not null default 'Food explorer';
alter table public.caption_generations add column if not exists published_at timestamptz;
alter table public.caption_generations drop constraint if exists caption_generations_dish_check;
alter table public.caption_generations add constraint caption_generations_dish_check check(char_length(dish) between 1 and 80);
alter table public.caption_generations drop constraint if exists caption_generations_tone_check;
alter table public.caption_generations add constraint caption_generations_tone_check check(tone in ('Gordon Ramsay','Cat','Dog','Kitten','Puppy','Bunny','Editorial','Cozy café','Food poster','Deadpan','Chronically online','Wholesome'));
alter table public.caption_generations drop constraint if exists food_photo_metadata_check;
alter table public.caption_generations add constraint food_photo_metadata_check check(
  char_length(restaurant) <= 100 and char_length(neighborhood) <= 80 and char_length(display_name) <= 80
  and (original_path is null or split_part(original_path, '/', 1) = user_id::text)
  and (image_path is null or split_part(image_path, '/', 1) = user_id::text)
);
create table if not exists public.food_saves (
  user_id uuid not null references auth.users(id) on delete cascade,
  generation_id uuid not null references public.caption_generations(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id, generation_id)
);
create or replace function public.is_published_food_post(post_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.caption_generations where id = post_id and published_at is not null and (image_path is not null or (media_kind = 'chef_text' and original_path is not null))); $$;
revoke all on function public.is_published_food_post(uuid) from public;
grant execute on function public.is_published_food_post(uuid) to anon, authenticated;

create table if not exists public.caption_votes (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references public.caption_generations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  value smallint not null check (value in (-1,1)),
  created_at timestamptz not null default now(),
  unique(user_id, generation_id)
);
create table if not exists public.caption_generation_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  day date not null,
  attempts integer not null default 0,
  last_attempt timestamptz
);
create index if not exists caption_generations_created_idx on public.caption_generations(created_at desc);
create index if not exists caption_generations_owner_idx on public.caption_generations(user_id, created_at desc);
create index if not exists caption_votes_generation_idx on public.caption_votes(generation_id);

-- Enable RLS for ALL application tables. Unknown tables retain their existing
-- policies; an unknown table with no policy denies access by default.
do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end $$;

-- Replace policies only for these app-owned tables; permissive policies combine
-- with OR, so retaining an old broad policy would defeat an owner-only policy.
do $$
declare p record;
begin
  for p in select tablename, policyname from pg_policies
    where schemaname = 'public' and tablename in
      ('profiles','favorite_foods','caption_generations','caption_votes','caption_generation_limits','food_saves') loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

revoke all on public.caption_generations, public.caption_votes, public.caption_generation_limits, public.food_saves from anon, authenticated;
grant select on public.caption_generations, public.caption_votes to authenticated;
grant insert (user_id, scene, dish, tone, animal_action, reply_style, language, media_kind, caption, prompt, system_prompt, model, original_path, image_path, restaurant, neighborhood, display_name) on public.caption_generations to authenticated;
grant insert (user_id, generation_id, value) on public.caption_votes to authenticated;
grant update (value) on public.caption_votes to authenticated;
grant update (published_at) on public.caption_generations to authenticated;
grant select, insert, delete on public.food_saves to authenticated;

create policy caption_read_own on public.caption_generations for select to authenticated
  using ((select auth.uid()) = user_id);
create policy caption_insert_own on public.caption_generations for insert to authenticated
  with check ((select auth.uid()) = user_id and original_path is not null and (image_path is not null or (media_kind = 'chef_text' and original_path is not null)));
create policy photo_publish_own on public.caption_generations for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id and original_path is not null and (image_path is not null or (media_kind = 'chef_text' and original_path is not null)));
create policy saves_read_own on public.food_saves for select to authenticated using ((select auth.uid()) = user_id);
create policy saves_insert_own on public.food_saves for insert to authenticated
  with check ((select auth.uid()) = user_id and public.is_published_food_post(generation_id));
create policy saves_remove_own on public.food_saves for delete to authenticated using ((select auth.uid()) = user_id);
create policy vote_read_own on public.caption_votes for select to authenticated
  using ((select auth.uid()) = user_id);
create policy vote_insert_own on public.caption_votes for insert to authenticated
  with check ((select auth.uid()) = user_id and public.is_published_food_post(generation_id));
create policy vote_update_own on public.caption_votes for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
-- No direct access policies for limits. Only the atomic function can change them.

-- Preserve Week 3 profile editing while keeping every other user's data private.
revoke all on public.profiles from anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
create policy week4_profile_read on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy week4_profile_insert on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy week4_profile_update on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- The original food collection is public, read-only reference content.
revoke all on public.favorite_foods from anon, authenticated;
grant select on public.favorite_foods to anon, authenticated;
create policy week4_foods_read on public.favorite_foods for select to anon, authenticated using (true);

-- Narrow public feed: no owner IDs or private prompts. Only the caller can see drafts.
drop function if exists public.get_caption_feed(text, boolean);
drop function if exists public.get_caption_feed(text, boolean, boolean, text, uuid);
create function public.get_caption_feed(p_sort text default 'new', p_mine boolean default false, p_saved boolean default false, p_area text default '', p_post uuid default null)
returns table (
  id uuid, caption text, scene text, dish text, tone text, animal_action text, reply_style text, language text, media_kind text, model text,
  created_at timestamptz, score bigint, vote_count bigint, my_vote smallint, is_owner boolean,
  original_path text, image_path text, restaurant text, neighborhood text, display_name text, published_at timestamptz, is_saved boolean
)
language sql stable security definer set search_path = ''
as $$
  select g.id, g.caption, g.scene, g.dish, g.tone, g.animal_action, g.reply_style, g.language, g.media_kind, g.model, g.created_at,
    coalesce(v.score, 0)::bigint, coalesce(v.vote_count, 0)::bigint,
    mine.value, coalesce(g.user_id = auth.uid(), false),
    g.original_path, g.image_path, g.restaurant, g.neighborhood, g.display_name, g.published_at,
    exists(select 1 from public.food_saves saved where saved.generation_id = g.id and saved.user_id = auth.uid())
  from public.caption_generations g
  left join lateral (
    select sum(cv.value)::bigint as score, count(*)::bigint as vote_count
    from public.caption_votes cv where cv.generation_id = g.id
  ) v on true
  left join public.caption_votes mine on mine.generation_id = g.id and mine.user_id = auth.uid()
  where (g.published_at is not null or (p_mine and g.user_id = auth.uid()))
    and g.media_kind = 'chef_text' and g.original_path is not null
    and (not p_mine or g.user_id = auth.uid())
    and (not p_saved or exists(select 1 from public.food_saves saved where saved.generation_id = g.id and saved.user_id = auth.uid()))
    and (p_area = '' or g.neighborhood = p_area)
    and (p_post is null or g.id = p_post)
    and (p_sort <> 'top' or g.published_at >= now() - interval '7 days')
  order by case when p_sort = 'top' then coalesce(v.score, 0) end desc,
    coalesce(g.published_at, g.created_at) desc, g.id
  limit 50;
$$;
revoke all on function public.get_caption_feed(text, boolean, boolean, text, uuid) from public;
grant execute on function public.get_caption_feed(text, boolean, boolean, text, uuid) to anon, authenticated;

-- Storage remains private. RLS exposes only the owner's files or photos used
-- in published posts; signed URLs expire after one hour.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('food-photos','food-photos',false,10485760,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false, file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;
create or replace function public.food_photo_visible(photo_path text)
returns boolean language sql stable security definer set search_path = ''
as $$ select (auth.uid() is not null and split_part(photo_path,'/',1) = auth.uid()::text)
  or exists(select 1 from public.caption_generations where published_at is not null and (original_path = photo_path or image_path = photo_path)); $$;
create or replace function public.food_photo_referenced(photo_path text)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.caption_generations where original_path = photo_path or image_path = photo_path); $$;
revoke all on function public.food_photo_visible(text), public.food_photo_referenced(text) from public;
grant execute on function public.food_photo_visible(text) to anon, authenticated;
grant execute on function public.food_photo_referenced(text) to authenticated;
drop policy if exists week4_photo_read on storage.objects;
create policy week4_photo_read on storage.objects for select to anon, authenticated
  using (bucket_id='food-photos' and public.food_photo_visible(name));
drop policy if exists week4_photo_upload on storage.objects;
create policy week4_photo_upload on storage.objects for insert to authenticated
  with check (bucket_id='food-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists week4_photo_remove_orphan on storage.objects;
create policy week4_photo_remove_orphan on storage.objects for delete to authenticated
  using (bucket_id='food-photos' and (storage.foldername(name))[1] = (select auth.uid())::text and not public.food_photo_referenced(name));

-- Row lock enforces the limit across concurrent requests and Vercel instances.
-- Attempts include provider failures; the UI explicitly says "attempts".
create or replace function public.claim_caption_generation()
returns text language plpgsql security definer set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  today date := (now() at time zone 'America/New_York')::date;
  limits public.caption_generation_limits%rowtype;
begin
  if caller is null then raise exception 'Authentication required'; end if;
  insert into public.caption_generation_limits(user_id, day)
    values(caller, today) on conflict(user_id) do nothing;
  select * into limits from public.caption_generation_limits where user_id = caller for update;
  if limits.last_attempt > now() - interval '30 seconds' then return 'cooldown'; end if;
  if limits.day = today and limits.attempts >= 10 then return 'daily_limit'; end if;
  update public.caption_generation_limits set day = today,
    attempts = case when limits.day = today then limits.attempts + 1 else 1 end,
    last_attempt = now() where user_id = caller;
  return 'ok';
end;
$$;
revoke all on function public.claim_caption_generation() from public, anon;
grant execute on function public.claim_caption_generation() to authenticated;
commit;

-- Verification: every row should have rls_enabled = true. Inspect existing
-- policies on any additional tables: enabling RLS alone cannot narrow them.
select t.tablename, c.relrowsecurity as rls_enabled
from pg_tables t join pg_class c on c.relname = t.tablename
join pg_namespace n on n.oid = c.relnamespace and n.nspname = t.schemaname
where t.schemaname = 'public' order by t.tablename;
select tablename, policyname, roles, cmd, qual, with_check
from pg_policies where schemaname = 'public' order by tablename, policyname;
