-- The dashboard's layout, per person (Torian, 2026-11-18): the order they set for its cards (empty means order by
-- urgency), the cards they hid, and each card's size on a wide screen. One row a person; the whole layout as JSON.
CREATE TABLE IF NOT EXISTS dashboard_layout (
  user_id text PRIMARY KEY REFERENCES "user"(id),
  layout jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);
