import { describe, expect, it } from "vitest";
import { CRISIS_PROTOCOL, CRISIS_REPLY, crisisSignal } from "./crisis.ts";
import { ASK_SYSTEM } from "./ask.ts";

describe("crisis", () => {
  it("fires on signs of suicide or self-harm, however they are written", () => {
    for (const t of [
      "I want to kill myself",
      "i keep thinking about suicide",
      "I've been feeling suicidal lately",
      "I'm going to end my life",
      "Sometimes I just want to die",
      "everyone would be better off without me",
      "I don’t want to be alive anymore",
      "I DONT WANT TO LIVE",
      "there's no reason to live",
      "I started cutting myself again",
      "I've been self-harming",
      "thinking about self harm",
      "I might overdose on my pills",
      "I wish I was dead",
      "I can't go on",
      "kms",
      "I want to hurt myself",
      "planning to jump off a bridge",
    ]) {
      expect(crisisSignal(t), t).toBe(true);
    }
  });

  it("stays quiet on ordinary talk", () => {
    for (const t of [
      "What's on my shelves?",
      "Find me a good introduction to Aristotle",
      "This book is killing me, it's so long",
      "I could die laughing at that scene",
      "Show my claims",
      "Add a dentist appointment on Friday",
      "I harmed my chances in the interview",
    ]) {
      expect(crisisSignal(t), t).toBe(false);
    }
  });

  it("tolerates a false alarm on a book title rather than miss a person", () => {
    expect(crisisSignal("Find Durkheim's Suicide")).toBe(true);
  });

  it("says it is an AI, names 988 and its chat, and the model is told the same", () => {
    expect(CRISIS_REPLY).toContain("an AI");
    expect(CRISIS_REPLY).toContain("call or text 988");
    expect(CRISIS_REPLY).toContain("988lifeline.org");
    expect(ASK_SYSTEM).toContain(CRISIS_PROTOCOL);
  });
});
