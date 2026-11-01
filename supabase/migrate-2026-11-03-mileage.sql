-- АвтоХаб: історія пробігу авто — 01.11.2026
alter table cars add column if not exists mileage_log jsonb not null default '[]'::jsonb;
select column_name, data_type from information_schema.columns where table_name = 'cars' and column_name = 'mileage_log';
