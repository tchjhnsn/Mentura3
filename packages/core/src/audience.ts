// Who sees a record on the shared side (doc "Private and shared Reflect plan", step 3): every record Village and polis
// shows has an audience, from only the owner to everyone. The audiences widen in order: only me, people I invite,
// people I've met, everyone. A viewer's relation to the owner is the closest one they have, and a viewer sees a record
// when their relation is inside its audience. Kept on `life_record.audience` (migration 0063); a record with none
// takes its kind's default, which keeps what each kind showed before audiences. Pure data: no I/O.
//
// Profile sections keep their own three audiences (`./profile.ts`: everyone, met, me), a subset of these.

export const RECORD_AUDIENCES = [
  { id: "me", label: "Only me" },
  { id: "invited", label: "People I invite" },
  { id: "met", label: "People I've met" },
  { id: "everyone", label: "Everyone" },
] as const;
export type RecordAudience = (typeof RECORD_AUDIENCES)[number]["id"];
export const isRecordAudience = (v: unknown): v is RecordAudience => RECORD_AUDIENCES.some((a) => a.id === v);

/**
 * How a viewer stands to a record's owner, closest first: the owner, someone the owner invited to this record (for an
 * adventure, someone on it), someone they have met (connected, or checked in to the same event), anyone signed in, or
 * anyone at all.
 */
export type ViewerRelation = "owner" | "invited" | "met" | "signed-in" | "anyone";

const WIDTH: Record<RecordAudience, number> = { me: 0, invited: 1, met: 2, everyone: 3 };
const NEED: Record<ViewerRelation, number> = { owner: 0, invited: 1, met: 2, "signed-in": 3, anyone: 3 };

/** Whether a viewer with this relation to the owner sees a record set to this audience. The owner sees everything. */
export function canSee(audience: RecordAudience, viewer: ViewerRelation): boolean {
  return NEED[viewer] <= WIDTH[audience];
}

/**
 * The audience a kind of record takes when it has none of its own: what it showed before audiences. An adventure is
 * seen by its owner and the people already on it; every other kind only by its owner.
 */
export const DEFAULT_AUDIENCE: Readonly<Record<string, RecordAudience>> = { adventure: "invited" };

/** A record's audience: its own when it is one, else its kind's default, else only the owner. */
export function audienceOf(kind: string, own: unknown): RecordAudience {
  if (isRecordAudience(own)) return own;
  return (Object.prototype.hasOwnProperty.call(DEFAULT_AUDIENCE, kind) && DEFAULT_AUDIENCE[kind]) || "me";
}
