-- Plugins a person added from the marketplace (Torian, 2026-11-18 21:11Z, "Skills first, apps later"). A plugin is a
-- catalog entry (@reflect/core/marketplace PLUGINS): connectors plus a skill Ask Reflect follows while it is added.
-- Removing marks removed_at. web/src/server/plugins.ts.
CREATE TABLE IF NOT EXISTS plugin_install (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"(id),
  plugin text NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  removed_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS plugin_install_live ON plugin_install (user_id, plugin) WHERE removed_at IS NULL;
