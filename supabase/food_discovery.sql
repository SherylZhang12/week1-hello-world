-- Incremental update for the existing Week 4 Foodfolio database.
-- Run this whole file in the same project's Supabase SQL Editor.
-- Adds fields/functions; preserves existing posts, photos and auth settings.
begin;
alter table public.caption_generations add column if not exists personal_review text not null default '';
alter table public.caption_generations add column if not exists personal_rating smallint;
alter table public.caption_generations drop constraint if exists food_personal_review_check;
alter table public.caption_generations add constraint food_personal_review_check
  check(char_length(personal_review) <= 1000 and (personal_rating is null or personal_rating between 1 and 5));
create table if not exists public.food_search_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  day date not null,
  attempts integer not null default 0,
  last_attempt timestamptz
);
alter table public.food_search_limits enable row level security;
revoke all on public.food_search_limits from public, anon, authenticated;
-- No direct-access policies: only the authenticated atomic function changes limits.
grant insert (personal_review, personal_rating) on public.caption_generations to authenticated;
drop function if exists public.get_caption_feed(text, boolean);
drop function if exists public.get_caption_feed(text, boolean, boolean, text, uuid);
create function public.get_caption_feed(p_sort text default 'new', p_mine boolean default false, p_saved boolean default false, p_area text default '', p_post uuid default null)
returns table (
  id uuid, caption text, scene text, dish text, tone text, animal_action text, reply_style text, language text, media_kind text, model text,
  created_at timestamptz, score bigint, vote_count bigint, my_vote smallint, is_owner boolean,
  original_path text, image_path text, restaurant text, neighborhood text, display_name text, published_at timestamptz, is_saved boolean, personal_review text, personal_rating smallint
)
language sql stable security definer set search_path = ''
as $$
  select g.id, g.caption, g.scene, g.dish, g.tone, g.animal_action, g.reply_style, g.language, g.media_kind, g.model, g.created_at,
    coalesce(v.score, 0)::bigint, coalesce(v.vote_count, 0)::bigint,
    mine.value, coalesce(g.user_id = auth.uid(), false),
    g.original_path, g.image_path, g.restaurant, g.neighborhood, g.display_name, g.published_at,
    exists(select 1 from public.food_saves saved where saved.generation_id = g.id and saved.user_id = auth.uid()), g.personal_review, g.personal_rating
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

-- Separate restaurant searches from AI credits; concurrent requests serialize.
create or replace function public.claim_food_search()
returns text language plpgsql security definer set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  today date := (now() at time zone 'America/New_York')::date;
  limits public.food_search_limits%rowtype;
begin
  if caller is null then raise exception 'Authentication required'; end if;
  insert into public.food_search_limits(user_id, day) values(caller, today) on conflict(user_id) do nothing;
  select * into limits from public.food_search_limits where user_id = caller for update;
  if limits.last_attempt > now() - interval '15 seconds' then return 'cooldown'; end if;
  if limits.day = today and limits.attempts >= 20 then return 'daily_limit'; end if;
  update public.food_search_limits set day = today,
    attempts = case when limits.day = today then limits.attempts + 1 else 1 end,
    last_attempt = now() where user_id = caller;
  return 'ok';
end;
$$;
revoke all on function public.claim_food_search() from public, anon;
grant execute on function public.claim_food_search() to authenticated;
commit;
