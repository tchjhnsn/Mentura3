-- A person's own site and blog (doc "Personal site and blog design guide", 2026-11-18). The profile at /p/<handle>
-- is the site. A post is a published copy of one journal work (essay, letter, plan or memoir; never an entry,
-- examination, exercise or decision), in plain text because it is public. The journal's own sealed text is
-- untouched. Unpublishing marks the post (unpublished_at) and takes its page down; nothing is deleted.
-- web/src/server/site-store.ts reads and writes these.
CREATE TABLE IF NOT EXISTS site (
  user_id text PRIMARY KEY REFERENCES "user"(id),
  template text NOT NULL DEFAULT 'plain' CHECK (template IN ('plain', 'builder', 'notebook')),
  domain text UNIQUE,
  domain_checked_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS post (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"(id),
  work_id uuid NOT NULL REFERENCES work(id),
  slug text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('essay', 'letter', 'plan', 'memoir')),
  title text NOT NULL,
  body text NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  unpublished_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS post_live_slug ON post (user_id, slug) WHERE unpublished_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS post_live_work ON post (work_id) WHERE unpublished_at IS NULL;
CREATE INDEX IF NOT EXISTS post_user ON post (user_id, published_at DESC);

-- Subscribers to a site: an email sealed with the site owner's key, found again by a keyed hash. Double opt-in:
-- a subscriber counts once they follow the link sent to them (confirmed_at). Leaving marks left_at.
CREATE TABLE IF NOT EXISTS site_subscriber (
  id text PRIMARY KEY,
  site_user_id text NOT NULL REFERENCES "user"(id),
  email_ct text NOT NULL,
  email_tag text NOT NULL,
  token text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  left_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS site_subscriber_live ON site_subscriber (site_user_id, email_tag) WHERE left_at IS NULL;
