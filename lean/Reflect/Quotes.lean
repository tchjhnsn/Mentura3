/-!
# Quotes and their tags

Torian, 2026-11-20: claims and the like are tags on a quote (docs/design/REFLECT_QUOTES_2026-11-20.md). Mirrored from
`packages/core/src/quotes.ts`:

* a tag is added and never edited; a later status tag from the person confirms or withdraws the tag it names
  (`liveTags`), and the last such status tag wins;
* a tag counts when it is not withdrawn and the person added it or confirmed it;
* the view of what the person said reads only the person's own quotes (`claimView`, "mine").

Proved here: a withdrawn tag never counts; an assistant's tag counts only once the person confirmed it; adding a tag
that is not a status tag never changes what counted before; and the view's own quotes are all the person's.
-/

namespace Reflect.Quotes

inductive Creator where
  | person
  | assistant
  deriving DecidableEq, Repr

inductive Verdict where
  | confirmed
  | withdrawn
  deriving DecidableEq, Repr

/-- A tag is a plain tag (act, claim, domain, ...), or a status tag naming the tag it confirms or withdraws. -/
inductive Body where
  | plain
  | status (v : Verdict) (names : Nat)
  deriving DecidableEq, Repr

structure Tag where
  id : Nat
  creator : Creator
  body : Body
  deriving DecidableEq, Repr

/-- The person's last word on a tag: the last status tag that names it, if any. Only the person's status tags count
(`tagProblems` refuses an assistant's). -/
def verdict : List Tag → Nat → Option Verdict
  | [], _ => none
  | t :: rest, i =>
    match verdict rest i with
    | some v => some v
    | none =>
      match t.creator, t.body with
      | .person, .status v n => if n = i then some v else none
      | _, _ => none

/-- Whether a tag counts now (`liveTags`, confirmed). -/
def counts (tags : List Tag) (t : Tag) : Prop :=
  t.body = .plain ∧ verdict tags t.id ≠ some .withdrawn ∧ (t.creator = .person ∨ verdict tags t.id = some .confirmed)

theorem withdrawn_never_counts (tags : List Tag) (t : Tag) (h : verdict tags t.id = some .withdrawn) :
    ¬ counts tags t := fun c => c.2.1 h

theorem assistant_needs_confirm (tags : List Tag) (t : Tag) (ha : t.creator = .assistant) (c : counts tags t) :
    verdict tags t.id = some .confirmed := by
  rcases c.2.2 with hp | hv
  · rw [ha] at hp; cases hp
  · exact hv

/-- A plain tag added at the end leaves every verdict as it was. -/
theorem plain_keeps_verdict (tags : List Tag) (new : Tag) (hn : new.body = .plain) (i : Nat) :
    verdict (tags ++ [new]) i = verdict tags i := by
  induction tags with
  | nil =>
    simp only [List.nil_append, verdict]
    cases new.creator <;> simp [hn]
  | cons t rest ih =>
    simp only [List.cons_append, verdict, ih]

/-- So adding a plain tag never changes whether an earlier tag counts. -/
theorem plain_keeps_counts (tags : List Tag) (new t : Tag) (hn : new.body = .plain) :
    counts (tags ++ [new]) t ↔ counts tags t := by
  simp only [counts, plain_keeps_verdict tags new hn]

structure Quote where
  self : Bool
  claims : List Nat

/-- The person's own quotes that say a claim (`claimView`, mine). -/
def mine (qs : List Quote) (c : Nat) : List Quote := qs.filter (fun q => q.self && q.claims.contains c)

theorem mine_only_self (qs : List Quote) (c : Nat) (q : Quote) (h : q ∈ mine qs c) : q.self = true := by
  simp only [mine, List.mem_filter, Bool.and_eq_true] at h
  exact h.2.1

end Reflect.Quotes
