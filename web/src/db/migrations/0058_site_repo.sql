-- A personal site the person hosts themselves, controlled from Reflect through GitHub (Torian, 2026-11-18 20:47Z).
-- The site's repository (owner/name), the branch Reflect commits to, and the folder and extension its posts use.
-- A post remembers the path it was written to, so unpublishing removes that file. web/src/server/site-repo.ts.
ALTER TABLE site ADD COLUMN IF NOT EXISTS repo text;
ALTER TABLE site ADD COLUMN IF NOT EXISTS repo_branch text;
ALTER TABLE site ADD COLUMN IF NOT EXISTS repo_folder text;
ALTER TABLE site ADD COLUMN IF NOT EXISTS repo_ext text CHECK (repo_ext IN ('md', 'mdx'));
ALTER TABLE post ADD COLUMN IF NOT EXISTS repo_path text;
