create table if not exists calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  note text,
  event_date date not null,
  repeat text not null default 'none' check (repeat in ('none','yearly')),
  type text not null default 'meeting' check (type in ('meeting','call','deadline')),
  client_id uuid references clients(id) on delete set null,
  house_id uuid references houses(id) on delete set null,
  color text not null default '#22c55e',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_calendar_events_event_date on calendar_events(event_date);
create index if not exists idx_calendar_events_client_date on calendar_events(client_id, event_date);
create index if not exists idx_calendar_events_house_date on calendar_events(house_id, event_date);

drop trigger if exists trg_calendar_events_updated_at on calendar_events;
create trigger trg_calendar_events_updated_at before update on calendar_events
for each row execute function set_updated_at();

alter table calendar_events enable row level security;
create policy "auth all calendar_events" on calendar_events for all to authenticated using (true) with check (true);
