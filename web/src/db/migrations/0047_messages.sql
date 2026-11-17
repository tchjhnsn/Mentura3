-- Messages between Reflect members (Ask Reflect plan, step 10). Every statement can run again.

-- A friend connection: two accounts that agreed to message each other, made when one accepts the other's invite
-- link. user_a sorts before user_b, so a pair has one row. Members of one household are connected without a row.
CREATE TABLE IF NOT EXISTS friend_link (
  user_a text NOT NULL REFERENCES "user"(id),
  user_b text NOT NULL REFERENCES "user"(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_a, user_b),
  CHECK (user_a < user_b)
);
CREATE INDEX IF NOT EXISTS friend_link_b ON friend_link (user_b);

-- A friend invite is a link the person shares; only a hash of its token is stored. It works once, for 14 days.
CREATE TABLE IF NOT EXISTS friend_invite (
  id uuid PRIMARY KEY,
  token_hash text NOT NULL UNIQUE,
  invited_by text NOT NULL REFERENCES "user"(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  accepted_by text REFERENCES "user"(id),
  accepted_at timestamptz,
  revoked_at timestamptz
);
CREATE INDEX IF NOT EXISTS friend_invite_by ON friend_invite (invited_by);

-- One message from one member to another. The text is sealed with the pair's key, so only the two members read it.
-- A sent message cannot be taken back: rows are never updated or deleted.
CREATE TABLE IF NOT EXISTS member_message (
  id uuid PRIMARY KEY,
  user_a text NOT NULL REFERENCES "user"(id),
  user_b text NOT NULL REFERENCES "user"(id),
  from_user text NOT NULL REFERENCES "user"(id),
  body_ct text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (user_a < user_b),
  CHECK (from_user = user_a OR from_user = user_b)
);
CREATE INDEX IF NOT EXISTS member_message_pair ON member_message (user_a, user_b, created_at DESC);

CREATE OR REPLACE FUNCTION member_message_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'member_message is append-only: a sent message cannot be changed or taken back';
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS member_message_append_only ON member_message;
CREATE TRIGGER member_message_append_only BEFORE UPDATE OR DELETE ON member_message FOR EACH ROW EXECUTE FUNCTION member_message_append_only();
