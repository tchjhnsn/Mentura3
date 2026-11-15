-- Favorite episodes (Torian, 2026-11-15 06:46Z): a person marks an episode of a show they keep as a favorite, or
-- takes the mark off. Each change is a new row and the latest counts, so nothing is ever changed. Every statement
-- here can run again.
CREATE TABLE IF NOT EXISTS learn_episode_favorite (
  id uuid PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"(id),
  item_id uuid NOT NULL REFERENCES learn_item(id),
  unit text NOT NULL CHECK (length(unit) BETWEEN 1 AND 300),
  favorite boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS learn_episode_favorite_unit ON learn_episode_favorite (user_id, item_id, unit, created_at);
DROP TRIGGER IF EXISTS learn_episode_favorite_append_only ON learn_episode_favorite;
CREATE TRIGGER learn_episode_favorite_append_only BEFORE UPDATE OR DELETE ON learn_episode_favorite FOR EACH ROW EXECUTE FUNCTION reflect_never_changed();
