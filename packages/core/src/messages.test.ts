import { describe, expect, it } from "vitest";
import { MESSAGE_MAX, cleanText, findContact, pairOf, sendPreview, type Contact } from "./messages";

const list: Contact[] = [
  { id: "u-ann", name: "Ann Lee", via: "household" },
  { id: "u-ben", name: "Ben Cole", via: "friend" },
  { id: "u-bea", name: "Bea Cole", via: "friend" },
];

describe("messages between members", () => {
  it("orders a pair the same way from either side", () => {
    expect(pairOf("b", "a")).toEqual(["a", "b"]);
    expect(pairOf("a", "b")).toEqual(["a", "b"]);
  });

  it("trims a message and refuses an empty or overlong one", () => {
    expect(cleanText("  Dinner at six?\r\n ")).toBe("Dinner at six?");
    expect(() => cleanText("   ")).toThrow(/Write the message/);
    expect(() => cleanText(5)).toThrow(/Write the message/);
    expect(() => cleanText("x".repeat(MESSAGE_MAX + 1))).toThrow(/up to 2000/);
  });

  it("shows exactly the recipient and the text on the Send card", () => {
    expect(sendPreview("Ann Lee", "Dinner at six?")).toBe("To Ann Lee: Dinner at six?");
  });

  it("finds a contact by id, by name, or by a unique first name, and refuses anyone else", () => {
    expect(findContact(list, "u-ben").name).toBe("Ben Cole");
    expect(findContact(list, "ann lee").id).toBe("u-ann");
    expect(findContact(list, "Ann").id).toBe("u-ann");
    expect(() => findContact(list, "Cole")).toThrow(/More than one.*Ben Cole, Bea Cole/);
    expect(() => findContact(list, "Dot")).toThrow(/not someone you can message/);
    expect(() => findContact(list, " ")).toThrow(/Say who/);
  });
});
