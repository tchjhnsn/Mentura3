-- Moving a business to another team (doc "Mentura console: screens, navigation and teams", 2026-11-25, D5). The
-- business's records move in the hosted business store (packages/platform/hosted/move-business.ts); this table keeps
-- each move, so a link to the business in its old team opens it in its new one for someone on that team
-- (src/server/moving.ts). No foreign keys: a team or an account deleted later leaves the row, which then leads nowhere.
--
-- Nothing is deleted or updated. Every statement can run again.
CREATE TABLE IF NOT EXISTS business_move (
  id bigserial PRIMARY KEY,
  venture text NOT NULL,
  from_team text NOT NULL,
  to_team text NOT NULL,
  moved_by text NOT NULL,
  moved_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS business_move_from ON business_move (from_team, venture, moved_at DESC);
