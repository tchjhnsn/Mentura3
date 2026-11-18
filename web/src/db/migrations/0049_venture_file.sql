-- A venture's files, in Naive's layout (2026-11-18: "Ventures may need a file tree"; the card: "In Reflect,
-- exportable"). Every statement can run again.

-- One row per file of a Ventures record (life_record, app 'ventures'): its path in the venture folder, such as
-- 'venture.json' or 'raw/dump/from-reflect.md', and its text. The text holds the person's words, so it is sealed with
-- the person's key and kept as a JSON string, like workflow's steps. An empty folder is kept as a '.gitkeep' file, as
-- Naive's template does. Starting a venture in Naive writes its first files (start_naive_venture); the folder can be
-- downloaded as a zip and opened by Naive.
CREATE TABLE IF NOT EXISTS venture_file (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES "user"(id),
  venture_id uuid NOT NULL REFERENCES life_record(id),
  path text NOT NULL CHECK (char_length(path) BETWEEN 1 AND 300),
  body jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, venture_id, path)
);
CREATE INDEX IF NOT EXISTS venture_file_venture ON venture_file (user_id, venture_id);
