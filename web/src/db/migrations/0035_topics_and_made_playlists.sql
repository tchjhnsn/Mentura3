-- Topics and playlists made for one person (Torian, 2026-11-16 01:17Z, agreeing to the guide "Topics and playlists").
-- Following a topic, and the playlists Reflect made for a person when they asked, with saving one or not. Each change
-- is a new row and the latest counts, so nothing is ever changed. Every statement here can run again.
CREATE TABLE IF NOT EXISTS topic_follow (
  id uuid PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"(id),
  topic text NOT NULL CHECK (topic ~ '^[a-z0-9-]{2,40}$'),
  follow boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS topic_follow_user ON topic_follow (user_id, topic, created_at);
DROP TRIGGER IF EXISTS topic_follow_append_only ON topic_follow;
CREATE TRIGGER topic_follow_append_only BEFORE UPDATE OR DELETE ON topic_follow FOR EACH ROW EXECUTE FUNCTION reflect_never_changed();

-- One playlist Reflect made: the topic, its name, what it was made from, and its items with a reason each.
CREATE TABLE IF NOT EXISTS made_playlist (
  id uuid PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"(id),
  topic text NOT NULL CHECK (topic ~ '^[a-z0-9-]{2,40}$'),
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 60),
  aim text CHECK (aim IS NULL OR length(aim) <= 200),
  ask text CHECK (ask IS NULL OR length(ask) <= 300),
  items jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS made_playlist_user ON made_playlist (user_id, topic, created_at);
DROP TRIGGER IF EXISTS made_playlist_append_only ON made_playlist;
CREATE TRIGGER made_playlist_append_only BEFORE UPDATE OR DELETE ON made_playlist FOR EACH ROW EXECUTE FUNCTION reflect_never_changed();

-- Saving a made playlist to the library's Lists, or taking it out.
CREATE TABLE IF NOT EXISTS made_playlist_save (
  id uuid PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"(id),
  playlist_id uuid NOT NULL REFERENCES made_playlist(id),
  saved boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS made_playlist_save_user ON made_playlist_save (user_id, playlist_id, created_at);
DROP TRIGGER IF EXISTS made_playlist_save_append_only ON made_playlist_save;
CREATE TRIGGER made_playlist_save_append_only BEFORE UPDATE OR DELETE ON made_playlist_save FOR EACH ROW EXECUTE FUNCTION reflect_never_changed();
