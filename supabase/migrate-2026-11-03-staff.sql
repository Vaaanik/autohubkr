-- АвтоХаб: співробітники сервісу й призначення майстра — 02.11.2026
alter table stos add column if not exists staff jsonb not null default '[]'::jsonb;
alter table sto_jobs add column if not exists master_id text not null default '';
alter table sto_jobs add column if not exists master_name text not null default '';
alter table requests add column if not exists master_id text not null default '';
