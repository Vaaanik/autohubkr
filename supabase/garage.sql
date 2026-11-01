-- АвтоХаб: гараж — модифікація авто, фото, роботи в історії (01.11.2026)
alter table cars add column if not exists engine numeric;
alter table cars add column if not exists fuel text not null default '';
alter table cars add column if not exists power int;
alter table cars add column if not exists gearbox text not null default '';
alter table cars add column if not exists drive text not null default '';
alter table cars add column if not exists body text not null default '';
alter table cars add column if not exists photo text not null default '';
alter table history add column if not exists services text not null default '';

-- приватний кошик для фото авто (читає й пише лише сервер)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('car-photos', 'car-photos', false, 2097152, array['image/jpeg'])
on conflict (id) do nothing;

select column_name from information_schema.columns where table_name = 'cars' order by ordinal_position;
