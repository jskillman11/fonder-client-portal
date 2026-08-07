-- Portal-display colors for a staff member's initials tile, mirroring
-- team_members.icon_bg_color/icon_text_color -- lets a linked roster entry
-- (see team_members.staff_id below) source its colors from the staff
-- profile instead of duplicating them.
alter table profiles add column icon_bg_color text;
alter table profiles add column icon_text_color text;

-- Optional link from a roster entry to the staff account it represents.
-- Nullable: most current roster members (anyone without a Fonder admin
-- login) stay unlinked and keep using team_members' own name/role/icon
-- columns exactly as before. When set, the app prefers the linked
-- profile's full_name/job_title/icon colors over this row's own columns.
alter table team_members add column staff_id uuid references profiles(id) on delete set null;
