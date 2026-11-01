-- АвтоХаб: джерело реєстрації (воронка Telegram-бота) — 02.11.2026
alter table users add column if not exists source text not null default '';
