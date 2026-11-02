-- АвтоХаб: статус майстра з Telegram («взяв у роботу» / «готово») — 02.11.2026
alter table sto_jobs add column if not exists master_state text not null default '';
alter table requests add column if not exists master_state text not null default '';
