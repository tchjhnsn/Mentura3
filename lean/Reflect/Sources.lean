/-!
# Sources of a value

Torian, 2026-11-20: journal entries, AI conversations and other places are where a field gets its data from. They are
sources of field values, not nouns in the life ontology. Every value names one source kind, mirrored from
`SOURCE_KINDS` in `packages/core/src/value-source.ts` (a test there checks the constructors below match it):

* `stated`: the person typed it into the field;
* `journal`: a journal entry;
* `conversation`: a conversation with an AI;
* `import`: a connector or an uploaded file;
* `noticed`: Reflect proposed it from the person's own records.

A value starts confirmed only when it was stated. Every other kind starts proposed, and only the person's
confirmation makes it confirmed. Confirming never changes the source kind.
-/

namespace Reflect.Sources

/-- Where a field's value came from. -/
inductive SourceKind where
  | stated
  | journal
  | conversation
  | «import»
  | noticed
  deriving DecidableEq, Repr

/-- Whether the person has accepted a value. -/
inductive Status where
  | proposed
  | confirmed
  deriving DecidableEq, Repr

/-- The status a value starts with (`startStatus` in value-source.ts). -/
def startStatus : SourceKind → Status
  | .stated => .confirmed
  | _ => .proposed

/-- A value's source with its status. -/
structure Sourced where
  kind : SourceKind
  status : Status
  deriving DecidableEq, Repr

/-- A value as Reflect first records it. -/
def Sourced.new (k : SourceKind) : Sourced := ⟨k, startStatus k⟩

/-- The person confirms a value (`confirmSource`). -/
def Sourced.confirm (s : Sourced) : Sourced := { s with status := .confirmed }

/-- Every source kind other than stated starts proposed. -/
theorem not_stated_starts_proposed (k : SourceKind) (h : k ≠ .stated) : startStatus k = .proposed := by
  cases k <;> simp_all [startStatus]

/-- Only a stated value starts confirmed. -/
theorem starts_confirmed_iff_stated (k : SourceKind) : startStatus k = .confirmed ↔ k = .stated := by
  cases k <;> simp [startStatus]

/-- Confirming keeps the source kind. -/
theorem confirm_keeps_kind (s : Sourced) : s.confirm.kind = s.kind := rfl

/-- A value from any source but stated is confirmed only after the person confirms it. -/
theorem new_confirmed_only_if_stated (k : SourceKind) : (Sourced.new k).status = .confirmed → k = .stated :=
  (starts_confirmed_iff_stated k).mp

end Reflect.Sources
