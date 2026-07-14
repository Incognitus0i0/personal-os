-- ═══════════════════════════════════════════════════════════════
-- MIGRATION 2 — paleisti Supabase SQL Editor PRIEŠ naudojant app'są
-- Pakeičia project nuorodas iš uuid FK į tekstą (pagal UI logiką:
-- tasks siejami su projektu pagal pavadinimą, pervadinimas
-- propaguojamas automatiškai UI lygyje)
-- ═══════════════════════════════════════════════════════════════

alter table tasks drop column if exists project_id;
alter table tasks add column if not exists project text not null default '—';

alter table project_finance drop column if exists project_id;
alter table project_finance add column if not exists project text not null default '—';
