-- The dashboard's morning brief (Torian, 2026-11-18, dashboard item 6): one a person a day, so a reload shows the
-- one already written and does not ask the model again. Its sentences and their links are sealed with the person's
-- key, like their records, since they are drawn from them. Refresh writes over the day's row. Every statement can
-- run again.
CREATE TABLE IF NOT EXISTS dashboard_brief (
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  day date NOT NULL,
  body_ct text NOT NULL,
  model text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, day)
);
