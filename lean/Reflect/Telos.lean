import Reflect.Ends

/-
  Every chosen means reaches a stated telos.

  Aristotle: choice is of the things that are toward the end, not of the end itself (Nicomachean Ethics III.2,
  1111b26; III.3, 1112b11-12, "we deliberate not about ends but about what is toward ends"). So each node of a
  person's plan is a choice, an intent or a telos, and serves links run from means to ends. The checker
  `Purposes.check` asks two things over the finite list of nodes:

  * the serves links pass `Ends.check` (no cycle, every chain finite);
  * from every choice, a bounded walk of one or more serves links finds a node whose kind is telos.

  When it passes and the list holds every node, every choice reaches a stated telos through one or more serves
  links (`choice_reaches_telos`), and no chain of ends goes on without limit (`no_endless_chain`).

  Core Lean only, no Mathlib.
-/

namespace Reflect.Telos

open Reflect.Ends

/-- [D] What a node of a plan is. -/
inductive Kind
  | choice
  | intent
  | telos
  deriving DecidableEq, Repr

/-- [D] A plan: its nodes, the kind of each and the ends each serves. -/
structure Purposes (α : Type) where
  all    : List α
  kind   : α → Kind
  serves : α → List α

variable {α : Type}

/-- [D] Within `n` more links from `a`, a telos is found (`a` itself counts). -/
def findsTelos (p : Purposes α) : Nat → α → Bool
  | 0, a => decide (p.kind a = .telos)
  | n + 1, a => decide (p.kind a = .telos) || (p.serves a).any (findsTelos p n)

/-- [D] The checker. -/
def Purposes.check (p : Purposes α) : Bool :=
  Ends.check p.serves p.all &&
  p.all.all fun a => !decide (p.kind a = .choice) || (p.serves a).any (findsTelos p p.all.length)

variable {p : Purposes α}

/-- A node that finds a telos reaches one in zero or more serves links. -/
theorem findsTelos_sound : ∀ (n : Nat) (a : α), findsTelos p n a = true →
    ∃ t, p.kind t = .telos ∧ (t = a ∨ Chain p.serves a t)
  | 0, a, h => by
    simp only [findsTelos, decide_eq_true_eq] at h
    exact ⟨a, h, .inl rfl⟩
  | n + 1, a, h => by
    simp only [findsTelos, Bool.or_eq_true, decide_eq_true_eq, List.any_eq_true] at h
    cases h with
    | inl ht => exact ⟨a, ht, .inl rfl⟩
    | inr hb =>
      obtain ⟨b, hb, hf⟩ := hb
      obtain ⟨t, ht, hr⟩ := findsTelos_sound n b hf
      refine ⟨t, ht, .inr ?_⟩
      cases hr with
      | inl e => exact e ▸ .one hb
      | inr c => exact .more hb c

/-- Every choice reaches a stated telos through one or more serves links. -/
theorem choice_reaches_telos (hc : p.check = true) {a : α} (ha : a ∈ p.all) (hk : p.kind a = .choice) :
    ∃ t, p.kind t = .telos ∧ Chain p.serves a t := by
  unfold Purposes.check at hc
  simp only [Bool.and_eq_true, List.all_eq_true] at hc
  have h := hc.2 a ha
  simp only [hk, decide_true, Bool.not_true, Bool.false_or, List.any_eq_true] at h
  obtain ⟨b, hb, hf⟩ := h
  obtain ⟨t, ht, hr⟩ := findsTelos_sound _ b hf
  refine ⟨t, ht, ?_⟩
  cases hr with
  | inl e => exact e ▸ .one hb
  | inr c => exact .more hb c

/-- And the ends a plan's links lead to cannot go on without limit. -/
theorem no_endless_chain (hc : p.check = true) (complete : ∀ a, a ∈ p.all) :
    ¬ ∃ f : Nat → α, ∀ i, f (i + 1) ∈ p.serves (f i) := by
  unfold Purposes.check at hc
  simp only [Bool.and_eq_true] at hc
  exact no_endless_chain_of_check complete hc.1

/-- A worked case: choosing a lathe (0) serves the intent to build a table (1), which serves the telos of a
    well-kept home (2). The check passes. -/
def lathe : Purposes Nat where
  all := [0, 1, 2]
  kind := fun n => if n = 0 then .choice else if n = 1 then .intent else .telos
  serves := fun n => if n = 0 then [1] else if n = 1 then [2] else []

example : lathe.check = true := by decide

/-- A choice that serves an intent with no telos above it fails the check. -/
example : ({ lathe with kind := fun n => if n = 0 then .choice else .intent } : Purposes Nat).check = false := by
  decide

end Reflect.Telos
