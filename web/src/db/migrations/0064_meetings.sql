-- Meetings (doc "Mentura meetings and building-only Mentura design guide", 2026-11-19): a meeting a person hosts, its
-- guests (invited by email, each with an invite link), notes and follow-ups (sealed with the host's key, readable by
-- guests once shared), the host's prep (sealed, host only), and the call (an outside link, or a Daily room once the
-- deployment has DAILY_API_KEY). guest_user marks accounts made from an invite: they see only their meetings.
-- Every statement can run again.
CREATE TABLE IF NOT EXISTS meeting (
  id uuid PRIMARY KEY,
  host_user text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  title text NOT NULL,
  starts_at timestamptz,
  minutes integer NOT NULL DEFAULT 45 CHECK (minutes BETWEEN 5 AND 480),
  agenda text,
  call_url text,
  venture_id text,
  notes_sealed text,
  notes_shared_at timestamptz,
  prep_sealed text,
  daily_room text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS meeting_host_idx ON meeting (host_user, starts_at);

CREATE TABLE IF NOT EXISTS meeting_guest (
  id uuid PRIMARY KEY,
  meeting_id uuid NOT NULL REFERENCES meeting(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  token_hash text NOT NULL UNIQUE,
  token_sealed text NOT NULL,
  user_id text REFERENCES "user"(id) ON DELETE SET NULL,
  invited_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  removed_at timestamptz,
  UNIQUE (meeting_id, email)
);
CREATE INDEX IF NOT EXISTS meeting_guest_user_idx ON meeting_guest (user_id);

CREATE TABLE IF NOT EXISTS meeting_followup (
  id uuid PRIMARY KEY,
  meeting_id uuid NOT NULL REFERENCES meeting(id) ON DELETE CASCADE,
  text_sealed text NOT NULL,
  owner text,
  due date,
  done_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS meeting_followup_meeting_idx ON meeting_followup (meeting_id, created_at);

CREATE TABLE IF NOT EXISTS guest_user (
  user_id text PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  via_meeting uuid REFERENCES meeting(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
