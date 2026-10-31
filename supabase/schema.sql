-- АвтоХаб: схема бази Supabase (PostgreSQL).
-- Доступ до таблиць має лише Edge Function «api» (ключ service role). Для anon-ключа RLS увімкнено без політик,
-- тож напряму з браузера таблиці не читаються й не змінюються.

create table if not exists users (
  id text primary key,
  role text not null default 'driver' check (role in ('driver','sto','admin')),
  name text not null,
  phone text not null unique,
  pin_hash text not null,
  salt text not null,
  sto_id text not null default '',
  created text not null
);

create table if not exists sessions (
  token text primary key,
  user_id text not null references users(id) on delete cascade,
  expires text not null
);
create index if not exists sessions_user on sessions(user_id);

create table if not exists cars (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  make text not null, model text not null,
  year int, plate text not null default '', vin text not null default '', mileage int,
  created text not null, deleted text not null default ''
);
create index if not exists cars_user on cars(user_id);

create table if not exists stos (
  id text primary key,
  owner_id text not null default '',
  name text not null, district text not null default '', address text not null default '', phone text not null default '',
  services text not null default '', hours text not null default '', about text not null default '',
  active boolean not null default false,
  created text not null, source text not null default '',
  lat double precision, lng double precision,
  geo text not null default ''          -- '' не шукали, ok знайдено, x не знайдено, xx не знайдено й після повтору
);
create index if not exists stos_owner on stos(owner_id);

create table if not exists requests (
  id text primary key,
  driver_id text not null, car_id text not null, sto_id text not null,
  category text not null, description text not null, preferred text not null default '',
  status text not null default 'new',
  sto_comment text not null default '', price numeric, visit text not null default '', work_done text not null default '', mileage int,
  created text not null, updated text not null
);
create index if not exists requests_driver on requests(driver_id);
create index if not exists requests_sto on requests(sto_id);

create table if not exists history (
  id text primary key,
  car_id text not null, user_id text not null,
  date text not null, work text not null, place text not null default '', price numeric, mileage int,
  request_id text not null default '', created text not null
);
create index if not exists history_car on history(car_id);

create table if not exists reviews (
  id text primary key,
  request_id text not null unique, sto_id text not null, driver_id text not null,
  rating int not null check (rating between 1 and 5), text text not null default '', created text not null
);
create index if not exists reviews_sto on reviews(sto_id);

-- короткочасні лічильники (спроби входу, ліміт AI) замість CacheService
create table if not exists kv (
  key text primary key,
  val text not null,
  expires timestamptz not null
);

alter table users enable row level security;
alter table sessions enable row level security;
alter table cars enable row level security;
alter table stos enable row level security;
alter table requests enable row level security;
alter table history enable row level security;
alter table reviews enable row level security;
alter table kv enable row level security;
