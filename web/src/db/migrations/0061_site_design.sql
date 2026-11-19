-- A personal site's design (Torian, 2026-11-18 23:45Z: the Virtu editor built into Reflect). The owner's edits to the
-- site's Virtu system (packages/virtu/site), in order, as the editor sends them; every saved list passes Virtu's check.
-- web/src/server/site-design.ts.
ALTER TABLE site ADD COLUMN IF NOT EXISTS design jsonb NOT NULL DEFAULT '[]'::jsonb;
