import { describe, expect, it } from "vitest";
import { CONNECTORS, connectionsPart, connectorOf, connectorsFor, stateWord, tileHref } from "./connectors";

describe("connections", () => {
  it("says why for every connector that cannot be connected", () => {
    for (const c of CONNECTORS) if (c.availability !== "built") expect(c.why, c.id).toBeTruthy();
    expect(new Set(CONNECTORS.map((c) => c.id)).size).toBe(CONNECTORS.length);
  });

  it("gives a tile its connectors, and a part only its own", () => {
    expect(connectorsFor("home").map((c) => c.id)).toEqual(["place", "instacart"]);
    expect(connectorsFor("home", "food").map((c) => c.id)).toEqual(["instacart"]);
    expect(connectorsFor("work", "income").map((c) => c.id)).toEqual(["plaid", "pinwheel"]);
    expect(connectorsFor("home", "firearm")).toEqual([]);
    expect(connectorsFor("calendar").map((c) => c.id)).toEqual(["calendars", "google-calendar"]);
    expect(tileHref("calendar")).toBe("/calendar");
  });

  it("names each state as the design guide does", () => {
    expect(stateWord(connectorOf("place")!, "connected")).toBe("Connected");
    expect(stateWord(connectorOf("place")!, "not-connected")).toBe("Connect");
    expect(stateWord(connectorOf("instacart")!, "unavailable")).toBe("Not yet");
    expect(stateWord(connectorOf("strava")!, "unavailable")).toBe("Not offered");
    expect(stateWord(connectorOf("apple-health")!, "unavailable")).toBe("Phone app");
    expect(stateWord(connectorOf("google-calendar")!, "unavailable")).toBe("Needs setup");
    expect(stateWord(connectorOf("calendars")!, "not-connected")).toBe("Connect");
  });

  it("gives each part by path", () => {
    const states = [{ id: "place", state: "connected" as const, detail: "Travis County, TX" }];
    expect(connectionsPart(states, "connected")).toEqual([{ id: "place", name: "Where you live", by: "FEMA and the EPA", state: "Connected", detail: "Travis County, TX" }]);
    expect(connectionsPart(states, "plaid")).toMatchObject({ state: "Not yet", usedBy: ["Work, Income"] });
    expect((connectionsPart(states, "") as unknown[]).length).toBe(4);
    expect(connectionsPart(states, "nope")).toBeNull();
    expect(connectionsPart(states, "plaid/x")).toBeNull();
  });
});
