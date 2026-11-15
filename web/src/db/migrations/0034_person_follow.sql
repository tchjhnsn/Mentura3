-- Following a guest or host of a podcast (Torian, 2026-11-15 16:47Z). A person is named as podcasts name them, with
-- their Wikidata item when known. Each change is a new row and the latest for a name counts, so nothing is ever
-- changed. Every statement here can run again.
CREATE TABLE IF NOT EXISTS person_follow (
  id uuid PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"(id),
  name text NOT NULL CHECK (length(name) BETWEEN 3 AND 120),
  qid text CHECK (qid IS NULL OR qid ~ '^Q[0-9]{1,12}$'),
  follow boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS person_follow_user ON person_follow (user_id, lower(name), created_at);
DROP TRIGGER IF EXISTS person_follow_append_only ON person_follow;
CREATE TRIGGER person_follow_append_only BEFORE UPDATE OR DELETE ON person_follow FOR EACH ROW EXECUTE FUNCTION reflect_never_changed();
