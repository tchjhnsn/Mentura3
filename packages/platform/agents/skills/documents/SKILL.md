---
name: documents
description: >
  Decide what form a piece of work takes before a person sees it, in a fixed order: the record first, then a print
  copy a person reads and approves, then a document or deck for someone outside, and HTML last. Use whenever you draft
  something a person must approve, or are asked for a PDF, deck, document or page.
---

# Documents

Every piece of work starts as a record, and a person approves it before anything is built from it. The forms come in
a fixed order, and none is made before the one above it is approved.

1. **The record.** It is the durable object, written through the router. It may wait as a held draft, but nothing is
   built from a draft.
2. **The print copy.** A Markdown file a person can read in one sitting, print, and bring to a meeting. The meeting
   writes one for every agenda item an agent works, at `.naive/presentations/<meeting>/<item>.md`, and the person
   approves the item from it (`/approve`) or sends it back (`/rework`). Write records whose fields read well there:
   plain sentences, a claim before its evidence.
3. **A document for someone outside the business**, made only from approved records:
   - **PDF** for something read alone and kept: a one-pager, a memo to an advisor, terms. Use the `pdf` skill.
   - **Word** only when the reader will edit it and asked for Word. Use the `docx` skill.
   - **A deck** only when the work is presented live to an audience: an investor meeting, a customer pitch, a
     partner review. Make one slide per approved claim, with its evidence. Use the `pptx` skill.
   - **A spreadsheet** only for numbers a person will change: a budget, a forecast. Use the `xlsx` skill.
4. **HTML is last.** A page or a site is built only after its words are approved as a print copy, and by a different
   agent from the one that wrote them (the ownership skill).

The `pdf`, `docx`, `pptx` and `xlsx` skills are Anthropic's published document skills. Use them as they are, and do
not write your own converters.

## Before you make anything

- Name the record each part comes from. When a record is missing, say so and stop: do not fill the gap with prose.
- Nothing internal reaches an outside document: no internal names, no record paths, no notes to yourself.
- Say who approves it and what they approve from. A document nobody can approve from a print copy is not ready.
