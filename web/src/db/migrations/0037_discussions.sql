-- Discussions on topics and written debates (Torian, 2026-11-16 09:43Z and 10:08Z; applied to preview and production
-- on his card). A post belongs to a topic (a curated dialectic, an idea, a term, a work or a person, as "kind:id"); a
-- model's reading of it (supports, opposes or neither, and level 1 to 5, which are its points) is its own row, as is
-- the author's correction of the stance and a takedown. A written debate's turns are rows too. Nothing is ever
-- changed. Every statement here can run again.

CREATE TABLE IF NOT EXISTS topic_post (
  id uuid PRIMARY KEY,
  topic text NOT NULL CHECK (length(topic) BETWEEN 3 AND 140),
  user_id text NOT NULL REFERENCES "user"(id),
  parent_id uuid REFERENCES topic_post(id),
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS topic_post_topic ON topic_post (topic, created_at);
CREATE INDEX IF NOT EXISTS topic_post_user ON topic_post (user_id);
DROP TRIGGER IF EXISTS topic_post_append_only ON topic_post;
CREATE TRIGGER topic_post_append_only BEFORE UPDATE OR DELETE ON topic_post FOR EACH ROW EXECUTE FUNCTION reflect_never_changed();

CREATE TABLE IF NOT EXISTS topic_post_grade (
  id uuid PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES topic_post(id),
  stance text NOT NULL CHECK (stance IN ('supports', 'opposes', 'neither')),
  level smallint NOT NULL CHECK (level BETWEEN 1 AND 5),
  why text CHECK (why IS NULL OR length(why) <= 300),
  model text NOT NULL CHECK (length(model) BETWEEN 1 AND 80),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS topic_post_grade_post ON topic_post_grade (post_id, created_at);
DROP TRIGGER IF EXISTS topic_post_grade_append_only ON topic_post_grade;
CREATE TRIGGER topic_post_grade_append_only BEFORE UPDATE OR DELETE ON topic_post_grade FOR EACH ROW EXECUTE FUNCTION reflect_never_changed();

CREATE TABLE IF NOT EXISTS topic_post_stance (
  id uuid PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES topic_post(id),
  user_id text NOT NULL REFERENCES "user"(id),
  stance text NOT NULL CHECK (stance IN ('supports', 'opposes', 'neither')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS topic_post_stance_post ON topic_post_stance (post_id, created_at);
DROP TRIGGER IF EXISTS topic_post_stance_append_only ON topic_post_stance;
CREATE TRIGGER topic_post_stance_append_only BEFORE UPDATE OR DELETE ON topic_post_stance FOR EACH ROW EXECUTE FUNCTION reflect_never_changed();

CREATE TABLE IF NOT EXISTS topic_post_removed (
  post_id uuid PRIMARY KEY REFERENCES topic_post(id),
  user_id text NOT NULL REFERENCES "user"(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS topic_post_removed_append_only ON topic_post_removed;
CREATE TRIGGER topic_post_removed_append_only BEFORE UPDATE OR DELETE ON topic_post_removed FOR EACH ROW EXECUTE FUNCTION reflect_never_changed();

-- A debate formed from a discussion remembers the post it came from.
CREATE TABLE IF NOT EXISTS debate_origin (
  debate_id uuid PRIMARY KEY REFERENCES debate(id),
  post_id uuid NOT NULL REFERENCES topic_post(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS debate_origin_append_only ON debate_origin;
CREATE TRIGGER debate_origin_append_only BEFORE UPDATE OR DELETE ON debate_origin FOR EACH ROW EXECUTE FUNCTION reflect_never_changed();

CREATE TABLE IF NOT EXISTS debate_turn (
  id uuid PRIMARY KEY,
  debate_id uuid NOT NULL REFERENCES debate(id),
  user_id text NOT NULL REFERENCES "user"(id),
  n smallint NOT NULL CHECK (n BETWEEN 0 AND 40),
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (debate_id, n)
);
DROP TRIGGER IF EXISTS debate_turn_append_only ON debate_turn;
CREATE TRIGGER debate_turn_append_only BEFORE UPDATE OR DELETE ON debate_turn FOR EACH ROW EXECUTE FUNCTION reflect_never_changed();
