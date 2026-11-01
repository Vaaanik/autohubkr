-- АвтоХаб: журнал робіт сервісу (власні клієнти й роботи через АвтоХаб) — 01.11.2026
create table if not exists sto_jobs (
  id text primary key,
  sto_id text not null,
  date text not null,
  client_name text not null default '', client_phone text not null default '',
  car text not null default '', plate text not null default '', vin text not null default '', mileage int,
  work text not null default '', price numeric,
  status text not null default 'done',     -- in_work, done
  source text not null default 'власний',  -- власний або АвтоХаб
  request_id text not null default '',
  note text not null default '',
  created text not null
);
create index if not exists sto_jobs_sto on sto_jobs(sto_id, date desc);
alter table sto_jobs enable row level security;   -- читає й пише лише сервер
-- виконані раніше заявки АвтоХабу переносимо в журнал
insert into sto_jobs (id, sto_id, date, client_name, client_phone, car, plate, vin, mileage, work, price, status, source, request_id, note, created)
select substr(md5(q.id || 'job'), 1, 12), q.sto_id, substr(q.updated, 1, 10), coalesce(u.name, ''), coalesce(u.phone, ''),
  trim(coalesce(c.make, '') || ' ' || coalesce(c.model, '') || coalesce(' ' || c.year::text, '')), coalesce(c.plate, ''), coalesce(c.vin, ''), q.mileage, q.work_done, q.price, 'done', 'АвтоХаб', q.id, '', q.updated
from requests q left join users u on u.id = q.driver_id left join cars c on c.id = q.car_id
where q.status = 'done' and not exists (select 1 from sto_jobs j where j.request_id = q.id);
select count(*) as jobs from sto_jobs;
