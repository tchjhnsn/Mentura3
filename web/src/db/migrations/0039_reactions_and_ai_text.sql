-- Like and Dislike (Torian, 2026-11-16 19:25Z, card: private, to steer Up next and For you, never public counts):
-- a person's reaction to a thing they watched or heard, by the thing's key (its link, else medium and title). Each
-- change is a new row and the latest counts; 'none' takes a reaction off. Nothing is ever changed.
CREATE TABLE IF NOT EXISTS media_reaction (
  id uuid PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"(id),
  key text NOT NULL CHECK (length(key) BETWEEN 1 AND 1200),
  reaction text NOT NULL CHECK (reaction IN ('like', 'dislike', 'none')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS media_reaction_key ON media_reaction (user_id, key, created_at);
DROP TRIGGER IF EXISTS media_reaction_append_only ON media_reaction;
CREATE TRIGGER media_reaction_append_only BEFORE UPDATE OR DELETE ON media_reaction FOR EACH ROW EXECUTE FUNCTION reflect_never_changed();

-- Text a model wrote about a thing (Torian, 2026-11-16 19:29Z, build: AI descriptions and book summaries), written
-- once and shared by everyone, with the sources it was written from and the model that wrote it, shown labelled as
-- written by AI. A rewrite is a new row and the latest counts. Every statement here can run again.
CREATE TABLE IF NOT EXISTS ai_text (
  id uuid PRIMARY KEY,
  key text NOT NULL CHECK (length(key) BETWEEN 1 AND 1200),
  kind text NOT NULL CHECK (kind IN ('description', 'summary')),
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 40000),
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  model text NOT NULL CHECK (length(model) BETWEEN 1 AND 200),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_text_key ON ai_text (key, kind, created_at);
DROP TRIGGER IF EXISTS ai_text_append_only ON ai_text;
CREATE TRIGGER ai_text_append_only BEFORE UPDATE OR DELETE ON ai_text FOR EACH ROW EXECUTE FUNCTION reflect_never_changed();
