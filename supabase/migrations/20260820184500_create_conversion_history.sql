create table if not exists public.conversion_history (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  conversion_id uuid not null unique,

  original_filename text not null,

  source_format text not null,
  target_format text not null,

  status text not null default 'queued'
    check (
      status in (
        'queued',
        'processing',
        'completed',
        'failed'
      )
    ),

  input_size bigint,
  output_size bigint,

  output_key text,

  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists conversion_history_user_id_created_at_idx
  on public.conversion_history (user_id, created_at desc);

alter table public.conversion_history enable row level security;

create policy "Users can view their own conversion history"
  on public.conversion_history
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own conversion history"
  on public.conversion_history
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own conversion history"
  on public.conversion_history
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own conversion history"
  on public.conversion_history
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);