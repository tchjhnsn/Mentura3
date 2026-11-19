/-
  A hierarchy of nouns under top categories, and the checker whose success gives each noun exactly one category.

  Each noun has broader links to other nouns and to top categories (SKOS broader, as in
  packages/core/src/terms/ontology.json). The checker `Hierarchy.Certified` is a Boolean over a finite list of nouns,
  a rank and a category assignment, all written by the generator. It asks, for every noun:

  * it has something broader (U3, no orphan);
  * every broader noun has a lower rank (so U1, no cycle, follows);
  * every broader noun has the same category, and every broader top category is that category (so U4 follows).

  The rank and the category are a certificate: the generator computes them, and the kernel checks them. A wrong
  certificate makes the check fail; it cannot make a false theorem. When the check passes and the list holds every
  noun, no noun is above itself (`no_cycle`) and every noun reaches exactly one top category (`one_top`).

  Core Lean only, no Mathlib.
-/

namespace Reflect

/-- [D] Broader links: each noun's broader nouns and broader top categories. -/
structure Hierarchy (C N : Type) where
  nouns : N → List N
  tops  : N → List C

namespace Hierarchy

variable {C N : Type} (h : Hierarchy C N)

/-- [D] Noun `n` is below noun `k` through one or more broader links. -/
inductive Above : N → N → Prop
  | one {n m : N} : m ∈ h.nouns n → Above n m
  | more {n m k : N} : m ∈ h.nouns n → Above m k → Above n k

/-- [D] Noun `n` reaches top category `c` through zero or more broader nouns and then one link to `c`. -/
inductive ReachesTop : N → C → Prop
  | top {n : N} {c : C} : c ∈ h.tops n → ReachesTop n c
  | up {n m : N} {c : C} : m ∈ h.nouns n → ReachesTop m c → ReachesTop n c

/-- [D] The checker. `all` lists the nouns, `rank` and `cat` are the certificate. -/
def Certified [DecidableEq C] (all : List N) (rank : N → Nat) (cat : N → C) : Bool :=
  all.all fun n =>
    decide (0 < (h.nouns n).length + (h.tops n).length) &&
    (h.nouns n).all (fun m => decide (rank m < rank n) && decide (cat m = cat n)) &&
    (h.tops n).all (fun c => decide (c = cat n))

variable {h}

/-- What the checker says about one noun. -/
theorem certified_at [DecidableEq C] {all : List N} {rank : N → Nat} {cat : N → C}
    (hc : h.Certified all rank cat = true) {n : N} (hn : n ∈ all) :
    0 < (h.nouns n).length + (h.tops n).length ∧
    (∀ m, m ∈ h.nouns n → rank m < rank n ∧ cat m = cat n) ∧
    (∀ c, c ∈ h.tops n → c = cat n) := by
  unfold Certified at hc
  rw [List.all_eq_true] at hc
  have := hc n hn
  simp only [Bool.and_eq_true, List.all_eq_true, decide_eq_true_eq] at this
  exact ⟨this.1.1, this.1.2, this.2⟩

/-- Every noun above `n` has a lower rank than `n`. -/
theorem rank_lt_of_above [DecidableEq C] {all : List N} {rank : N → Nat} {cat : N → C}
    (hc : h.Certified all rank cat = true) (complete : ∀ n, n ∈ all) {n k : N} (r : h.Above n k) :
    rank k < rank n := by
  induction r with
  | one hm => exact ((certified_at hc (complete _)).2.1 _ hm).1
  | more hm _ ih => exact Nat.lt_trans ih ((certified_at hc (complete _)).2.1 _ hm).1

/-- U1: no noun is above itself. -/
theorem no_cycle [DecidableEq C] {all : List N} {rank : N → Nat} {cat : N → C}
    (hc : h.Certified all rank cat = true) (complete : ∀ n, n ∈ all) (n : N) : ¬ h.Above n n :=
  fun r => Nat.lt_irrefl _ (rank_lt_of_above hc complete r)

/-- U3 with the rank: every noun reaches some top category. -/
theorem reaches_top [DecidableEq C] {all : List N} {rank : N → Nat} {cat : N → C}
    (hc : h.Certified all rank cat = true) (complete : ∀ n, n ∈ all) (n : N) : ∃ c, h.ReachesTop n c := by
  have key : ∀ bound n, rank n < bound → ∃ c, h.ReachesTop n c := by
    intro bound
    induction bound with
    | zero => intro n hn; exact absurd hn (Nat.not_lt_zero _)
    | succ bound ih =>
      intro n hn
      have facts := certified_at hc (complete n)
      match hts : h.tops n, hns : h.nouns n with
      | c :: _, _ => exact ⟨c, .top (by rw [hts]; exact List.mem_cons_self)⟩
      | [], m :: _ =>
        have hm : m ∈ h.nouns n := by rw [hns]; exact List.mem_cons_self
        have hr := (facts.2.1 m hm).1
        obtain ⟨c, hc'⟩ := ih m (Nat.lt_of_lt_of_le hr (Nat.le_of_lt_succ hn))
        exact ⟨c, .up hm hc'⟩
      | [], [] =>
        have := facts.1
        rw [hts, hns] at this
        exact absurd this (Nat.lt_irrefl 0)
  exact key (rank n + 1) n (Nat.lt_succ_self _)

/-- U4 with the category: a top category a noun reaches is its category. -/
theorem reaches_top_eq [DecidableEq C] {all : List N} {rank : N → Nat} {cat : N → C}
    (hc : h.Certified all rank cat = true) (complete : ∀ n, n ∈ all) {n : N} {c : C}
    (r : h.ReachesTop n c) : c = cat n := by
  induction r with
  | top hc' => exact (certified_at hc (complete _)).2.2 _ hc'
  | up hm _ ih => rw [ih]; exact ((certified_at hc (complete _)).2.1 _ hm).2

/-- Every noun reaches exactly one top category, and it is `cat n`. -/
theorem one_top [DecidableEq C] {all : List N} {rank : N → Nat} {cat : N → C}
    (hc : h.Certified all rank cat = true) (complete : ∀ n, n ∈ all) (n : N) :
    h.ReachesTop n (cat n) ∧ ∀ c, h.ReachesTop n c → c = cat n := by
  obtain ⟨c, r⟩ := reaches_top hc complete n
  have e := reaches_top_eq hc complete r
  exact ⟨e ▸ r, fun _ r' => reaches_top_eq hc complete r'⟩

end Hierarchy

end Reflect
