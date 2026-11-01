-- АвтоХаб: страховик і номер поліса, розпізнані з документа — 01.11.2026
alter table cars add column if not exists docs_meta jsonb;
