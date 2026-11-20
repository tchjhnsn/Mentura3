/-!
# Works by their end

Torian, 2026-11-20: the personal site reads the person's works from Reflect, sorted by Making, Knowing and Doing.
Each work is sorted by its end (Nicomachean Ethics VI.4; Metaphysics VI.1): making has a product as its end, knowing
truth, doing the action itself. Mirrored from `packages/core/src/works-by-end.ts` (a test there checks the
constructors below match it):

* each section belongs to exactly one end (`SECTIONS`);
* a work's disclosure is public, foreshadow or private (`DISCLOSURES`);
* what goes out (`shownWork`): a public work in full, a foreshadowed one as its end, section and one line, with no
  title, and a private one never.

Proved here: a private work never goes out, a foreshadowed one never carries its title, and what goes out keeps the
work's end and section.
-/

namespace Reflect.Works

inductive End where
  | making
  | knowing
  | doing
  deriving DecidableEq, Repr

inductive Section where
  | projects | products | writing | art | crafts
  | research | study | reading
  | service | care | civic | talks | events
  deriving DecidableEq, Repr

/-- The end a section belongs to (`SECTIONS`). -/
def Section.endOf : Section → End
  | .projects | .products | .writing | .art | .crafts => .making
  | .research | .study | .reading => .knowing
  | .service | .care | .civic | .talks | .events => .doing

/-- `pub` is public and `priv` private (both words are Lean keywords). -/
inductive Disclosure where
  | pub
  | foreshadow
  | priv
  deriving DecidableEq, Repr

/-- A work as the vault keeps it, at `<end>/<id>.json`; its section is one of its end's. -/
structure Work where
  title : String
  sec : Section
  disclosure : Disclosure
  line : String

/-- One entry of published/works.json. -/
inductive Shown where
  | full (title : String) (e : End) (s : Section)
  | hint (e : End) (s : Section) (line : String)
  deriving DecidableEq, Repr

/-- What a work shows on the site (`shownWork`). -/
def shown (w : Work) : Option Shown :=
  match w.disclosure with
  | .pub => some (.full w.title w.sec.endOf w.sec)
  | .foreshadow => some (.hint w.sec.endOf w.sec w.line)
  | .priv => none

/-- The title an entry carries, if any. -/
def Shown.title? : Shown → Option String
  | .full t _ _ => some t
  | .hint _ _ _ => none

def Shown.endOf : Shown → End
  | .full _ e _ => e
  | .hint e _ _ => e

def Shown.sec : Shown → Section
  | .full _ _ s => s
  | .hint _ s _ => s

/-- A private work never goes out. -/
theorem private_never_shown (w : Work) (h : w.disclosure = .priv) : shown w = none := by
  simp [shown, h]

/-- Whatever goes out of a foreshadowed work carries no title. -/
theorem foreshadow_has_no_title (w : Work) (h : w.disclosure = .foreshadow) :
    ∀ x, shown w = some x → x.title? = none := by
  intro x hx
  simp [shown, h] at hx
  subst hx
  rfl

/-- Only a public work goes out with its title. -/
theorem title_only_if_public (w : Work) (x : Shown) (hx : shown w = some x) (t : String) (ht : x.title? = some t) :
    w.disclosure = .pub := by
  cases hd : w.disclosure <;> simp [shown, hd] at hx <;> subst hx <;> simp [Shown.title?] at ht ⊢

/-- What goes out keeps the work's section, and the end that section belongs to. -/
theorem shown_keeps_end (w : Work) (x : Shown) (hx : shown w = some x) :
    x.sec = w.sec ∧ x.endOf = w.sec.endOf := by
  cases hd : w.disclosure <;> simp [shown, hd] at hx <;> subst hx <;> exact ⟨rfl, rfl⟩

/-- Research is knowing, and writing and projects are making (Torian's rulings, 2026-11-20). -/
example : Section.research.endOf = .knowing ∧ Section.writing.endOf = .making ∧ Section.projects.endOf = .making :=
  ⟨rfl, rfl, rfl⟩

end Reflect.Works
