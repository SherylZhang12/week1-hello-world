-- Week 4 extension: keep the Week 2 favorite_foods rows unchanged and store
-- each signed-in user's score separately. Safe to rerun.

create table if not exists public.favorite_food_ratings (
  user_id uuid not null references auth.users(id) on delete cascade,
  food_id bigint not null references public.favorite_foods(id) on delete cascade,
  rating smallint not null check (rating between 1 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, food_id)
);

alter table public.favorite_food_ratings enable row level security;

revoke all on public.favorite_food_ratings from anon, authenticated;
grant select, insert, update on public.favorite_food_ratings to authenticated;

drop policy if exists favorite_ratings_read_own on public.favorite_food_ratings;
create policy favorite_ratings_read_own on public.favorite_food_ratings
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists favorite_ratings_insert_own on public.favorite_food_ratings;
create policy favorite_ratings_insert_own on public.favorite_food_ratings
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists favorite_ratings_update_own on public.favorite_food_ratings;
create policy favorite_ratings_update_own on public.favorite_food_ratings
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

