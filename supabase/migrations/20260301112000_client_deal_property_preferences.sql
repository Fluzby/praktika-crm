alter table clients
  add column if not exists deal_preference text
  check (deal_preference in ('buy', 'rent'));

alter table clients
  add column if not exists property_preference text
  check (property_preference in ('apartment', 'house'));
