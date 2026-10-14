-- General signed-in food preferences. Safe to rerun.
-- The original Week 2 favorite_foods table is not changed.

create table if not exists public.user_food_preferences (
  user_id uuid not null references auth.users(id) on delete cascade,
  food_key text not null check (char_length(food_key) between 1 and 80),
  food_name text not null check (char_length(food_name) between 1 and 80),
  rating smallint not null check (rating between 1 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, food_key)
);

alter table public.user_food_preferences enable row level security;

revoke all on public.user_food_preferences from anon, authenticated;
grant select, insert, update on public.user_food_preferences to authenticated;

drop policy if exists food_preferences_read_own on public.user_food_preferences;
create policy food_preferences_read_own on public.user_food_preferences
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists food_preferences_insert_own on public.user_food_preferences;
create policy food_preferences_insert_own on public.user_food_preferences
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists food_preferences_update_own on public.user_food_preferences;
create policy food_preferences_update_own on public.user_food_preferences
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Preserve ratings already entered through the earlier fixed-sample feature.
insert into public.user_food_preferences (user_id, food_key, food_name, rating, created_at, updated_at)
select r.user_id, lower(trim(f.name)), trim(f.name), r.rating, r.created_at, r.updated_at
from public.favorite_food_ratings r
join public.favorite_foods f on f.id = r.food_id
on conflict (user_id, food_key) do update
set food_name = excluded.food_name,
    rating = excluded.rating,
    updated_at = excluded.updated_at;
