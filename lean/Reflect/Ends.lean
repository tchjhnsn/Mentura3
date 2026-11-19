/-
  Serves links between intents and ends form no cycle, and every chain of ends is finite.

  Aristotle, Nicomachean Ethics I.2 (1094a18-22): if we chose everything for the sake of something else, the
  process would go on without limit, so that our desire would be empty and vain. Here that is a property of a
  finite graph. Each node (an intent or an end) lists the ends it serves (`serves a`). The checker `check` runs a
  bounded walk from every node; `bounded n a` holds when every chain of serves links from `a` has fewer than `n`
  links. No graph data is assumed beyond the list of nodes.

  When the check passes and the list holds every node:

  * the relation "b is an end that a serves" is well-founded (`wellFounded_of_check`);
  * no infinite chain a0, a1, a2, ... with each a(i+1) an end of a(i) exists (`no_endless_chain_of_check`);
  * no node serves itself through a chain of serves links (`no_cycle_of_check`);
  * every node reaches an end that serves nothing further, a final end (`final_end_of_check`, I.2 1094a18:
    "some end of the things we do, which we desire for its own sake").

  Core Lean only, no Mathlib.
-/

namespace Reflect.Ends

variable {α : Type}

/-- [D] `b` is an end that `a` serves. The order of arguments suits `Acc`: `Acc (EndOf serves) a` walks from
    `a` to its ends. -/
def EndOf (serves : α → List α) (b a : α) : Prop := b ∈ serves a

/-- [D] A chain of one or more serves links from `a` to `b`. -/
inductive Chain (serves : α → List α) : α → α → Prop
  | one {a b : α} : b ∈ serves a → Chain serves a b
  | more {a b c : α} : b ∈ serves a → Chain serves b c → Chain serves a c

/-- [D] Every chain of serves links from `a` has fewer than `n` links. -/
def bounded (serves : α → List α) : Nat → α → Bool
  | 0, _ => false
  | n + 1, a => (serves a).all (bounded serves n)

/-- [D] The checker: from every listed node, every chain has at most as many links as there are nodes. On a
    finite graph that is the same as having no cycle, since a chain with more links repeats a node. -/
def check (serves : α → List α) (all : List α) : Bool :=
  all.all (bounded serves (all.length + 1))

variable {serves : α → List α}

/-- A bounded node is accessible: its ends, their ends and so on cannot go on without limit. -/
theorem acc_of_bounded : ∀ (n : Nat) (a : α), bounded serves n a = true → Acc (EndOf serves) a
  | 0, a, h => by simp [bounded] at h
  | n + 1, a, h => by
    refine Acc.intro a fun b hb => acc_of_bounded n b ?_
    simp only [bounded, List.all_eq_true] at h
    exact h b hb

theorem acc_of_check {all : List α} (hc : check serves all = true) {a : α} (ha : a ∈ all) :
    Acc (EndOf serves) a := by
  unfold check at hc
  rw [List.all_eq_true] at hc
  exact acc_of_bounded _ a (hc a ha)

/-- The check gives a well-founded order of ends. -/
theorem wellFounded_of_check {all : List α} (complete : ∀ a, a ∈ all) (hc : check serves all = true) :
    WellFounded (EndOf serves) :=
  ⟨fun a => acc_of_check hc (complete a)⟩

/-- From an accessible node no endless chain starts. -/
theorem no_endless_chain_of_acc {R : α → α → Prop} {a : α} (h : Acc R a) :
    ∀ f : Nat → α, f 0 = a → ¬ ∀ i, R (f (i + 1)) (f i) := by
  induction h with
  | intro x _ ih =>
    intro f h0 hf
    have h1 : R (f 1) x := by rw [← h0]; exact hf 0
    exact ih (f 1) h1 (fun i => f (i + 1)) rfl (fun i => hf (i + 1))

/-- Nicomachean Ethics I.2: the chain of ends cannot go on without limit. -/
theorem no_endless_chain_of_check {all : List α} (complete : ∀ a, a ∈ all) (hc : check serves all = true) :
    ¬ ∃ f : Nat → α, ∀ i, f (i + 1) ∈ serves (f i) :=
  fun ⟨f, hf⟩ => no_endless_chain_of_acc (acc_of_check hc (complete (f 0))) f rfl hf

/-- Accessibility along one link gives accessibility along chains. -/
theorem acc_chain {a : α} (h : Acc (EndOf serves) a) : Acc (fun y x => Chain serves x y) a := by
  induction h with
  | intro x _ ih =>
    refine Acc.intro x fun z hz => ?_
    cases hz with
    | one hb => exact ih z hb
    | more hb hc => exact (ih _ hb).inv hc

/-- An accessible node is not related to itself. -/
theorem not_self_of_acc {S : α → α → Prop} {a : α} (h : Acc S a) : ¬ S a a := by
  induction h with
  | intro x _ ih => exact fun hs => ih x hs hs

/-- No intent or end serves itself through a chain of serves links. -/
theorem no_cycle_of_check {all : List α} (complete : ∀ a, a ∈ all) (hc : check serves all = true) (a : α) :
    ¬ Chain serves a a :=
  not_self_of_acc (S := fun y x => Chain serves x y) (acc_chain (acc_of_check hc (complete a)))

/-- A bounded node reaches, in zero or more links, an end that serves nothing further. -/
theorem final_end_of_bounded : ∀ (n : Nat) (a : α), bounded serves n a = true →
    ∃ t, (t = a ∨ Chain serves a t) ∧ serves t = []
  | 0, a, h => by simp [bounded] at h
  | n + 1, a, h => by
    simp only [bounded, List.all_eq_true] at h
    match hs : serves a with
    | [] => exact ⟨a, .inl rfl, hs⟩
    | b :: _ =>
      have hb : b ∈ serves a := by rw [hs]; exact List.mem_cons_self
      obtain ⟨t, ht, hend⟩ := final_end_of_bounded n b (h b hb)
      refine ⟨t, .inr ?_, hend⟩
      cases ht with
      | inl e => exact e ▸ .one hb
      | inr c => exact .more hb c

/-- Every intent or end reaches a final end: one that is not for the sake of anything further. -/
theorem final_end_of_check {all : List α} (hc : check serves all = true) {a : α} (ha : a ∈ all) :
    ∃ t, (t = a ∨ Chain serves a t) ∧ serves t = [] := by
  unfold check at hc
  rw [List.all_eq_true] at hc
  exact final_end_of_bounded _ a (hc a ha)

/-- A worked case: building a table serves furnishing a home, which serves living well. The check passes. -/
example : check (fun n : Nat => if n = 0 then [1] else if n = 1 then [2] else []) [0, 1, 2] = true := by decide

/-- And a cycle fails it: 0 serves 1 and 1 serves 0. -/
example : check (fun n : Nat => if n = 0 then [1] else if n = 1 then [0] else []) [0, 1] = false := by decide

end Reflect.Ends
