-- Who added a project/task. Existing feature cards were seeded from the
-- "AI Treadwell Ideas" Google Doc, so backfill that provenance; cards created
-- in-app from here on stamp the signed-in user's email.
alter table roadmap_items add column if not exists created_by text;

update roadmap_items
   set created_by = 'AI Treadwell Ideas doc'
 where is_feature and created_by is null;
