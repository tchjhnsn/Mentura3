-- Dialectic (Torian, 2026-11-16 09:09Z, guide tab "Ways and dialectic"; applied to preview and production on his
-- card): debates, rooms and threads, the way of learning that needs other people. Every row is new and nothing is
-- ever changed: a seat, a join, a leave, a raised hand, a host letting someone speak, a closed room and a taken-down
-- post are each rows of their own. Every statement here can run again.

CREATE TABLE IF NOT EXISTS debate (
  id uuid PRIMARY KEY,
  host_id text NOT NULL REFERENCES "user"(id),
  motion text NOT NULL CHECK (length(motion) BETWEEN 8 AND 200),
  work_id text CHECK (work_id IS NULL OR length(work_id) BETWEEN 1 AND 120),
  source text CHECK (source IS NULL OR length(source) BETWEEN 1 AND 200),
  format text NOT NULL CHECK (length(format) BETWEEN 1 AND 40),
  starts_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS debate_starts ON debate (starts_at);
DROP TRIGGER IF EXISTS debate_append_only ON debate;
CREATE TRIGGER debate_append_only BEFORE UPDATE OR DELETE ON debate FOR EACH ROW EXECUTE FUNCTION reflect_never_changed();

CREATE TABLE IF NOT EXISTS debate_seat (
  id uuid PRIMARY KEY,
  debate_id uuid NOT NULL REFERENCES debate(id),
  user_id text NOT NULL REFERENCES "user"(id),
  side text NOT NULL CHECK (side IN ('for', 'against')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS debate_seat_debate ON debate_seat (debate_id, created_at);
DROP TRIGGER IF EXISTS debate_seat_append_only ON debate_seat;
CREATE TRIGGER debate_seat_append_only BEFORE UPDATE OR DELETE ON debate_seat FOR EACH ROW EXECUTE FUNCTION reflect_never_changed();

CREATE TABLE IF NOT EXISTS dialectic_room (
  id uuid PRIMARY KEY,
  host_id text NOT NULL REFERENCES "user"(id),
  title text NOT NULL CHECK (length(title) BETWEEN 3 AND 200),
  question text CHECK (question IS NULL OR length(question) BETWEEN 8 AND 300),
  work_id text CHECK (work_id IS NULL OR length(work_id) BETWEEN 1 AND 120),
  debate_id uuid UNIQUE REFERENCES debate(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS dialectic_room_created ON dialectic_room (created_at);
DROP TRIGGER IF EXISTS dialectic_room_append_only ON dialectic_room;
CREATE TRIGGER dialectic_room_append_only BEFORE UPDATE OR DELETE ON dialectic_room FOR EACH ROW EXECUTE FUNCTION reflect_never_changed();

CREATE TABLE IF NOT EXISTS dialectic_room_closed (
  room_id uuid PRIMARY KEY REFERENCES dialectic_room(id),
  user_id text NOT NULL REFERENCES "user"(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS dialectic_room_closed_append_only ON dialectic_room_closed;
CREATE TRIGGER dialectic_room_closed_append_only BEFORE UPDATE OR DELETE ON dialectic_room_closed FOR EACH ROW EXECUTE FUNCTION reflect_never_changed();

-- kind: join, leave, hand (raised), grant (the host let user_id speak; by_id is the host).
CREATE TABLE IF NOT EXISTS dialectic_room_event (
  id uuid PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES dialectic_room(id),
  user_id text NOT NULL REFERENCES "user"(id),
  kind text NOT NULL CHECK (kind IN ('join', 'leave', 'hand', 'grant')),
  by_id text REFERENCES "user"(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS dialectic_room_event_room ON dialectic_room_event (room_id, created_at);
DROP TRIGGER IF EXISTS dialectic_room_event_append_only ON dialectic_room_event;
CREATE TRIGGER dialectic_room_event_append_only BEFORE UPDATE OR DELETE ON dialectic_room_event FOR EACH ROW EXECUTE FUNCTION reflect_never_changed();

CREATE TABLE IF NOT EXISTS dialectic_room_message (
  id uuid PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES dialectic_room(id),
  user_id text NOT NULL REFERENCES "user"(id),
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS dialectic_room_message_room ON dialectic_room_message (room_id, created_at);
DROP TRIGGER IF EXISTS dialectic_room_message_append_only ON dialectic_room_message;
CREATE TRIGGER dialectic_room_message_append_only BEFORE UPDATE OR DELETE ON dialectic_room_message FOR EACH ROW EXECUTE FUNCTION reflect_never_changed();

CREATE TABLE IF NOT EXISTS dialectic_thread (
  id uuid PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"(id),
  question text NOT NULL CHECK (length(question) BETWEEN 8 AND 300),
  work_id text CHECK (work_id IS NULL OR length(work_id) BETWEEN 1 AND 120),
  body text CHECK (body IS NULL OR length(body) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS dialectic_thread_created ON dialectic_thread (created_at);
DROP TRIGGER IF EXISTS dialectic_thread_append_only ON dialectic_thread;
CREATE TRIGGER dialectic_thread_append_only BEFORE UPDATE OR DELETE ON dialectic_thread FOR EACH ROW EXECUTE FUNCTION reflect_never_changed();

CREATE TABLE IF NOT EXISTS dialectic_post (
  id uuid PRIMARY KEY,
  thread_id uuid NOT NULL REFERENCES dialectic_thread(id),
  user_id text NOT NULL REFERENCES "user"(id),
  parent_id uuid REFERENCES dialectic_post(id),
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS dialectic_post_thread ON dialectic_post (thread_id, created_at);
DROP TRIGGER IF EXISTS dialectic_post_append_only ON dialectic_post;
CREATE TRIGGER dialectic_post_append_only BEFORE UPDATE OR DELETE ON dialectic_post FOR EACH ROW EXECUTE FUNCTION reflect_never_changed();

CREATE TABLE IF NOT EXISTS dialectic_post_removed (
  post_id uuid PRIMARY KEY REFERENCES dialectic_post(id),
  user_id text NOT NULL REFERENCES "user"(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS dialectic_post_removed_append_only ON dialectic_post_removed;
CREATE TRIGGER dialectic_post_removed_append_only BEFORE UPDATE OR DELETE ON dialectic_post_removed FOR EACH ROW EXECUTE FUNCTION reflect_never_changed();
