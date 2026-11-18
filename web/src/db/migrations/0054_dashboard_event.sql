-- The dashboard, measured first-party (dashboard, 2026-11-18): each open of /dashboard, each tap on a card, and the
-- time from opening to the first act (a tap on any card or an ask). No third-party analytics. The owner sees only
-- counts across everyone (Settings, Dashboard); nobody sees another person's rows.
CREATE TABLE IF NOT EXISTS dashboard_event (
  id bigserial PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('open', 'tap', 'first_act')),
  card text NOT NULL CHECK (card ~ '^[a-z0-9-]{1,40}$'),
  ms integer CHECK (ms IS NULL OR (ms >= 0 AND ms <= 3600000)),
  at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS dashboard_event_at ON dashboard_event (at);
CREATE INDEX IF NOT EXISTS dashboard_event_user ON dashboard_event (user_id, at);

-- Whether the person wants the morning brief, off until they turn it on.
CREATE TABLE IF NOT EXISTS dashboard_pref (
  user_id text PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  morning_brief boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
