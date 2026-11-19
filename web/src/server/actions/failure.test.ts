import { describe, expect, it, vi } from "vitest";
import { TimedOut, Busy, Unreachable } from "../outside";
import { Refused, failureText, fromDatabase } from "./failure";

describe("what a model is told when an action fails", () => {
  it("passes on a refusal and Reflect's own messages as written", () => {
    expect(failureText("Undo", new Refused({ reason: "too-old", message: "Changes can be undone for 30 days; this one is older." }))).toBe("Changes can be undone for 30 days; this one is older.");
    expect(failureText("Set state", new Error("No such state: done"))).toBe("No such state: done");
  });

  it("names an outside service that did not answer, by its host", () => {
    expect(failureText("Find a book", new TimedOut({ url: "https://openlibrary.org/search.json", ms: 8000 }))).toBe("openlibrary.org did not answer in time. Try again in a moment.");
    expect(failureText("Find a book", new Busy({ url: "https://openlibrary.org/x", status: 503, response: new Response(null, { status: 503 }) }))).toContain("busy (503)");
    expect(failureText("Find a book", new Unreachable({ url: "not a url", cause: null }))).toBe("An outside service could not be reached. Try again in a moment.");
  });

  it("never passes on a database driver's message or a programming error", () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const pg = Object.assign(new Error('duplicate key value violates unique constraint "life_record_pkey"'), { code: "23505", severity: "ERROR" });
    expect(fromDatabase(pg)).toBe(true);
    expect(failureText("Add a record", pg)).toBe("Add a record did not work, and nothing was changed. Try again, or tell the person it failed.");
    expect(failureText("Add a record", new TypeError("Cannot read properties of undefined (reading 'id')"))).not.toContain("undefined");
    expect(failureText("Add a record", "a string")).toContain("did not work");
    expect(err).toHaveBeenCalledTimes(3);
    err.mockRestore();
  });

  it("is an Error with its reason, so Promise code can throw and catch it", () => {
    const r = new Refused({ reason: "declined", message: "That change was declined." });
    expect(r).toBeInstanceOf(Error);
    expect([r._tag, r.reason, r.message]).toEqual(["Refused", "declined", "That change was declined."]);
  });
});
