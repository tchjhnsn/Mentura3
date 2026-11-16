-- Dialectic practice (Torian, 2026-11-16 20:56Z, card: "Yes, I confirm a drafted list"): a person's answer to one
-- question about one turn of a dialogue, by the turn's key (work, turn number and a hash of its text) and the kind of
-- question (move, target, stasis), with the guidelines version it was given under and whether the item was settled when
-- asked. Answers are combined in code; nothing here is changed. Every statement can run again.
CREATE TABLE IF NOT EXISTS argument_answer (
  id uuid PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"(id),
  turn_key text NOT NULL CHECK (length(turn_key) BETWEEN 1 AND 200),
  kind text NOT NULL CHECK (kind IN ('move', 'target', 'stasis')),
  answer text NOT NULL CHECK (length(answer) BETWEEN 1 AND 200),
  guidelines integer NOT NULL,
  settled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS argument_answer_turn ON argument_answer (turn_key, kind);
CREATE INDEX IF NOT EXISTS argument_answer_user ON argument_answer (user_id, created_at);
DROP TRIGGER IF EXISTS argument_answer_append_only ON argument_answer;
CREATE TRIGGER argument_answer_append_only BEFORE UPDATE OR DELETE ON argument_answer FOR EACH ROW EXECUTE FUNCTION reflect_never_changed();
