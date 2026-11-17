-- Calendar sync (Torian, 2026-11-17: "Calendar must SYNC with Google Calendar and other apps, not be rebuilt").
-- Every statement can run again.

-- A calendar the person subscribes to by its iCalendar (ICS) address: Google Calendar's secret address, an iCloud
-- public calendar, Outlook's ICS link. The address is a secret (anyone holding it can read the calendar), so it is
-- sealed with the person's key, and only its host is kept in the clear, to show. The name is sealed like event titles.
-- The parsed events are cached, sealed, with the time they were fetched; Reflect fetches again at most every 15
-- minutes. A tile tags every event from the calendar. A removed calendar keeps its removal time.
CREATE TABLE IF NOT EXISTS calendar_feed (
  id uuid PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"(id),
  name_ct text NOT NULL,
  url_ct text NOT NULL,
  host text NOT NULL,
  tile text CHECK (tile IN ('learn', 'work', 'home', 'body', 'friends', 'mate', 'kin', 'polis', 'ventures', 'legacy')),
  events_ct text,
  last_fetched_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  removed_at timestamptz
);
CREATE INDEX IF NOT EXISTS calendar_feed_user ON calendar_feed (user_id) WHERE removed_at IS NULL;

-- Google Calendar, two-way (dormant until the deployment holds GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET). One row a
-- person: the OAuth tokens sealed with their key, the primary calendar's time zone, the pulled events cached sealed
-- like a feed's, and when they connected (Reflect events made after that are pushed to Google). Disconnecting sets
-- removed_at and drops the tokens.
CREATE TABLE IF NOT EXISTS google_calendar (
  user_id text PRIMARY KEY REFERENCES "user"(id),
  access_ct text,
  refresh_ct text,
  expires_at timestamptz,
  time_zone text,
  events_ct text,
  last_fetched_at timestamptz,
  last_error text,
  connected_at timestamptz NOT NULL DEFAULT now(),
  removed_at timestamptz
);

-- The Google Calendar event a Reflect event was pushed to, so a change or removal follows it there.
ALTER TABLE calendar_event ADD COLUMN IF NOT EXISTS google_id text;
