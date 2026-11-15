import { describe, expect, it } from "vitest";
import { chaptersFromNotes, splitStamps } from "./podcasts";

const block = (text: string) => ({ list: false, parts: [{ text }] });

describe("chapters from show notes", () => {
  it("reads lines that start with a time, after a list number or a rule", () => {
    const notes = [block("Question Time Stamps for Quick Reference:"), block("0:00 - Intro"), block("1. 0:04 {Processing Wes Huff's Recent Situation} Addressing allegations."), block("~~~ 26:54 – Prayer for Wes Huff"), block("2. 22:07 {Jesus' Temptations}")];
    expect(chaptersFromNotes(notes)).toEqual([
      { at: 0, title: "Intro" }, { at: 4, title: "Processing Wes Huff's Recent Situation Addressing allegations." },
      { at: 1327, title: "Jesus' Temptations" }, { at: 1614, title: "Prayer for Wes Huff" },
    ]);
  });
  it("reads times in parentheses or brackets, as All-In writes them", () => {
    expect(chaptersFromNotes([block("(0:00) Axon CEO Rick Smith joins"), block("(2:39) History of TASER"), block("[1:02:05] Drones")])).toEqual([
      { at: 0, title: "Axon CEO Rick Smith joins" }, { at: 159, title: "History of TASER" }, { at: 3725, title: "Drones" },
    ]);
  });
  it("is nothing when fewer than three lines have times", () => {
    expect(chaptersFromNotes([block("0:00 Intro"), block("12:00 Outro"), block("Thanks")])).toEqual([]);
  });
  it("splits text at its times", () => {
    expect(splitStamps("Start at 1:02:03 then (4:05).")).toEqual([{ text: "Start at " }, { stamp: "1:02:03", at: 3723 }, { text: " then (" }, { stamp: "4:05", at: 245 }, { text: ")." }]);
    expect(splitStamps("Ratio 3:2 is not a time")).toEqual([{ text: "Ratio 3:2 is not a time" }]);
  });
});
