-- Dialectic as a feed (Torian, 2026-11-16 17:56Z "a Twitter style feed", 17:59Z "build"). A post's topic becomes an
-- optional tag; a repost and following a person are their own rows, the latest for each pair counting. Nothing is
-- ever changed. Every statement here can run again.

ALTER TABLE topic_post ALTER COLUMN topic DROP NOT NULL;
CREATE INDEX IF NOT EXISTS topic_post_created ON topic_post (created_at);

CREATE TABLE IF NOT EXISTS topic_post_repost (
  id uuid PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES topic_post(id),
  user_id text NOT NULL REFERENCES "user"(id),
  repost boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS topic_post_repost_post ON topic_post_repost (post_id, user_id, created_at);
DROP TRIGGER IF EXISTS topic_post_repost_append_only ON topic_post_repost;
CREATE TRIGGER topic_post_repost_append_only BEFORE UPDATE OR DELETE ON topic_post_repost FOR EACH ROW EXECUTE FUNCTION reflect_never_changed();

CREATE TABLE IF NOT EXISTS user_follow (
  id uuid PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"(id),
  target_id text NOT NULL REFERENCES "user"(id),
  follow boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (user_id <> target_id)
);
CREATE INDEX IF NOT EXISTS user_follow_user ON user_follow (user_id, target_id, created_at);
DROP TRIGGER IF EXISTS user_follow_append_only ON user_follow;
CREATE TRIGGER user_follow_append_only BEFORE UPDATE OR DELETE ON user_follow FOR EACH ROW EXECUTE FUNCTION reflect_never_changed();
