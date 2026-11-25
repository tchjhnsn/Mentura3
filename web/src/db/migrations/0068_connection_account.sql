-- A second account of the same service (spec "Integrations: formal specification", R18, P26, 2026-11-25). Each
-- connection is one account at the service. The first keeps no label; each further one carries the name the person
-- gave it ("Work", "Personal"), and a person cannot hold two live connections to one server under the same name.
ALTER TABLE mcp_connection ADD COLUMN IF NOT EXISTS account text;
DROP INDEX IF EXISTS mcp_connection_live;
CREATE UNIQUE INDEX IF NOT EXISTS mcp_connection_live_account ON mcp_connection (user_id, server_url, lower(coalesce(account, ''))) WHERE status <> 'removed';
