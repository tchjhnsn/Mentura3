-- Site pages in Markdown (plan "Appearance, Virtu and the site editor", 2026-11-18, PRs 3 and 4). A page of a
-- person's site is one Markdown document with components from the library as MDX tags with literal values only
-- (`@reflect/core/site-page`). Home has the path '' and Writing 'writing'; added pages take a free slug. The draft
-- (body) saves itself as the person writes; Publish copies it to published_body, which is all visitors see. version
-- counts saves, so a save from an older window is refused. Posts stay in `post`. Removing a page marks removed_at.
-- web/src/server/site-pages.ts reads and writes these.
CREATE TABLE IF NOT EXISTS site_page (
  id text PRIMARY KEY,
  site_user_id text NOT NULL REFERENCES "user"(id),
  path text NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  published_body text,
  published_at timestamptz,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  removed_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS site_page_live_path ON site_page (site_user_id, path) WHERE removed_at IS NULL;

-- A part shared on a site (PR 4). A <Part source="..."> shows on a public page only when the site's owner shared
-- that source (a row with created_by = owner_id); a household part also needs the household's creator's OK (a row
-- for the same owner and source with created_by = that creator). Taking it back marks unshared_at. The one rule is
-- mayShowPart in `@reflect/core/site-page`; web/src/server/part-share.ts reads and writes these.
CREATE TABLE IF NOT EXISTS part_share (
  id text PRIMARY KEY,
  owner_id text NOT NULL REFERENCES "user"(id),
  source text NOT NULL,
  created_by text NOT NULL REFERENCES "user"(id),
  shared_at timestamptz NOT NULL DEFAULT now(),
  unshared_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS part_share_live ON part_share (owner_id, source, created_by) WHERE unshared_at IS NULL;
CREATE INDEX IF NOT EXISTS part_share_source ON part_share (source) WHERE unshared_at IS NULL;
