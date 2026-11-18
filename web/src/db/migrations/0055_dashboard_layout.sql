-- The dashboard's layout per person (Dashboard, 2026-11-18): for each card id in DASH_CARDS
-- (web/src/app/dashboard/cards/index.ts), its place in the order, whether it is hidden and its size. One row per person,
-- the layout as JSON ({ order: [id], hidden: [id], sizes: { id: size } }); web/src/server/dashboard-layout.ts reads and
-- writes it. No row means the default layout.
CREATE TABLE IF NOT EXISTS dashboard_layout (
  user_id text PRIMARY KEY REFERENCES "user"(id),
  layout jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);
