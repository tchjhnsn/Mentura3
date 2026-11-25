// The Integrations screen inventory (spec "Integrations: formal specification", Screens): every screen's number, path,
// job, entry points and the states it draws, built or proposed. Per the Virtu rule, the feature starts from this list,
// and integrations-lint.test.ts holds the code to it. The spec calls it screens.json; it is TypeScript so the compiler
// checks the machine state names it cites against integrations-machines.ts.
import type { ActionState, ConnectionState, GrantState, SignInState, SourceState } from "./integrations-machines";

/** A machine state a screen must draw, named by machine. */
export type MachineState =
  | `M1:${ConnectionState}` | `M2:${SignInState}` | `M3:${GrantState}` | `M4:${SourceState}` | `M7:${ActionState}`;

/** A link into the screen: the file that holds it, and text its href contains. */
export type EntryPoint = { from: string; file: string; href: string };

export type Screen = {
  id: string;
  name: string;
  /** Path under /studio/v/:biz, or an absolute path when it lives outside the business console. */
  path: string;
  job: string;
  /** The file that draws it, relative to web/src. Built and partial screens only. */
  file?: string;
  /** The route's page.tsx, when another file draws the screen. */
  page?: string;
  entries: EntryPoint[];
  /** Screen states, in the screen's own words. */
  states: string[];
  /** Machine states the screen must draw. */
  machine: MachineState[];
  /** built: drawn, numbered and linked. partial: drawn somewhere, but not yet as the spec says. proposed: not built. */
  status: "built" | "partial" | "proposed";
  note?: string;
};

const PAGES = "app/studio/v/[slug]/integrations";
const UI = "components/studio/integrations-ui.tsx";

export const SCREENS: Screen[] = [
  {
    id: "V20", name: "Integrations", path: "integrations", job: "Find what this business should connect, and browse everything",
    file: "components/studio/integrations-search.tsx", page: `${PAGES}/page.tsx`,
    entries: [{ from: "V25", file: `${PAGES}/connected/page.tsx`, href: 'ventureHref(slug, "integrations")' }],
    states: ["loading", "ready", "searching", "no matches", "store unavailable"], machine: [], status: "built",
  },
  {
    id: "V21", name: "Category", path: "integrations/category/:cat", job: "See one kind of software: why it matters here, the work it serves, its services",
    file: `${PAGES}/category/[category]/page.tsx`,
    entries: [{ from: "V20", file: UI, href: "integrations/category/" }],
    states: ["ready", "empty category", "recommended", "later", "connected"], machine: [], status: "built",
  },
  {
    id: "V22", name: "Function's integrations", path: "integrations/function/:fn", job: "What one function needs from outside, by process group",
    file: `${PAGES}/function/[fn]/page.tsx`,
    entries: [{ from: "V12", file: UI, href: "integrations/function/" }],
    states: ["ready", "function off", "nothing serves it"], machine: [], status: "built",
  },
  {
    id: "V23", name: "Service", path: "integrations/:svc", job: "Decide whether to connect: what Reflect does with it, why here, facts",
    file: `${PAGES}/[id]/page.tsx`,
    entries: [{ from: "V20", file: UI, href: "integrations/${c.id}" }],
    states: ["not connected", "needs setup", "kept to other businesses", "error"], machine: ["M1:none"], status: "built",
  },
  {
    id: "V24", name: "Connect", path: "integrations/:svc/connect", job: "What the connection allows, which businesses get it, then the service's sign-in",
    file: `${PAGES}/[id]/connect/page.tsx`,
    entries: [{ from: "V23", file: `${PAGES}/[id]/page.tsx`, href: "/connect`" }],
    states: ["ready", "submitting", "sign-in failed"], machine: ["M1:pending", "M2:cancelled", "M2:denied", "M2:unreachable"], status: "built",
  },
  {
    id: "V25", name: "Connected", path: "integrations/connected", job: "Every connection the person has, and which this business can use",
    file: `${PAGES}/connected/page.tsx`,
    entries: [{ from: "V20", file: "components/studio/integrations-search.tsx", href: "integrations/connected" }],
    states: ["empty", "list", "needs reconnect"], machine: ["M1:pending", "M1:connected", "M1:expired"], status: "built",
  },
  {
    id: "V26", name: "Service, connected", path: "integrations/:svc", job: "Manage one connection: businesses, tools, Disconnect",
    file: `${PAGES}/[id]/page.tsx`,
    entries: [{ from: "V25", file: `${PAGES}/connected/page.tsx`, href: "integrations/${encodeURIComponent(c.connector)}" }],
    states: ["connected", "saving", "saved", "needs migration", "disconnecting"], machine: ["M1:connected", "M1:expired", "M3:granted", "M3:revoked"], status: "built",
  },
  {
    id: "V27", name: "Sources of truth", path: "integrations/sources", job: "For each kind of record, where this business keeps it: Reflect or a connected service",
    entries: [], states: ["unset", "set", "source unreachable", "capability missing"], machine: ["M4:reflect", "M4:outside", "M4:unreachable"], status: "proposed",
  },
  {
    id: "V28", name: "Use existing storage", path: "integrations/sources/:kind", job: "Point a record kind at an outside folder, base or space without moving anything",
    entries: [], states: ["choosing service", "choosing folder", "confirming", "linked", "failed"], machine: ["M4:outside"], status: "proposed",
  },
  {
    id: "V29", name: "Reconnect", path: "integrations/:svc/reconnect", job: "Sign in again when a token expired or was revoked, keeping the grants",
    entries: [], states: ["ready", "signing in", "restored", "failed"], machine: ["M1:expired", "M1:connected", "M2:wrong account"], status: "proposed",
  },
  {
    id: "V30", name: "Connection activity", path: "integrations/:svc/activity", job: "What Reflect read and did through this connection, when and for whom",
    entries: [], states: ["empty", "list", "filtered"], machine: ["M7:done", "M7:failed"], status: "proposed",
  },
  {
    id: "V31", name: "Why this?", path: "panel on V20, V21, V22, V23", job: "The recommendation's reasons, restated by AI with citations",
    file: "components/studio/integrations-why.tsx",
    entries: [{ from: "V21", file: `${PAGES}/category/[category]/page.tsx`, href: "<WhyThis" }, { from: "V23", file: `${PAGES}/[id]/page.tsx`, href: "<WhyThis" }],
    states: ["idle", "explaining", "explained", "plain", "error"], machine: [], status: "built",
  },
  {
    id: "V32", name: "Add your own server", path: "/marketplace/add", job: "Connect any remote MCP server by its https address",
    file: "app/marketplace/add",
    entries: [{ from: "V20", file: UI, href: "/marketplace/add" }],
    states: ["ready", "checking", "refused private address", "connected"], machine: ["M2:unreachable"], status: "partial",
    note: "Built at /marketplace/add only, without its number; not yet mirrored at integrations/add.",
  },
  {
    id: "V33", name: "Approvals", path: "integrations/approvals", job: "Actions waiting for the person's Send across connections",
    entries: [], states: ["empty", "list", "sending", "sent", "failed"], machine: ["M7:waiting", "M7:sending", "M7:done", "M7:failed"], status: "proposed",
    note: "Today each Send card sits in the chat.",
  },
];
