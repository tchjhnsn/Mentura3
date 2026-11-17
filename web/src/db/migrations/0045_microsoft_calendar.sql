-- Outlook Calendar sync through Microsoft Graph, beside Google Calendar (Torian, 2026-11-17: Google and Microsoft
-- suites added "the same way Anthropic or any AI provider adds them as connectors"). 0044 is the action change log.
-- Every statement can run again.

-- Outlook Calendar, two-way (dormant until the deployment holds MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET). One
-- row a person, shaped like google_calendar: the OAuth tokens sealed with their key, the mailbox's time zone (as the
-- mailbox keeps it, a Windows or IANA name), the pulled events cached sealed, and when they connected (Reflect events
-- made after that are pushed to Outlook). Disconnecting sets removed_at and drops the tokens.
CREATE TABLE IF NOT EXISTS microsoft_calendar (
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

-- The Outlook Calendar event a Reflect event was pushed to, so a change or removal follows it there.
ALTER TABLE calendar_event ADD COLUMN IF NOT EXISTS microsoft_id text;
