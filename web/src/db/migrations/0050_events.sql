-- Events and connections (doc "Events and connections design guide", 2026-11-18). Every statement can run again.
-- Events are found or hosted in the Events tool, people check in at the door, and two people who both tap Connect
-- become friends (friend_link, migration 0047) with the event they met at. People who want to build are found in
-- Ventures through build requests.

-- One event: hosted in Reflect (source 'reflect', host_user set) or from Eddy's Austin feed (source 'eddy',
-- source_id = its event id, attributed on every page). A published event is public, so its fields are not sealed.
-- door_token_hash is the hash of the token in the host's check-in QR; only the hash is kept.
CREATE TABLE IF NOT EXISTS event (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL CHECK (source IN ('reflect', 'eddy')),
  source_id text,
  host_user text REFERENCES "user"(id),
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'cancelled')),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  venue text,
  address text,
  url text,
  cover_url text,
  tags text[] NOT NULL DEFAULT '{}',
  price text,
  city text NOT NULL DEFAULT 'austin',
  for_whom text,
  door_token_hash text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((source = 'reflect') = (host_user IS NOT NULL)),
  CHECK (source = 'reflect' OR source_id IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS event_source ON event (source, source_id) WHERE source_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS event_starts ON event (city, starts_at) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS event_host ON event (host_user) WHERE host_user IS NOT NULL;

-- Who said Going. Going adds the event to the person's calendar view (read from here, not copied).
CREATE TABLE IF NOT EXISTS event_rsvp (
  event_id uuid NOT NULL REFERENCES event(id),
  user_id text NOT NULL REFERENCES "user"(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);
CREATE INDEX IF NOT EXISTS event_rsvp_user ON event_rsvp (user_id);

-- Who checked in at the door. Only people checked in to an event see who else is, and only while it runs.
CREATE TABLE IF NOT EXISTS event_checkin (
  event_id uuid NOT NULL REFERENCES event(id),
  user_id text NOT NULL REFERENCES "user"(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

-- What a member shows to people they meet: one line, their interests, and whether they want to build something.
-- Nothing shows until the person writes it; the default is name and face only.
CREATE TABLE IF NOT EXISTS member_profile (
  user_id text PRIMARY KEY REFERENCES "user"(id),
  line text CHECK (line IS NULL OR char_length(line) <= 120),
  interests text[] NOT NULL DEFAULT '{}',
  builds boolean NOT NULL DEFAULT false,
  personal_token_hash text UNIQUE,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- A tap on Connect. Nothing shows to the other person as a connection until they tap too; then both rows of the
-- pair resolve, a friend_link is made with met_event, and the request is accepted. Unanswered requests lapse after
-- 7 days.
CREATE TABLE IF NOT EXISTS connect_request (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user text NOT NULL REFERENCES "user"(id),
  to_user text NOT NULL REFERENCES "user"(id),
  event_id uuid REFERENCES event(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days',
  accepted_at timestamptz,
  declined_at timestamptz,
  CHECK (from_user <> to_user)
);
CREATE UNIQUE INDEX IF NOT EXISTS connect_request_open ON connect_request (from_user, to_user) WHERE accepted_at IS NULL AND declined_at IS NULL;
CREATE INDEX IF NOT EXISTS connect_request_to ON connect_request (to_user) WHERE accepted_at IS NULL AND declined_at IS NULL;

-- Where a pair met, and how each sees the friendship (Aristotle, Ethics VIII.3: utility, pleasure, the good).
ALTER TABLE friend_link ADD COLUMN IF NOT EXISTS met_event uuid REFERENCES event(id);
CREATE TABLE IF NOT EXISTS friend_kind (
  user_id text NOT NULL REFERENCES "user"(id),
  other_id text NOT NULL REFERENCES "user"(id),
  kind text NOT NULL CHECK (kind IN ('utility', 'pleasure', 'good')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, other_id)
);

-- Ask to build: a request to build one of the asker's ventures (a Ventures life_record) together. Both say yes.
CREATE TABLE IF NOT EXISTS build_request (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid NOT NULL REFERENCES life_record(id),
  from_user text NOT NULL REFERENCES "user"(id),
  to_user text NOT NULL REFERENCES "user"(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  declined_at timestamptz,
  CHECK (from_user <> to_user)
);
CREATE UNIQUE INDEX IF NOT EXISTS build_request_open ON build_request (venture_id, to_user) WHERE accepted_at IS NULL AND declined_at IS NULL;
CREATE INDEX IF NOT EXISTS build_request_to ON build_request (to_user) WHERE accepted_at IS NULL AND declined_at IS NULL;
