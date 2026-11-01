-- АвтоХаб: партнер без власного акаунта (заявки веде зв'язковий) — 01.11.2026
alter table stos add column if not exists partner boolean not null default false;
select count(*) filter (where partner) as partners, count(*) as total from stos;
