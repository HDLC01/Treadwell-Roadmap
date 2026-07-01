-- Target date: when the team plans to tackle a card. Pairs with the priority
-- star (star = "do this next", target_date = "when"). Nullable; admin-set.
alter table roadmap_items add column if not exists target_date date;
