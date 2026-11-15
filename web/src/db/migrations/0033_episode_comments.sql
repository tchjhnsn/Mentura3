-- Comments on podcast episodes (Torian, 2026-11-15 16:20Z): a social comment section, people talking to each other
-- about an episode, not questions to a model. A comment belongs to an episode by its show's feed and the episode's
-- key, so everyone listening to the same episode sees the same comments, whether or not they keep the show. A reply
-- names the comment it answers; a comment may name the place in the episode it is about. Each comment is a new row and
-- nothing is ever changed: its author takes one down by adding a row to episode_comment_removed. Every statement here
-- can run again.
CREATE TABLE IF NOT EXISTS episode_comment (
  id uuid PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"(id),
  feed text NOT NULL CHECK (length(feed) BETWEEN 8 AND 2000),
  episode text NOT NULL CHECK (length(episode) BETWEEN 1 AND 300),
  parent_id uuid REFERENCES episode_comment(id),
  at integer CHECK (at IS NULL OR at BETWEEN 0 AND 360000),
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS episode_comment_episode ON episode_comment (feed, episode, created_at);
DROP TRIGGER IF EXISTS episode_comment_append_only ON episode_comment;
CREATE TRIGGER episode_comment_append_only BEFORE UPDATE OR DELETE ON episode_comment FOR EACH ROW EXECUTE FUNCTION reflect_never_changed();

CREATE TABLE IF NOT EXISTS episode_comment_removed (
  comment_id uuid PRIMARY KEY REFERENCES episode_comment(id),
  user_id text NOT NULL REFERENCES "user"(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS episode_comment_removed_append_only ON episode_comment_removed;
CREATE TRIGGER episode_comment_removed_append_only BEFORE UPDATE OR DELETE ON episode_comment_removed FOR EACH ROW EXECUTE FUNCTION reflect_never_changed();
