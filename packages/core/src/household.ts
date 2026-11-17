// The household (doc "Tiles and their connections", Settings, account and household). Terms are the Census Bureau's:
// a household is everyone living in one housing unit; a family household has at least one relative of the
// householder; a nonfamily household is a person living alone or only with non-relatives. "Dependent" is the IRS's
// term and only marks a member for taxes. How a person lives (alone, with family, with roommates) is not asked: it
// follows from who is in the household. Every part is fetchable by path (`householdPart`).

/** Relationship to the householder, after the Census's categories, shortened. */
export const RELATIONS = [
  { id: "self", label: "Householder", family: true },
  { id: "spouse", label: "Spouse", family: true },
  { id: "partner", label: "Unmarried partner", family: false },
  { id: "child", label: "Son or daughter", family: true },
  { id: "parent", label: "Father or mother", family: true },
  { id: "sibling", label: "Brother or sister", family: true },
  { id: "grandchild", label: "Grandchild", family: true },
  { id: "relative", label: "Other relative", family: true },
  { id: "foster", label: "Foster child", family: false },
  { id: "roommate", label: "Roommate or housemate", family: false },
  { id: "other", label: "Other non-relative", family: false },
] as const;
export type Relation = (typeof RELATIONS)[number]["id"];
export const isRelation = (s: unknown): s is Relation => RELATIONS.some((r) => r.id === s);
export const relationLabel = (id: string) => RELATIONS.find((r) => r.id === id)?.label ?? "Member";

/** What is kept about a member, sealed with the household's key. */
export type MemberBody = { name: string; relation: Relation; born?: number; dependent?: boolean };

export type Member = MemberBody & {
  id: string;
  /** Has their own Reflect account. */
  account: boolean;
  /** This is the person reading. */
  you: boolean;
  /** Kept by another member because they have no login. */
  keptBy: string | null;
  role: "admin" | "member";
};

export type Household = { id: string; members: Member[] };

export type Arrangement = "alone" | "family" | "nonfamily";
export const ARRANGEMENT_LABEL: Record<Arrangement, string> = { alone: "Lives alone", family: "Family household", nonfamily: "Nonfamily household" };

/** Cleans a member's facts from what was sent, or throws. */
export function cleanMember(raw: Record<string, unknown>, thisYear: number): MemberBody {
  const name = typeof raw.name === "string" ? raw.name.trim().slice(0, 80) : "";
  if (!name) throw new Error("Give their name.");
  const relation = isRelation(raw.relation) ? raw.relation : "other";
  const out: MemberBody = { name, relation };
  const born = typeof raw.born === "number" ? raw.born : typeof raw.born === "string" && raw.born.trim() ? Number(raw.born) : NaN;
  if (Number.isInteger(born) && born >= 1900 && born <= thisYear) out.born = born;
  if (raw.dependent === true || raw.dependent === "on" || raw.dependent === "true") out.dependent = true;
  return out;
}

/** Age this year, when the birth year is known. */
export const ageOf = (m: Pick<MemberBody, "born">, thisYear: number) => (m.born ? thisYear - m.born : null);

/** Adults (18 and over, or age unknown) and children in the household. */
export function counts(members: readonly Pick<MemberBody, "born" | "relation">[], thisYear: number): { adults: number; children: number } {
  let adults = 0, children = 0;
  for (const m of members) {
    const age = ageOf(m, thisYear);
    if (age !== null ? age < 18 : m.relation === "child" || m.relation === "grandchild" || m.relation === "foster") children++;
    else adults++;
  }
  return { adults, children };
}

/** Alone, a family household, or a nonfamily household, from who lives there (Census). */
export function arrangement(members: readonly Pick<MemberBody, "relation">[]): Arrangement {
  const others = members.filter((m) => m.relation !== "self");
  if (!others.length) return "alone";
  return others.some((m) => RELATIONS.find((r) => r.id === m.relation)?.family) ? "family" : "nonfamily";
}

export const HOUSEHOLD_PATHS = "'' (the household in brief), 'members', 'members/<member id>', 'arrangement', 'counts'";

/** One part of the household by path, or null. */
export function householdPart(h: Household | null, path: string, thisYear: number): unknown {
  const parts = path.split("/").filter(Boolean);
  if (!h) return parts.length ? null : { members: [], arrangement: null, note: "No household is set up yet." };
  const view = (m: Member) => ({ id: m.id, name: m.name, relation: relationLabel(m.relation), age: ageOf(m, thisYear), dependent: Boolean(m.dependent), account: m.account, you: m.you });
  const [head, key, ...rest] = parts;
  if (rest.length) return null;
  if (!head) return { members: h.members.map(view), arrangement: ARRANGEMENT_LABEL[arrangement(h.members)], ...counts(h.members, thisYear) };
  if (head === "members") return key ? (h.members.find((m) => m.id === key) ? view(h.members.find((m) => m.id === key)!) : null) : h.members.map(view);
  if (key) return null;
  if (head === "arrangement") return ARRANGEMENT_LABEL[arrangement(h.members)];
  if (head === "counts") return counts(h.members, thisYear);
  return null;
}
