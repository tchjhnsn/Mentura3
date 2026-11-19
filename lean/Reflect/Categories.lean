import Reflect.Hierarchy
import Reflect.Generated.Ontology

/-
  Every noun of Reflect's ontology has exactly one of Aristotle's ten Categories.

  The data is Reflect/Generated/Ontology.lean, generated from packages/core/src/terms/ontology.json. Its theorem
  `certified` checks the generated rank and category by `decide`; Reflect/Hierarchy.lean turns that into the two
  theorems below. They mirror rules U1 and U4 of `checkOntology` in packages/core/src/terms/ontology.ts.

  Core Lean only, no Mathlib.
-/

namespace Reflect.Ontology

/-- U1: no noun is broader than itself through a chain of broader links. -/
theorem broader_no_cycle (n : Noun) : ¬ hierarchy.Above n n :=
  Hierarchy.no_cycle certified Noun.mem_all n

/-- U3 and U4: every noun reaches exactly one top category, `n.category`. -/
theorem noun_one_category (n : Noun) :
    hierarchy.ReachesTop n n.category ∧ ∀ c, hierarchy.ReachesTop n c → c = n.category :=
  Hierarchy.one_top certified Noun.mem_all n

/-- Some readings, as in packages/core/src/terms/ontology.test.ts. -/
example : Noun.category .«friend» = .«substance» := rfl
example : Noun.category .«work» = .«doing» := rfl
example : Noun.category .«need» = .«having» := rfl
example : Noun.category .«end» = .«relation» := rfl
example : Noun.category .«choice» = .«doing» := rfl

end Reflect.Ontology
