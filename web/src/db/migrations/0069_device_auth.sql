-- Device sign-in for the Naive command line (RFC 8628 device authorization grant; offline sync, EE-174, design
-- docs/design/OFFLINE_SYNC_2026-11-25.md in tchjhnsn/naive). The command line asks for a code, the person approves it
-- at /device while signed in to Mentura, and the exchange gives back a bearer token scoped to one business, which the
-- sync API checks. Nothing secret is kept in the clear: only the sha256 hex of the device code and of the token. The
-- user code is kept normalized (its eight letters, no dash), so the person may type it either way. A code expires by
-- its `expires_at`, read on every poll, so no sweeper is needed and an expired row is left where it is. Every statement
-- here can run again.
CREATE TABLE IF NOT EXISTS naive_device_code (
  id uuid PRIMARY KEY,
  device_code_hash text NOT NULL UNIQUE,
  user_code text NOT NULL UNIQUE,
  client text NOT NULL,
  business text,
  state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'approved', 'denied', 'used')),
  user_id text REFERENCES "user"(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  interval_seconds int NOT NULL DEFAULT 5 CHECK (interval_seconds >= 1),
  last_polled_at timestamptz,
  decided_at timestamptz,
  used_at timestamptz,
  -- An approved or spent code names the person who approved it and the one business it is for.
  CHECK (state NOT IN ('approved', 'used') OR (user_id IS NOT NULL AND business IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS naive_device_code_waiting ON naive_device_code (expires_at) WHERE state = 'pending';

-- One row per command line signed in, which Settings lists and revokes. `business` is the business the token writes
-- to; a token for a second business is a second sign-in.
CREATE TABLE IF NOT EXISTS naive_cli_token (
  id uuid PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"(id),
  business text NOT NULL,
  client text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  device_code_id uuid REFERENCES naive_device_code(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  last_used_at timestamptz,
  revoked_at timestamptz
);
CREATE INDEX IF NOT EXISTS naive_cli_token_person ON naive_cli_token (user_id, created_at DESC);
