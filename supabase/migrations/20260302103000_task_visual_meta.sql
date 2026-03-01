alter table tasks
  add column if not exists color text,
  add column if not exists task_type text not null default 'follow_up'
    check (task_type in ('follow_up', 'meeting', 'call', 'deadline'));

