-- The feed of running work (doc "Mentura console: screens, navigation and teams", round 5, B1 bottom bar, "Running").
-- Work Mentura runs that a person waits on writes one row when it starts, moves its step as it goes, and ends it done,
-- failed or in conflict (src/server/work-runs.ts). The bottom bar reads the rows of one business in one team. Today the
-- only work that reports here is a sync push from a working copy (src/server/sync-store.ts).
--
-- No foreign keys: a team or an account deleted later leaves its rows, which then lead nowhere and age out of the bar.
-- Every statement can run again.
CREATE TABLE IF NOT EXISTS work_run (
  id text PRIMARY KEY,
  team text NOT NULL,
  venture text NOT NULL,
  kind text NOT NULL,
  name text NOT NULL,
  started_by text NOT NULL,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'done', 'failed', 'conflict')),
  step integer NOT NULL DEFAULT 1,
  steps integer NOT NULL DEFAULT 1,
  step_label text,
  failure text,
  log jsonb NOT NULL DEFAULT '[]'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);
CREATE INDEX IF NOT EXISTS work_run_business ON work_run (team, venture, started_at DESC);
