-- Account v2. Preserve existing rows; also make a fresh checkout reproducible.
-- profiles originally existed in the hosted database before tracked migrations.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.conversion_history enable row level security;

-- Match the verified production cascade contracts explicitly.
alter table public.profiles drop constraint if exists profiles_id_fkey;
alter table public.profiles add constraint profiles_id_fkey
  foreign key (id) references auth.users(id) on delete cascade;
alter table public.conversion_history drop constraint if exists conversion_history_user_id_fkey;
alter table public.conversion_history add constraint conversion_history_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can create own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy "Users can create own profile" on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);
create policy "Users can update own profile" on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- RLS does not protect TRUNCATE. Remove unused default table grants, including
-- those inherited through PUBLIC, and grant only the operations we actually use.
revoke all on public.profiles from public, anon, authenticated;
grant select on public.profiles to authenticated;
grant insert (id, display_name) on public.profiles to authenticated;
grant update (display_name, updated_at) on public.profiles to authenticated;
revoke all on public.conversion_history from public, anon, authenticated;
grant select, insert, update, delete on public.conversion_history to authenticated;
-- Explicit grants also make local/new projects work when automatic Data API
-- grants are disabled. This role is used only by trusted server/admin tooling.
grant select, insert, update, delete on public.profiles, public.conversion_history to service_role;

-- A deterministic order for pagination, including conversions at the same time.
create index if not exists conversion_history_user_created_id_idx
  on public.conversion_history (user_id, created_at desc, id desc);
drop index if exists public.conversion_history_user_id_created_at_idx;
-- The owner index bounds filename/filter scans to one user's rows. No broad
-- trigram/format indexes until measured history volume justifies their cost.

create or replace function public.account_conversion_summary()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with own_history as (
    select source_format, target_format, status, created_at
    from public.conversion_history
    where user_id = (select auth.uid())
  ), totals as (
    select count(*) as total,
      count(*) filter (where created_at >= date_trunc('month', now() at time zone 'UTC') at time zone 'UTC') as this_month,
      count(*) filter (where status = 'completed') as completed
    from own_history
  ), pairs as (
    select source_format, target_format, count(*) as uses
    from own_history where status = 'completed'
    group by source_format, target_format
  ), favourites as (
    select *, rank() over (order by uses desc) as position from pairs
  )
  select jsonb_build_object(
    'total', totals.total,
    'this_month', totals.this_month,
    'favourite', (select jsonb_build_object('source', source_format, 'target', target_format, 'count', uses)
      from favourites
      where position = 1 and uses >= 2 and totals.completed >= 3
        and (select count(*) from favourites where position = 1) = 1)
  ) from totals;
$$;
revoke all on function public.account_conversion_summary() from public, anon;
grant execute on function public.account_conversion_summary() to authenticated;

-- The signup trigger is privileged because new users cannot insert their own
-- profile during Auth signup. It has a fixed search path and is not an RPC.
revoke all on function public.handle_new_user() from public, anon, authenticated;
