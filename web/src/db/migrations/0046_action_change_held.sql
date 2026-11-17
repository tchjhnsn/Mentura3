-- Approvals for shared and outside actions (Ask Reflect plan, step 3). Every statement can run again.

-- A shared or outside action asked for from the chat or the person's own AI over MCP does not run: it is kept in
-- action_change as 'held', with its input and `preview` (what will happen, in plain words, sealed with the person's
-- key like input), until the person taps Keep or Send (status 'done') or Decline (status 'declined'). decided_at is
-- when they tapped. A held row older than 7 days cannot be approved (web/src/server/actions/run.ts).
ALTER TABLE action_change ADD COLUMN IF NOT EXISTS preview jsonb;
ALTER TABLE action_change ADD COLUMN IF NOT EXISTS decided_at timestamptz;
ALTER TABLE action_change DROP CONSTRAINT IF EXISTS action_change_status_check;
ALTER TABLE action_change ADD CONSTRAINT action_change_status_check CHECK (status IN ('done', 'held', 'undone', 'declined'));
CREATE INDEX IF NOT EXISTS action_change_held ON action_change (user_id, created_at DESC) WHERE status = 'held';
