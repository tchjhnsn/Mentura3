import { describe, expect, it } from "vitest";
import { askedLine, metLine, rankBuilders, whyShown, type BuildCandidate } from "./build";

const person = (id: string, interests: string[], via: BuildCandidate["via"], met: BuildCandidate["met"] = null): BuildCandidate => ({ id, name: id, image: null, interests, via, met });
const night = { event: "Founders Night", startsAt: "2026-11-21T00:30:00Z" };

describe("people to build with", () => {
  it("ranks by shared interests, then connections before people from events, then name, never the person", () => {
    const list = [
      person("Ann", ["design"], "event", night),
      person("Bo", ["design"], "connection"),
      person("Cy", ["design", "food", "music"], "event"),
      person("me", ["design", "food"], "connection"),
      person("Di", [], "connection"),
      person("Ed", ["food", "design"], "event"),
    ];
    const ranked = rankBuilders("me", ["design", "food"], list);
    expect(ranked.map((p) => p.id)).toEqual(["Cy", "Ed", "Bo", "Ann", "Di"]);
    expect(ranked[0]!.shared).toEqual(["design", "food"]);
    expect(ranked[1]!.shared).toEqual(["design", "food"]);
  });

  it("shows a person once: the connection wins and keeps the event they were both at", () => {
    const ranked = rankBuilders("me", [], [person("Ann", [], "event", night), person("Ann", [], "connection")]);
    expect(ranked).toHaveLength(1);
    expect(ranked[0]).toMatchObject({ via: "connection", met: night, why: "One of your connections" });
  });

  it("carries where the person stands with each one", () => {
    const ranked = rankBuilders("me", [], [person("Ann", [], "connection"), person("Bo", [], "event")], new Map([["Ann", "yes" as const]]));
    expect(ranked.map((p) => p.status)).toEqual(["yes", "none"]);
  });

  it("says why someone is shown and where they met, in words", () => {
    expect(whyShown("event", 1)).toBe("Shares one of your interests");
    expect(whyShown("connection", 3)).toBe("Shares 3 of your interests");
    expect(whyShown("event", 0)).toBe("Was at an event you went to");
    expect(metLine(night)).toBe("Met at Founders Night, Fri, Nov 20");
    expect(metLine({ event: "Demo Day", startsAt: null })).toBe("Met at Demo Day");
    expect(askedLine("Rosa's Prints", "Ann")).toBe("Asked to build Rosa's Prints with Ann");
  });
});
