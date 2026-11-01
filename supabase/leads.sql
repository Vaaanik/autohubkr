-- АвтоХаб: анкети з лендингів і перегляди сторінок (замість таблиці «АвтоХаб: заявки»).
create table if not exists leads (
  id text primary key,
  kind text not null check (kind in ('driver','service')),
  created text not null,
  name text not null default '',
  contact text not null default '',
  data jsonb not null default '{}'::jsonb,
  status text not null default 'new'      -- new, contacted, joined, rejected
);
create index if not exists leads_kind on leads(kind, created desc);

create table if not exists visits (
  id bigserial primary key,
  created text not null,
  page text not null default '',
  source text not null default '',
  device text not null default '',
  new_visitor boolean not null default false,
  visitor text not null default '',
  utm text not null default '',
  referrer text not null default ''
);
create index if not exists visits_created on visits(created);

alter table leads enable row level security;
alter table visits enable row level security;
