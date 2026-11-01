-- АвтоХаб: логотип і фото сервісів (публічний кошик sto-photos) — 01.11.2026
alter table stos add column if not exists logo text not null default '';
alter table stos add column if not exists photos jsonb not null default '[]'::jsonb;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sto-photos', 'sto-photos', true, 2097152, array['image/jpeg'])
on conflict (id) do nothing;
select id, public from storage.buckets where id in ('car-photos', 'sto-photos');
