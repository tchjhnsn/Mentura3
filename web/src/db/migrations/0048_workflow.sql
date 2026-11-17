-- Durable plans for Ask Reflect (Ask Reflect plan, step 9). Every statement can run again.

-- One row per plan: an ordered list of registry actions (web/src/server/actions/workflows.ts) asked for from the
-- chat or the person's own AI over MCP, run one after another. `title` and `steps` (each step's action id, input,
-- status and change id) hold the person's words, so each is sealed with the person's key and kept as a JSON string,
-- like action_change's input. A step that is shared or leaves Reflect is held in action_change; the plan is then
-- 'waiting' with that change in waiting_change, and goes on when the person taps Keep or Send ('running', then
-- 'done'), or stops when they tap Decline or a step fails ('failed', with a note). `current` is the step running or
-- waiting. Plans resume from this row, never from memory, so a page reload loses nothing.
CREATE TABLE IF NOT EXISTS workflow (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES "user"(id),
  origin text NOT NULL CHECK (origin IN ('chat', 'mcp', 'page', 'workflow')),
  title jsonb NOT NULL,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'waiting', 'done', 'failed')),
  current integer NOT NULL DEFAULT 0,
  steps jsonb NOT NULL,
  waiting_change uuid REFERENCES action_change(id),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS workflow_user ON workflow (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS workflow_waiting ON workflow (user_id, waiting_change) WHERE status = 'waiting';
