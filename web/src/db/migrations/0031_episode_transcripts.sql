-- Transcripts of podcast episodes (Torian, 2026-11-15 "Build all"; no transcripts made on request, his card 05:22Z).
-- `learn_transcript` keeps the published transcript of an episode of a show a person keeps, so their episodes can
-- be searched together. Passages are sealed with the person's key; only they see them. Append-only: a new transcript is a new row, and the latest is the one shown. Every statement
-- here can run again.
CREATE TABLE IF NOT EXISTS learn_transcript (
  id uuid PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"(id),
  item_id uuid NOT NULL REFERENCES learn_item(id),
  unit text NOT NULL CHECK (length(unit) BETWEEN 1 AND 300),
  source text NOT NULL CHECK (source IN ('published')),
  passages_ct text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS learn_transcript_unit ON learn_transcript (user_id, item_id, unit, created_at);
DROP TRIGGER IF EXISTS learn_transcript_append_only ON learn_transcript;
CREATE TRIGGER learn_transcript_append_only BEFORE UPDATE OR DELETE ON learn_transcript FOR EACH ROW EXECUTE FUNCTION reflect_never_changed();
