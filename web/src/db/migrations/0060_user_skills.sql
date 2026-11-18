-- Skills a person writes for Ask Reflect (Torian, 2026-11-18 22:54Z, after Claude's Skills tab): a name, when to use
-- it, and instructions. While a skill is on, Ask Reflect follows it. Removing marks removed_at. web/src/server/skills.ts.
CREATE TABLE IF NOT EXISTS user_skill (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"(id),
  name text NOT NULL,
  description text NOT NULL,
  instructions text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  removed_at timestamptz
);
CREATE INDEX IF NOT EXISTS user_skill_user ON user_skill (user_id) WHERE removed_at IS NULL;
