import { describe, expect, it } from "vitest";
import { emptyPrep, type MeetingPrep } from "@reflect/core/meetings";
import { meetingPrepAction, prepInput, setMeetingPrepAction } from "@/server/actions/meeting-prep";
import { draftPrompt, mergeDraft, prepIsEmpty, readDraft } from "./draft";

const ids = () => { let n = 0; return () => `n${++n}`; };

describe("reading a drafted prep", () => {
  it("reads the JSON inside a reply and cleans dashes", () => {
    const d = readDraft('Here it is:\n{"keyPoints": ["We grow — fast", " "], "questions": [{"question": "Why now?", "answer": "Because"}, {"answer": "no question"}], "assets": [{"name": "Deck", "notes": "Open on slide 2"}], "about": [{"fact": "x"}]}');
    expect(d).toEqual({ keyPoints: ["We grow, fast"], questions: [{ question: "Why now?", answer: "Because" }], assets: [{ name: "Deck", notes: "Open on slide 2" }] });
    expect(d).not.toHaveProperty("about");
  });

  it("gives null for a reply with nothing to use", () => {
    expect(readDraft("no json")).toBeNull();
    expect(readDraft("{not json}")).toBeNull();
    expect(readDraft('{"keyPoints": []}')).toBeNull();
  });

  it("keeps at most five key points", () => {
    expect(readDraft(JSON.stringify({ keyPoints: ["a", "b", "c", "d", "e", "f"] }))!.keyPoints).toHaveLength(5);
  });
});

describe("joining a draft to the host's prep", () => {
  const prep: MeetingPrep = {
    ...emptyPrep(),
    keyPoints: ["Revenue doubled", "Team"],
    questions: [{ id: "q1", question: "Why now?", answer: "", rehearsed: true }, { id: "q2", question: "Moat?", answer: "Data", rehearsed: false }],
    assets: [{ id: "a1", name: "Deck", url: "https://x.example/deck", notes: "" }],
    about: [{ id: "f1", fact: "Led our seed", source: "https://x.example/f" }],
  };

  it("deletes nothing the host wrote and fills only what is empty", () => {
    const out = mergeDraft(prep, {
      keyPoints: ["revenue doubled", "Market", "Ask", "Use of funds"],
      questions: [{ question: "why now?", answer: "Timing" }, { question: "Moat?", answer: "Other" }, { question: "Burn?", answer: "[fill in]" }],
      assets: [{ name: "deck", notes: "Slide 2 first" }, { name: "Demo", notes: "Show sign up" }],
    }, ids());
    expect(out.keyPoints).toEqual(["Revenue doubled", "Team", "Market", "Ask", "Use of funds"]);
    expect(out.questions).toEqual([
      { id: "q1", question: "Why now?", answer: "Timing", rehearsed: true },
      { id: "q2", question: "Moat?", answer: "Data", rehearsed: false },
      { id: "n1", question: "Burn?", answer: "[fill in]", rehearsed: false },
    ]);
    expect(out.assets).toEqual([
      { id: "a1", name: "Deck", url: "https://x.example/deck", notes: "Slide 2 first" },
      { id: "n2", name: "Demo", url: null, notes: "Show sign up" },
    ]);
    expect(out.about).toEqual(prep.about);
    expect(out.checklist).toEqual(prep.checklist);
  });

  it("does not touch the stored prep", () => {
    mergeDraft(prep, { keyPoints: [], questions: [{ question: "Why now?", answer: "Timing" }], assets: [] }, ids());
    expect(prep.questions[0]!.answer).toBe("");
  });

  it("says when there is no prep yet", () => {
    expect(prepIsEmpty(emptyPrep())).toBe(true);
    expect(prepIsEmpty({ ...emptyPrep(), about: prep.about })).toBe(true);
    expect(prepIsEmpty(prep)).toBe(false);
  });

  it("keeps a joined prep in the shape set_meeting_prep takes", () => {
    const out = mergeDraft(emptyPrep(), readDraft(JSON.stringify({ keyPoints: ["a"], questions: [{ question: "q", answer: "" }], assets: [{ name: "Deck", notes: "" }] }))!, ids());
    expect(prepInput.safeParse(out).success).toBe(true);
    expect(prepInput.safeParse({ ...out, about: [{ id: "f", fact: "x", source: "" }] }).success).toBe(false);
    expect(setMeetingPrepAction.tier).toBe("own");
    expect(meetingPrepAction.tier).toBe("read");
  });

  it("asks from the meeting's own fields and never about the investor", () => {
    const p = draftPrompt({ title: "Seed call", agenda: "1. Intro", minutes: 30, venture: { name: "Acme", what: "Tools" } });
    expect(p).toContain("Seed call");
    expect(p).toContain("Acme. Tools");
    expect(p).toContain("Do not write anything about the other person");
    expect(p).not.toMatch(/—/);
  });
});
