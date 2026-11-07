-- Blokko backend schema (applied to Supabase project "blokko", ref kdxjikrykfppbiiycggc).
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 3 and 20),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "own profile update" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create table public.saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb check (pg_column_size(data) < 65536),
  updated_at timestamptz not null default now()
);
alter table public.saves enable row level security;
create policy "own save read" on public.saves for select to authenticated using ((select auth.uid()) = user_id);
create policy "own save insert" on public.saves for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own save update" on public.saves for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table public.scores (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('classic','daily')),
  day date,
  score integer not null check (score between 0 and 2000000),
  created_at timestamptz not null default now(),
  check ((mode = 'daily') = (day is not null))
);
create index scores_board_idx on public.scores (mode, day, score desc);
create index scores_user_idx on public.scores (user_id);
alter table public.scores enable row level security;
create policy "own scores read" on public.scores for select to authenticated using ((select auth.uid()) = user_id);
create policy "own scores insert" on public.scores for insert to authenticated with check ((select auth.uid()) = user_id and created_at > now() - interval '1 minute');

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  adj text[] := array['Mutlu','Neşeli','Hızlı','Parlak','Şeker','Cesur','Minik','Süper','Renkli','Zıpzıp'];
  noun text[] := array['Küp','Blok','Yıldız','Jöle','Balon','Roket','Panda','Tilki','Kedi','Bulut'];
begin
  insert into public.profiles (id, nickname)
  values (new.id, adj[1 + floor(random()*10)::int] || ' ' || noun[1 + floor(random()*10)::int] || ' ' || (100 + floor(random()*900)::int));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.leaderboard(p_mode text, p_day date default null, p_period text default 'all', p_limit int default 50)
returns table (rank bigint, nickname text, score integer, is_me boolean)
language sql stable security definer set search_path = '' as $$
  with best as (
    select s.user_id, max(s.score) as score from public.scores s
    where s.mode = p_mode and (p_mode <> 'daily' or s.day = p_day)
      and (p_period <> 'week' or s.created_at > now() - interval '7 days')
    group by s.user_id
  )
  select rank() over (order by b.score desc), p.nickname, b.score, b.user_id = (select auth.uid())
  from best b join public.profiles p on p.id = b.user_id
  order by b.score desc limit least(greatest(p_limit, 1), 100);
$$;

create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  delete from auth.users where id = auth.uid();
end $$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.leaderboard(text, date, text, int) to anon, authenticated;
