import { describe, expect, it } from "vitest";
import { BACKGROUND, backgroundFor, topicOfRecording } from "./background-music";
import { audioOf } from "./media";
import { topicPageById, workById } from "./topic-pages";

describe("background music", () => {
  it("is free recordings Reflect plays itself, each credited and explained, for topics that exist", () => {
    for (const [topic, items] of Object.entries(BACKGROUND)) {
      expect(topicPageById(topic), topic).toBeDefined();
      for (const i of items) {
        expect(i.kind === "find" && audioOf(i.url), `${topic} ${i.title}`).toBeTruthy();
        expect(i.kind === "find" && i.credit, `${topic} ${i.title}`).toBeTruthy();
        expect(i.why, `${topic} ${i.title}`).toBeTruthy();
      }
    }
  });

  it("follows a book to its era through its work page or its topic", () => {
    expect(topicOfRecording(workById("republic")!.audiobooks[0]!)).toBe("greeks");
    expect(topicOfRecording("4732")).toBe("romans");
    expect(topicOfRecording("nothing")).toBeNull();
    expect(backgroundFor("nothing")).toBeNull();
  });
});
