-- Quotes and their tags (docs/design/REFLECT_QUOTES_2026-11-20.md, step 2; Torian 2026-11-20 08:57Z "go"). A quote is
-- the record: the exact words, who said them, where and when (schema.org Quotation). Everything else is a tag, a W3C
-- Web Annotation on a quote or on a claim (learn_claim stays the claim). The rules are the core's
-- (packages/core/src/quotes.ts): tags are only added, the person's status tags confirm or withdraw, and an assistant's
-- tag or a quote not stated by the person counts only once confirmed. Both tables are append-only. `legacy` names the
-- row an older table held (a stance, a claim source, a domain, kind or origin), so the backfill
-- (web/scripts/backfill-quotes.ts) can run again without doubling. Every statement here can run again.
CREATE TABLE IF NOT EXISTS quote (
  id uuid PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"(id),
  text_ct text NOT NULL,
  speaker_ct text,
  source_kind text NOT NULL CHECK (source_kind IN ('journal', 'conversation', 'book', 'talk', 'post', 'letter', 'reflect', 'other')),
  source_ct text,
  work_id uuid REFERENCES work(id),
  said_at date,
  recorded_by text NOT NULL CHECK (recorded_by IN ('stated', 'journal', 'conversation', 'import', 'noticed')),
  legacy text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, legacy)
);
CREATE INDEX IF NOT EXISTS quote_user ON quote (user_id, created_at);

CREATE TABLE IF NOT EXISTS quote_tag (
  id uuid PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"(id),
  quote_id uuid REFERENCES quote(id),
  claim_id uuid REFERENCES learn_claim(id),
  seq int NOT NULL CHECK (seq >= 1),
  scheme text NOT NULL CHECK (scheme IN ('act', 'claim', 'relation', 'subject', 'domain', 'kind', 'origin', 'note', 'status')),
  purpose text NOT NULL CHECK (purpose IN ('tagging', 'classifying', 'identifying', 'linking', 'commenting', 'assessing')),
  value text,
  value_ct text,
  object text,
  selector_ct text,
  detail_ct text,
  creator text NOT NULL CHECK (creator IN ('person', 'assistant')),
  legacy text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((quote_id IS NULL) <> (claim_id IS NULL)),
  CHECK ((value IS NULL) <> (value_ct IS NULL)),
  UNIQUE (user_id, legacy)
);
CREATE UNIQUE INDEX IF NOT EXISTS quote_tag_quote_seq ON quote_tag (quote_id, seq) WHERE quote_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS quote_tag_claim_seq ON quote_tag (claim_id, seq) WHERE claim_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS quote_tag_user ON quote_tag (user_id, created_at);

CREATE OR REPLACE FUNCTION reflect_never_changed() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'reflect: % is append-only', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS quote_append_only ON quote;
CREATE TRIGGER quote_append_only BEFORE UPDATE OR DELETE ON quote FOR EACH ROW EXECUTE FUNCTION reflect_never_changed();
DROP TRIGGER IF EXISTS quote_tag_append_only ON quote_tag;
CREATE TRIGGER quote_tag_append_only BEFORE UPDATE OR DELETE ON quote_tag FOR EACH ROW EXECUTE FUNCTION reflect_never_changed();
