-- Profiles and accounts (doc "Profiles and accounts design guide", 2026-11-18): one profile per person at /p/<handle>,
-- each section shown to the audience the person sets; their links to other accounts, each confirmed or not; their
-- experience; and their LinkedIn connections from LinkedIn's own export, kept private.

-- A handle: 3 to 30 lower-case letters, digits or hyphens. Audiences: everyone, met (people the person is connected
-- with or checked in to an event with), me (only them). section_audience maps a section id to one of those.
ALTER TABLE member_profile ADD COLUMN IF NOT EXISTS handle text UNIQUE CHECK (handle IS NULL OR handle ~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$');
ALTER TABLE member_profile ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'met' CHECK (audience IN ('everyone', 'met', 'me'));
ALTER TABLE member_profile ADD COLUMN IF NOT EXISTS section_audience jsonb NOT NULL DEFAULT '{}';

-- An old handle keeps sending people to its owner's profile for 30 days after a change.
CREATE TABLE IF NOT EXISTS handle_redirect (
  handle text PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"(id),
  until timestamptz NOT NULL DEFAULT now() + interval '30 days'
);

-- A link to one of the person's accounts elsewhere. confirmed_by says how Reflect knows it is theirs: rel-me (their page
-- there links back to their profile), linkedin-mutual (two LinkedIn exports agree), or null (their word only).
CREATE TABLE IF NOT EXISTS social_link (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES "user"(id),
  service text NOT NULL,
  url text NOT NULL CHECK (char_length(url) <= 300),
  handle text,
  confirmed_by text CHECK (confirmed_by IS NULL OR confirmed_by IN ('rel-me', 'linkedin-mutual')),
  confirmed_at timestamptz,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, url)
);
CREATE INDEX IF NOT EXISTS social_link_user ON social_link (user_id, position);

-- A position or a school on the profile, typed or kept from a LinkedIn export.
CREATE TABLE IF NOT EXISTS experience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES "user"(id),
  kind text NOT NULL CHECK (kind IN ('position', 'school')),
  organisation text NOT NULL CHECK (char_length(organisation) <= 200),
  title text CHECK (title IS NULL OR char_length(title) <= 200),
  starts text,
  ends text,
  source text NOT NULL DEFAULT 'typed' CHECK (source IN ('typed', 'linkedin')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS experience_user ON experience (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS experience_once ON experience (user_id, kind, organisation, coalesce(title, ''), coalesce(starts, ''));

-- A first-degree LinkedIn connection from the person's own export. Private to them: the name, company and position are
-- sealed with their key, and the profile link is kept only as a hash, which is what the mutual match compares.
CREATE TABLE IF NOT EXISTS linkedin_connection (
  user_id text NOT NULL REFERENCES "user"(id),
  link_hash text NOT NULL,
  name_ct text NOT NULL,
  company_ct text,
  position_ct text,
  connected_on date,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, link_hash)
);
CREATE INDEX IF NOT EXISTS linkedin_connection_hash ON linkedin_connection (link_hash);
