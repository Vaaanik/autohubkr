-- АвтоХаб: сповіщення — Telegram користувачів і email сервісів (01.11.2026)
alter table users add column if not exists tg_chat text not null default '';
alter table stos add column if not exists email text not null default '';
create index if not exists users_tg on users(tg_chat);
select count(*) filter (where tg_chat <> '') as tg_users, (select count(*) from stos where email <> '') as sto_emails from users;
