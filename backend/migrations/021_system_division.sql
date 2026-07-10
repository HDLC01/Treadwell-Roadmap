-- Let a system (tool tile) be filed under a chosen division on the home board
-- (drag-to-move). NULL = the default placement (Sales & Marketing), matching the
-- prior hard-coded behavior, so existing tiles don't move until dragged.
alter table systems add column if not exists division_id uuid references systems(id) on delete set null;
