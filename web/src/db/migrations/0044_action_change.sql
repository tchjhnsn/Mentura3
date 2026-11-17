-- Every change an action makes, kept so the person can see it and undo their own (Ask Reflect plan, step 2).
-- Every statement can run again.

-- One row per run of a non-read action from the registry (web/src/server/actions/), from the chat, the person's own
-- AI over MCP, a page or a workflow. `input`, `before` and `after` hold the person's words and records, so each is
-- sealed with the person's key and kept as a JSON string, like every other sealed field. An own-tier change can be
-- undone by the same person within 30 days: its status becomes 'undone' and undone_at is set. 'held' is for a shared
-- or outside action that waits for the person's Keep or Send tap (a later step).
CREATE TABLE IF NOT EXISTS action_change (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES "user"(id),
  action_id text NOT NULL,
  source text NOT NULL CHECK (source IN ('chat', 'mcp', 'page', 'workflow')),
  tier text NOT NULL,
  input jsonb NOT NULL,
  before jsonb,
  after jsonb,
  status text NOT NULL DEFAULT 'done' CHECK (status IN ('done', 'held', 'undone')),
  created_at timestamptz NOT NULL DEFAULT now(),
  undone_at timestamptz
);
CREATE INDEX IF NOT EXISTS action_change_user ON action_change (user_id, created_at DESC);
