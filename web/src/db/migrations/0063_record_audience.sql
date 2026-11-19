-- Who sees a record on the shared side (doc "Private and shared Reflect plan", step 3; `@reflect/core/audience`).
-- Every record Village and polis shows has an audience: 'me' (only the owner), 'invited' (people the owner invites;
-- for an adventure, the people on it), 'met' (people the owner has met: connected, or checked in to the same event)
-- or 'everyone'. NULL means the kind's default (`DEFAULT_AUDIENCE`: an adventure 'invited', every other kind 'me'),
-- so every record keeps what it showed before. The audience is not sealed: the server reads it to decide who sees
-- the record before opening anything. Events keep their status ('draft' for the host, 'published' for everyone) and
-- profile sections their own audiences (member_profile, migration 0051). Every statement can run again.
ALTER TABLE life_record ADD COLUMN IF NOT EXISTS audience text CHECK (audience IS NULL OR audience IN ('me', 'invited', 'met', 'everyone'));
