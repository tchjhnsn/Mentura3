-- A connection whose sign-in the service rejected (spec "Integrations: formal specification", M1 Connection, R17,
-- 2026-11-25). Expired keeps the row, its businesses and its sealed client, so Reconnect brings everything back with
-- the same id; only Disconnect clears the sign-in. The service answers 401 after Reflect's one refresh attempt.
ALTER TABLE mcp_connection DROP CONSTRAINT IF EXISTS mcp_connection_status_check;
ALTER TABLE mcp_connection ADD CONSTRAINT mcp_connection_status_check CHECK (status IN ('pending', 'connected', 'expired', 'removed'));
ALTER TABLE mcp_connection ADD COLUMN IF NOT EXISTS expired_at timestamptz;
