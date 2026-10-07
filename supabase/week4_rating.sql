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
      ('profiles','favorite_foods','caption_generations','caption_votes','caption_generation_limits') loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

revoke all on public.caption_generations, public.caption_votes, public.caption_generation_limits from anon, authenticated;
grant select on public.caption_generations, public.caption_votes to authenticated;
grant insert (user_id, scene, dish, tone, caption, prompt, system_prompt, model) on public.caption_generations to authenticated;
grant insert (user_id, generation_id, value) on public.caption_votes to authenticated;
grant update (value) on public.caption_votes to authenticated;

create policy caption_read_own on public.caption_generations for select to authenticated
  using ((select auth.uid()) = user_id);
create policy caption_insert_own on public.caption_generations for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy vote_read_own on public.caption_votes for select to authenticated
  using ((select auth.uid()) = user_id);
create policy vote_insert_own on public.caption_votes for insert to authenticated
  with check ((select auth.uid()) = user_id);
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

-- Narrow SECURITY DEFINER boundary: anonymous visitors get published captions
-- and aggregate counts, never owner IDs, other users' votes, or full prompts.
create or replace function public.get_caption_feed(p_sort text default 'new', p_mine boolean default false)
returns table (
  id uuid, caption text, scene text, dish text, tone text, model text,
  created_at timestamptz, score bigint, vote_count bigint, my_vote smallint, is_owner boolean
)
language sql stable security definer set search_path = ''
as $$
  select g.id, g.caption, g.scene, g.dish, g.tone, g.model, g.created_at,
    coalesce(v.score, 0)::bigint, coalesce(v.vote_count, 0)::bigint,
    mine.value, coalesce(g.user_id = auth.uid(), false)
  from public.caption_generations g
  left join lateral (
    select sum(cv.value)::bigint as score, count(*)::bigint as vote_count
    from public.caption_votes cv where cv.generation_id = g.id
  ) v on true
  left join public.caption_votes mine on mine.generation_id = g.id and mine.user_id = auth.uid()
  where (not p_mine or g.user_id = auth.uid())
    and (p_sort <> 'top' or g.created_at >= now() - interval '7 days')
  order by case when p_sort = 'top' then coalesce(v.score, 0) end desc,
    g.created_at desc, g.id
  limit 50;
$$;
revoke all on function public.get_caption_feed(text, boolean) from public;
grant execute on function public.get_caption_feed(text, boolean) to anon, authenticated;

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
