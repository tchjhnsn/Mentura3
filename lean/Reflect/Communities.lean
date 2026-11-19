/-
  The communities nest: person, union, household, village, polis.

  Aristotle, Politics I.2 (1252a24-1253a1): the first union is of those who cannot exist without each other; from
  unions comes the household, from households the village, and from villages the polis, which is complete. Each
  community is part of the next (`Next`), and "part of" (`PartOf`) is one or more of those steps.

  Proved: `PartOf` is irreflexive, transitive and asymmetric, and any two communities are equal or one is part of
  the other, so it is a strict total order. It agrees with the order of rank (`partOf_iff_rank`), and the polis is
  part of nothing, while every other community is part of the polis.

  Core Lean only, no Mathlib.
-/

namespace Reflect

/-- [D] The communities of Politics I.2, smallest first. -/
inductive Community
  | person
  | union
  | household
  | village
  | polis
  deriving DecidableEq, Repr

namespace Community

/-- [D] The position of a community in Aristotle's order. -/
def rank : Community → Nat
  | person => 0
  | union => 1
  | household => 2
  | village => 3
  | polis => 4

/-- [D] `a` is directly part of `b`: the next community up. -/
inductive Next : Community → Community → Prop
  | personUnion : Next person union
  | unionHousehold : Next union household
  | householdVillage : Next household village
  | villagePolis : Next village polis

/-- [D] `a` is part of `b` through one or more steps. -/
inductive PartOf : Community → Community → Prop
  | next {a b : Community} : Next a b → PartOf a b
  | trans {a b c : Community} : Next a b → PartOf b c → PartOf a c

theorem rank_injective {a b : Community} (h : a.rank = b.rank) : a = b := by
  cases a <;> cases b <;> first | rfl | (simp [rank] at h)

theorem next_rank {a b : Community} (h : Next a b) : b.rank = a.rank + 1 := by
  cases h <;> rfl

theorem rank_lt_of_partOf {a b : Community} (h : PartOf a b) : a.rank < b.rank := by
  induction h with
  | next hn => rw [next_rank hn]; exact Nat.lt_succ_self _
  | trans hn _ ih => rw [next_rank hn] at ih; exact Nat.lt_of_succ_lt ih

theorem partOf_of_rank_lt {a b : Community} (h : a.rank < b.rank) : PartOf a b := by
  cases a <;> cases b <;> simp [rank] at h
  all_goals first
    | exact .next .personUnion
    | exact .next .unionHousehold
    | exact .next .householdVillage
    | exact .next .villagePolis
    | exact .trans .personUnion (.next .unionHousehold)
    | exact .trans .unionHousehold (.next .householdVillage)
    | exact .trans .householdVillage (.next .villagePolis)
    | exact .trans .personUnion (.trans .unionHousehold (.next .householdVillage))
    | exact .trans .unionHousehold (.trans .householdVillage (.next .villagePolis))
    | exact .trans .personUnion (.trans .unionHousehold (.trans .householdVillage (.next .villagePolis)))

/-- "Part of" is the order of rank. -/
theorem partOf_iff_rank {a b : Community} : PartOf a b ↔ a.rank < b.rank :=
  ⟨rank_lt_of_partOf, partOf_of_rank_lt⟩

/-- Nothing is part of itself. -/
theorem partOf_irrefl (a : Community) : ¬ PartOf a a :=
  fun h => Nat.lt_irrefl _ (rank_lt_of_partOf h)

/-- A part of a part is a part. -/
theorem partOf_trans {a b c : Community} (h₁ : PartOf a b) (h₂ : PartOf b c) : PartOf a c :=
  partOf_of_rank_lt (Nat.lt_trans (rank_lt_of_partOf h₁) (rank_lt_of_partOf h₂))

/-- If `a` is part of `b`, `b` is not part of `a`. -/
theorem partOf_asymm {a b : Community} (h : PartOf a b) : ¬ PartOf b a :=
  fun h' => partOf_irrefl a (partOf_trans h h')

/-- Any two communities are the same, or one is part of the other. -/
theorem partOf_total (a b : Community) : a = b ∨ PartOf a b ∨ PartOf b a := by
  rcases Nat.lt_trichotomy a.rank b.rank with h | h | h
  · exact .inr (.inl (partOf_of_rank_lt h))
  · exact .inl (rank_injective h)
  · exact .inr (.inr (partOf_of_rank_lt h))

/-- The polis is complete: it is part of no larger community (Politics I.2, 1252b28). -/
theorem polis_complete (a : Community) : ¬ PartOf polis a :=
  fun h => by have := rank_lt_of_partOf h; cases a <;> simp [rank] at this

/-- Every other community is part of the polis. -/
theorem partOf_polis {a : Community} (h : a ≠ polis) : PartOf a polis := by
  apply partOf_of_rank_lt
  cases a <;> simp [rank] at h ⊢

end Community

end Reflect
