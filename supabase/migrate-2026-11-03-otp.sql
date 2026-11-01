-- АвтоХаб: підтвердження номера при реєстрації — 01.11.2026
alter table users add column if not exists phone_ok boolean not null default false;
