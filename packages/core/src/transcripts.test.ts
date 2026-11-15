import { describe, expect, it } from "vitest";
import { findInTranscripts } from "./transcripts";

describe("searching episode transcripts", () => {
  it("finds a phrase across transcripts", () => {
    const hits = findInTranscripts([{ of: "a", passages: [{ at: 3, heading: false, who: "Speaker 1", text: "On virtue and habit." }] }, { of: "b", passages: [{ at: null, heading: false, who: null, text: "No match." }] }], "Habit");
    expect(hits).toEqual([{ of: "a", at: 3, who: "Speaker 1", text: "On virtue and habit." }]);
    expect(findInTranscripts([], "a")).toEqual([]);
  });
});
