-- Teams (doc "Mentura console: screens, navigation and teams", 2026-11-25). A team is a Better Auth organization
-- (the organization plugin in src/server/auth-options.ts); Mentura says "team" on every screen. Roles are owner,
-- member and viewer.
--
-- 1. The plugin's tables, as Better Auth's own migration makes them. `pnpm migrate` runs Better Auth's migration
--    before the files here, so on that path these statements find the tables already made and do nothing. They are
--    here so this file also stands alone when it is applied by hand.
-- 2. One personal team for every person who has none: its id is the person's own id, its name "<first name>'s
--    businesses" ("Your businesses" without a name), its URL slug made from that name (with six characters of the id's
--    hash added when the plain slug is taken), and the person as its owner. The hosted business store's tenant is now
--    the team's id, so every business made before teams, keyed by its person's id, is that person's personal team's
--    business with no row moved.
--
-- Nothing is deleted or updated. Every statement can run again.

CREATE TABLE IF NOT EXISTS "organization" ("id" text not null primary key, "name" text not null, "slug" text not null unique, "logo" text, "createdAt" timestamptz not null, "metadata" text);
CREATE TABLE IF NOT EXISTS "member" ("id" text not null primary key, "organizationId" text not null references "organization" ("id") on delete cascade, "userId" text not null references "user" ("id") on delete cascade, "role" text not null, "createdAt" timestamptz not null);
CREATE TABLE IF NOT EXISTS "invitation" ("id" text not null primary key, "organizationId" text not null references "organization" ("id") on delete cascade, "email" text not null, "role" text, "status" text not null, "expiresAt" timestamptz not null, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "inviterId" text not null references "user" ("id") on delete cascade);
CREATE INDEX IF NOT EXISTS "member_organizationId_idx" ON "member" ("organizationId");
CREATE INDEX IF NOT EXISTS "member_userId_idx" ON "member" ("userId");
CREATE INDEX IF NOT EXISTS "invitation_organizationId_idx" ON "invitation" ("organizationId");
CREATE INDEX IF NOT EXISTS "invitation_email_idx" ON "invitation" ("email");
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "activeOrganizationId" text;

-- The personal teams. The slug follows slugify in src/server/teams-core.ts: lower case, apostrophes dropped, every
-- other run of characters that are not a-z or 0-9 a single hyphen, at most 40 characters.
WITH named AS (
  SELECT u.id,
         CASE WHEN coalesce(split_part(btrim(u.name), ' ', 1), '') = '' THEN 'Your businesses'
              ELSE split_part(btrim(u.name), ' ', 1) || '''s businesses' END AS name
    FROM "user" u
   WHERE NOT EXISTS (SELECT 1 FROM "organization" o WHERE o.id = u.id)
), slugged AS (
  SELECT id, name,
         coalesce(nullif(left(btrim(regexp_replace(replace(lower(name), '''', ''), '[^a-z0-9]+', '-', 'g'), '-'), 40), ''), 'team') AS base
    FROM named
), ranked AS (
  SELECT id, name, base, row_number() OVER (PARTITION BY base ORDER BY id) AS n FROM slugged
)
INSERT INTO "organization" ("id", "name", "slug", "createdAt")
SELECT id, name,
       CASE WHEN n = 1 AND NOT EXISTS (SELECT 1 FROM "organization" o WHERE o.slug = base) THEN base
            ELSE left(rtrim(left(base, 33), '-') || '-' || left(md5(id), 6), 40) END,
       now()
  FROM ranked
ON CONFLICT DO NOTHING;

INSERT INTO "member" ("id", "organizationId", "userId", "role", "createdAt")
SELECT 'personal-' || u.id, u.id, u.id, 'owner', now()
  FROM "user" u
  JOIN "organization" o ON o.id = u.id
 WHERE NOT EXISTS (SELECT 1 FROM "member" m WHERE m."organizationId" = u.id AND m."userId" = u.id)
ON CONFLICT DO NOTHING;
