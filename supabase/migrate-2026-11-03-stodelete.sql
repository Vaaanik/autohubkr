-- АвтоХаб: архів видалених сервісів (історія заявок лишається у водіїв) — 02.11.2026
alter table stos add column if not exists deleted boolean not null default false;
