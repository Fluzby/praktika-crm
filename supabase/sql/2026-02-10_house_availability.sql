-- Add availability status to houses.
-- Values:
-- - entering (Sisestamisel)
-- - available
-- - unavailable

alter table public.houses
  add column if not exists availability text;

update public.houses
set availability = 'entering'
where availability is null;

alter table public.houses
  alter column availability set default 'entering';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'houses_availability_check'
      and conrelid = 'public.houses'::regclass
  ) then
    alter table public.houses
      add constraint houses_availability_check
      check (availability in ('entering', 'available', 'unavailable'));
  end if;
end
$$;
