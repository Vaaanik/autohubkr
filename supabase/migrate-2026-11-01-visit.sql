-- АвтоХаб: узгодження часу візиту й строк ремонту (01.11.2026)
alter table requests add column if not exists visit_at text not null default '';
alter table requests add column if not exists visit_state text not null default '';   -- sto, driver, confirmed
alter table requests add column if not exists visit_options jsonb not null default '[]'::jsonb;
alter table requests add column if not exists visit_log jsonb not null default '[]'::jsonb;
alter table requests add column if not exists dur_value int;
alter table requests add column if not exists dur_unit text not null default '';
select count(*) as requests from requests;
