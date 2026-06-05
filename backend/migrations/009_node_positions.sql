-- Persisted canvas positions for nodes (admin drags the layout; shared for all).
alter table systems add column if not exists pos_x double precision;
alter table systems add column if not exists pos_y double precision;
alter table phases  add column if not exists pos_x double precision;
alter table phases  add column if not exists pos_y double precision;
