-- АвтоХаб: приватний кошик для офіційного реєстру МВС (файли за VIN), читає лише сервер — 01.11.2026
insert into storage.buckets (id, name, public, file_size_limit)
values ('vin-registry', 'vin-registry', false, 5242880)
on conflict (id) do nothing;
drop table if exists vin_registry;   -- стара таблиця не потрібна: реєстр зберігається файлами
select id, public from storage.buckets where id = 'vin-registry';

-- фото проблеми в заявці; модифікація, комплектація й ринкова ціна авто (AUTO.RIA)
alter table requests add column if not exists photos jsonb not null default '[]'::jsonb;
alter table cars add column if not exists modification text not null default '';
alter table cars add column if not exists equipment text not null default '';
alter table cars add column if not exists market jsonb;
select 'ok' as done;
