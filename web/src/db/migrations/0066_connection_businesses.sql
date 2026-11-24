-- Which of a person's businesses may use one of their connections (business console, V24 and V26, doc "Business
-- console integrations", 2026-11-24). NULL means every business they own, now and later; an array lists business ids
-- (Naive venture ids, or a sample's slug). The sign-in stays the person's: this only says where the console offers it.
ALTER TABLE mcp_connection ADD COLUMN IF NOT EXISTS businesses text[];
