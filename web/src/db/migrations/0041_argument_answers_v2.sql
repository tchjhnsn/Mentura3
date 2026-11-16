-- Dialectic practice, second guidelines (Torian, 2026-11-16 22:15Z to 22:33Z, card at 22:36Z: "Yes, apply migration
-- 0041"): questions are asked of units within a turn, by what the words do (act), whether they support or attack
-- something earlier (relation), which statement (target), the kind of argument (scheme) and its critical questions
-- (cq); stasis is asked of an issue. A person may say how sure they are (1 a guess, 2 think so, 3 sure). Answers given
-- under the first guidelines stay as they are. Every statement can run again.
ALTER TABLE argument_answer DROP CONSTRAINT IF EXISTS argument_answer_kind_check;
ALTER TABLE argument_answer ADD CONSTRAINT argument_answer_kind_check
  CHECK (kind IN ('move', 'target', 'stasis', 'act', 'relation', 'scheme', 'cq'));
ALTER TABLE argument_answer ADD COLUMN IF NOT EXISTS confidence smallint CHECK (confidence BETWEEN 1 AND 3);
