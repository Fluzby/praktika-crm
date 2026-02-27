create extension if not exists pgcrypto;

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('client','house')),
  entity_id uuid not null,
  title text not null,
  notes text,
  due_at timestamptz,
  status text not null default 'open' check (status in ('open','done','cancelled')),
  reminder_minutes int,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists calendar_sessions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  client_id uuid references clients(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  expires_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled','active','expired','cancelled')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table clients add column if not exists is_archived boolean not null default false;
alter table houses add column if not exists is_archived boolean not null default false;

create table if not exists archives (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('client','house')),
  entity_id uuid not null,
  reason text,
  archived_by uuid references auth.users(id),
  archived_at timestamptz not null default now()
);

create table if not exists share_links (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('client','house')),
  entity_id uuid not null,
  token text not null unique,
  expires_at timestamptz not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_tasks_entity on tasks(entity_type, entity_id);
create index if not exists idx_tasks_due_at on tasks(due_at);
create index if not exists idx_calendar_sessions_client on calendar_sessions(client_id, starts_at);
create index if not exists idx_share_links_token on share_links(token);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_tasks_updated_at on tasks;
create trigger trg_tasks_updated_at before update on tasks
for each row execute function set_updated_at();

drop trigger if exists trg_calendar_sessions_updated_at on calendar_sessions;
create trigger trg_calendar_sessions_updated_at before update on calendar_sessions
for each row execute function set_updated_at();

alter table tasks enable row level security;
alter table calendar_sessions enable row level security;
alter table archives enable row level security;
alter table share_links enable row level security;

create policy "auth all tasks" on tasks for all to authenticated using (true) with check (true);
create policy "auth all calendar_sessions" on calendar_sessions for all to authenticated using (true) with check (true);
create policy "auth all archives" on archives for all to authenticated using (true) with check (true);
create policy "auth all share_links" on share_links for all to authenticated using (true) with check (true);
