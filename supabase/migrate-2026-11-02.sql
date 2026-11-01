-- АвтоХаб: документи авто, код візиту, підтвердження робіт, нотатки зв'язкового (02.11.2026)
alter table cars add column if not exists osago_until text not null default '';
alter table cars add column if not exists kasko_until text not null default '';
alter table cars add column if not exists inspection_until text not null default '';
alter table cars add column if not exists green_until text not null default '';
alter table requests add column if not exists code text not null default '';
alter table requests add column if not exists visited text not null default '';
alter table requests add column if not exists confirmed text not null default '';
alter table requests add column if not exists admin_note text not null default '';
alter table history add column if not exists confirmed text not null default '';

select table_name, column_name from information_schema.columns
where table_name in ('cars', 'requests', 'history') and column_name in
  ('osago_until', 'kasko_until', 'inspection_until', 'green_until', 'code', 'visited', 'confirmed', 'admin_note') order by 1, 2;
