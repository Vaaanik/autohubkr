-- АвтоХаб: прайс сервісів, паспорт авто, вільні вікна, QR-відгуки, партнери-засновники — 02.11.2026
alter table stos add column if not exists prices jsonb not null default '{}'::jsonb;
alter table stos add column if not exists prices_at text not null default '';
