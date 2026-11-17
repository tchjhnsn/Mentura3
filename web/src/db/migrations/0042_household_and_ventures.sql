-- Settings and household (Torian, 2026-11-17 03:41Z to 04:15Z, doc "Tiles and their connections"): a household is
-- everyone living in one housing unit (Census). People join by invite and keep their own login; a member without a
-- login (an elder parent, a young child) is kept by another member and can claim the record if they later make an
-- account. A member's facts (name, relation, birth year, dependent) are sealed with the household's key, so every
-- member can read them and nobody else. One person is in at most one household at a time. An invite is a link; only
-- a hash of its token is stored. The Ventures tile becomes its own app. Every statement here can run again.
CREATE TABLE IF NOT EXISTS household (
  id uuid PRIMARY KEY,
  created_by text NOT NULL REFERENCES "user"(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS household_member (
  id uuid PRIMARY KEY,
  household_id uuid NOT NULL REFERENCES household(id),
  user_id text REFERENCES "user"(id),
  kept_by text REFERENCES "user"(id),
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  body_ct text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  removed_at timestamptz,
  CHECK (user_id IS NOT NULL OR kept_by IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS household_member_household ON household_member (household_id) WHERE removed_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS household_member_one_household ON household_member (user_id) WHERE removed_at IS NULL AND user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS household_invite (
  id uuid PRIMARY KEY,
  household_id uuid NOT NULL REFERENCES household(id),
  token_hash text NOT NULL UNIQUE,
  invited_by text NOT NULL REFERENCES "user"(id),
  member_id uuid REFERENCES household_member(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  accepted_by text REFERENCES "user"(id),
  accepted_at timestamptz,
  revoked_at timestamptz
);
CREATE INDEX IF NOT EXISTS household_invite_household ON household_invite (household_id);

ALTER TABLE life_record DROP CONSTRAINT IF EXISTS life_record_app_check;
ALTER TABLE life_record ADD CONSTRAINT life_record_app_check
  CHECK (app IN ('work', 'home', 'body', 'friends', 'mate', 'kin', 'polis', 'legacy', 'ventures'));

ALTER TABLE calendar_event DROP CONSTRAINT IF EXISTS calendar_event_tile_check;
ALTER TABLE calendar_event ADD CONSTRAINT calendar_event_tile_check
  CHECK (tile IN ('learn', 'work', 'home', 'body', 'friends', 'mate', 'kin', 'polis', 'ventures', 'legacy'));
