-- The connector marketplace (2026-11-18): a person's sign-ins to remote MCP servers (GitHub, Vercel, Resend, Gmail and
-- any server they add by address). Everything the sign-in yields (Reflect's client registration with that server, the
-- tokens, the PKCE verifier and what discovery found) is sealed with the person's key. A connection is pending until
-- the sign-in comes back, connected after, and removed when the person disconnects (the row is kept, the tokens are
-- cleared). web/src/server/mcp-connections.ts reads and writes it.
CREATE TABLE IF NOT EXISTS mcp_connection (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"(id),
  connector text NOT NULL,
  name text NOT NULL,
  server_url text NOT NULL,
  state text UNIQUE,
  client_ct text,
  tokens_ct text,
  verifier_ct text,
  discovery_ct text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'connected', 'removed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  connected_at timestamptz,
  removed_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS mcp_connection_live ON mcp_connection (user_id, server_url) WHERE status <> 'removed';
CREATE INDEX IF NOT EXISTS mcp_connection_user ON mcp_connection (user_id, status);
