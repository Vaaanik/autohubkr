-- АвтоХаб: опис авто від власника й AI-опис моделі — 01.11.2026
alter table cars add column if not exists about text not null default '';
alter table cars add column if not exists info jsonb;
select column_name from information_schema.columns where table_name = 'cars' and column_name in ('about', 'info');
