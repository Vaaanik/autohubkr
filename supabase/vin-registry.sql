-- АвтоХаб: технічні дані авто з відкритого реєстру МВС (data.gov.ua), ключ — VIN. Без персональних даних.
create table if not exists vin_registry (
  vin text primary key,
  brand text not null default '', model text not null default '', year int,
  color text not null default '', body text not null default '', fuel text not null default '',
  capacity int, power_kw numeric, weight int,
  d_reg text not null default ''          -- дата останньої реєстраційної дії
);
alter table vin_registry enable row level security;   -- читає й пише лише сервер (service role)
select count(*) as rows from vin_registry;
