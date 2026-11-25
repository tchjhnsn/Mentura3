// The model check for the Integrations machines (spec "Integrations: formal specification", properties P6 to P8, P12,
// P15, P22 and P31). Every reachable state is walked, so these are proofs over the machines' data, not samples.
import { describe, expect, it } from "vitest";
import {
  GRANTABLE, HOLDS_TOKENS, M1, M2, M3, M4, M7, MACHINES, ON_CONNECTION, can, connectionStep, failureAction, next, reachable, signInFailure, signInFailureFrom,
  type ConnectionEvent, type ConnectionState, type GrantEvent, type GrantState, type Machine,
} from "./integrations-machines";

const all = MACHINES as readonly Machine<string, string>[];

describe("every machine is well formed", () => {
  for (const m of all) {
    it(`${m.id} ${m.name}: declared states, all reachable, no dead ends`, () => {
      const states = new Set(m.states);
      expect(states.has(m.initial)).toBe(true);
      for (const t of m.transitions) {
        for (const f of t.from) expect(states.has(f), `${m.id} from ${f}`).toBe(true);
        expect(states.has(t.to), `${m.id} to ${t.to}`).toBe(true);
      }
      expect([...reachable(m)].sort()).toEqual([...m.states].sort());
      for (const s of m.states) {
        if (m.terminal.includes(s)) continue;
        expect(m.transitions.some((t) => t.from.includes(s)), `${m.id} ${s} has no way out`).toBe(true);
      }
    });

    it(`${m.id} ${m.name}: every failure state shows exactly one next action (P31)`, () => {
      for (const [state, action] of Object.entries(m.failures)) {
        expect(m.states).toContain(state);
        expect(typeof action === "string" && action.trim().length > 0, `${m.id} ${state}`).toBe(true);
      }
    });
  }
});

describe("M1 Connection", () => {
  it("tokens exist only while connected or expired, and every way out of those states clears them (P6)", () => {
    for (const t of M1.transitions) {
      for (const f of t.from) {
        if (HOLDS_TOKENS.includes(f) && !HOLDS_TOKENS.includes(t.to)) expect(t.effect ?? "", `${f} -> ${t.to}`).toMatch(/clear/);
      }
      if (HOLDS_TOKENS.includes(t.to) && !t.from.every((f) => HOLDS_TOKENS.includes(f))) expect(t.on).toBe("signed in");
    }
  });

  it("disconnect reaches removed in one step from every live state, and owner deletion from every state (P7, P25)", () => {
    for (const s of ["pending", "connected", "expired"] as const) expect(next(M1, s, "disconnect")).toEqual(["removed"]);
    for (const s of M1.states) expect(next(M1, s, "owner deleted")).toEqual(["removed"]);
  });

  it("every M2 failure ends the connection attempt, never leaves it pending", () => {
    for (const e of ["cancelled", "denied", "failed", "timed out"] as const) expect(next(M1, "pending", e)).toEqual(["none"]);
  });
});

describe("M1 x M3, a connection and one business's grant together", () => {
  type Pair = `${ConnectionState}|${GrantState}`;
  const walk = () => {
    const start: Pair = "none|none";
    const seen = new Set<Pair>([start]);
    const queue: Pair[] = [start];
    const steps: [Pair, string, Pair][] = [];
    const push = (from: Pair, label: string, to: Pair) => {
      steps.push([from, label, to]);
      if (!seen.has(to)) { seen.add(to); queue.push(to); }
    };
    while (queue.length) {
      const pair = queue.shift() as Pair;
      const [c, g] = pair.split("|") as [ConnectionState, GrantState];
      for (const t of M1.transitions) {
        if (!t.from.includes(c)) continue;
        const coupled = ON_CONNECTION[t.to];
        for (const g2 of coupled ? next(M3, g, coupled) : [g]) push(pair, `M1 ${t.on as ConnectionEvent}`, `${t.to}|${g2}`);
      }
      for (const t of M3.transitions) {
        if (!t.from.includes(g)) continue;
        if (t.on === ("grant" satisfies GrantEvent) && !GRANTABLE.includes(c)) continue;
        push(pair, `M3 ${t.on}`, `${c}|${t.to}`);
      }
    }
    return { seen, steps };
  };

  it("a live grant only ever sits on a connected or expired connection", () => {
    for (const pair of walk().seen) {
      const [c, g] = pair.split("|") as [ConnectionState, GrantState];
      if (g === "granted" || g === "narrowed") expect(GRANTABLE, pair).toContain(c);
    }
  });

  it("expiry and reconnection never change a grant (P8)", () => {
    expect(Object.keys(ON_CONNECTION)).not.toContain("expired");
    for (const [from, label, to] of walk().steps) {
      if (label === "M1 token rejected" || label === "M1 reconnect" || label === "M1 refreshed") {
        expect(to.split("|")[1], `${from} ${label}`).toBe(from.split("|")[1]);
      }
    }
  });
});

describe("M2 Sign-in", () => {
  it("every run ends: the graph has no cycle, so no sign-in stays in progress (P12)", () => {
    const visiting = new Set<string>();
    const done = new Set<string>();
    const visit = (s: string): void => {
      expect(visiting.has(s), `cycle through ${s}`).toBe(false);
      if (done.has(s)) return;
      visiting.add(s);
      for (const t of M2.transitions) if (t.from.includes(s as never)) visit(t.to);
      visiting.delete(s);
      done.add(s);
    };
    visit(M2.initial);
  });

  it("every way a sign-in can end other than done is a failure with its own next action", () => {
    expect(M2.terminal.filter((s) => s !== "done").sort()).toEqual(Object.keys(M2.failures).sort());
  });

  it("an unsafe authorization address is never opened (P30)", () => {
    expect(next(M2, "discovering", "metadata unsafe")).toEqual(["unreachable"]);
    for (const t of M2.transitions.filter((t) => t.from.includes("discovering") && t.to !== "unreachable")) {
      expect(t.guard).toMatch(/https/);
    }
  });
});

describe("M4 Source of truth", () => {
  it("lost access goes to unreachable, and only a person returns a source to Reflect (P15)", () => {
    expect(next(M4, "outside", "access lost")).toEqual(["unreachable"]);
    for (const t of M4.transitions.filter((t) => t.to === "reflect")) expect(t.guard).toMatch(/person/);
  });
});

describe("M7 Action", () => {
  it("nothing but a read, a covered write or a person's Send reaches sending (P22)", () => {
    const into = M7.transitions.filter((t) => t.to === "sending");
    expect(into.map((t) => t.on).sort()).toEqual(["propose covered write", "propose read", "send"]);
    const send = into.find((t) => t.on === "send");
    expect(send?.from).toEqual(["waiting"]);
    expect(send?.guard).toMatch(/Send pressed/);
    expect(into.find((t) => t.on === "propose read")?.guard).toMatch(/read-only/);
  });
});

describe("helpers the screens and the server read", () => {
  it("connectionStep follows M1 and refuses what it lacks", () => {
    expect(connectionStep(null, "connect")).toBe("pending");
    expect(connectionStep("pending", "signed in")).toBe("connected");
    expect(connectionStep("connected", "token rejected")).toBe("expired");
    expect(connectionStep("expired", "reconnect")).toBe("connected");
    expect(connectionStep("expired", "disconnect")).toBe("removed");
    expect(() => connectionStep("removed", "reconnect")).toThrow(/cannot/);
    expect(() => connectionStep("pending", "token rejected")).toThrow(/cannot/);
    expect(() => connectionStep("deleted", "connect")).toThrow(/Unknown/);
  });
  it("a failed sign-in lands on a failure state of M2 with one next action", () => {
    for (const [error, threw] of [["access_denied", false], ["insufficient_scope", false], [null, false], ["server_error", false], [null, true]] as const) {
      const s = signInFailure(error, threw);
      expect(M2.terminal).toContain(s);
      expect(failureAction(M2, s)).not.toBeNull();
    }
    expect(signInFailure("access_denied")).toBe("denied");
    expect(signInFailure(null, true)).toBe("unreachable");
  });
  it("an address names only a failure state M2 has", () => {
    expect(signInFailureFrom("denied")).toBe("denied");
    expect(signInFailureFrom("done")).toBeNull();
    expect(signInFailureFrom("constructor")).toBeNull();
    expect(signInFailureFrom(undefined)).toBeNull();
  });
  it("can says whether a row leads out", () => {
    expect(can(M1, "expired", "reconnect")).toBe(true);
    expect(can(M1, "none", "disconnect")).toBe(false);
  });
});
