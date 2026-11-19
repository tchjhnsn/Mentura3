import { describe, expect, it } from "vitest";
import { audienceOf, canSee, isRecordAudience, RECORD_AUDIENCES, type RecordAudience, type ViewerRelation } from "./audience";
import { AUDIENCES } from "./profile";

const VIEWERS: ViewerRelation[] = ["owner", "invited", "met", "signed-in", "anyone"];

describe("record audiences", () => {
  it("lets each audience reach exactly its viewers", () => {
    const sees = (a: RecordAudience) => VIEWERS.filter((v) => canSee(a, v));
    expect(sees("me")).toEqual(["owner"]);
    expect(sees("invited")).toEqual(["owner", "invited"]);
    expect(sees("met")).toEqual(["owner", "invited", "met"]);
    expect(sees("everyone")).toEqual(VIEWERS);
  });

  it("widens in order: a viewer who sees one audience sees every wider one", () => {
    for (const v of VIEWERS) {
      const seen = RECORD_AUDIENCES.map((a) => canSee(a.id, v));
      expect(seen.indexOf(true) === -1 || seen.slice(seen.indexOf(true)).every(Boolean), v).toBe(true);
    }
  });

  it("keeps today's behavior by default: an adventure for its owner and the people on it, the rest for the owner", () => {
    expect(audienceOf("adventure", undefined)).toBe("invited");
    expect(audienceOf("adventure", null)).toBe("invited");
    expect(audienceOf("adventure", "nobody")).toBe("invited");
    expect(audienceOf("adventure", "everyone")).toBe("everyone");
    expect(audienceOf("goal", undefined)).toBe("me");
    expect(audienceOf("toString", undefined)).toBe("me");
    expect(canSee(audienceOf("adventure", null), "met")).toBe(false);
  });

  it("holds the profile's audiences among its own", () => {
    for (const a of AUDIENCES) expect(isRecordAudience(a.id), a.id).toBe(true);
    expect(isRecordAudience("friends")).toBe(false);
  });
});
