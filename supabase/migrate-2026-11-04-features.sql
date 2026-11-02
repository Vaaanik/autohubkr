-- АвтоХаб: прайс сервісів, паспорт авто, вільні вікна, QR-відгуки, партнери-засновники — 02.11.2026
alter table stos add column if not exists prices jsonb not null default '{}'::jsonb;
alter table stos add column if not exists prices_at text not null default '';
alter table stos add column if not exists founder boolean not null default false;
alter table stos add column if not exists remind jsonb;
alter table stos add column if not exists posted text not null default '';
alter table cars add column if not exists passport_token text not null default '';
alter table cars add column if not exists passport_vin boolean not null default true;
create index if not exists cars_passport on cars(passport_token) where passport_token <> '';
alter table reviews add column if not exists source text not null default '';
alter table requests add column if not exists window_id text not null default '';
create table if not exists sto_windows (
  id text primary key, sto_id text not null, at text not null, dur_value numeric, dur_unit text not null default 'год',
  category text not null default '', discount int not null default 10, note text not null default '',
  status text not null default 'open', request_id text not null default '', created text not null
);
create index if not exists sto_windows_open on sto_windows(status, at);
create index if not exists sto_windows_sto on sto_windows(sto_id);
alter table sto_windows enable row level security;   -- читає й пише лише сервер
-- перші 30 активних партнерів отримують статус «Партнер-засновник»
update stos set founder = true where id in (
  select id from stos where active = true and deleted = false and (owner_id <> '' or partner = true) order by created limit 30);
select (select count(*) from stos where founder) as founders, (select count(*) from information_schema.tables where table_name = 'sto_windows') as windows_table;
