alter table calendar_events
  add column if not exists status text not null default 'open' check (status in ('open', 'done')),
  add column if not exists completed_at timestamptz;

create index if not exists idx_calendar_events_status_date on calendar_events(status, event_date);
