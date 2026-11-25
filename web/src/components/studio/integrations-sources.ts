// Sources of truth (spec "Integrations: formal specification", Sources of truth: domain and system design, F4, V27, M4).
// A business keeps each record kind, one Naive record type, in one place: its own Naive store (Reflect) or a service
// the person connected and opened to it. The choice is a rule in the business's knowledge/sources.json (EE-042), so
// the console writes Naive's model rather than its own. Pure: the page reads the map and the connections and passes
// them in. A service can hold a record kind only through an adapter that turns its MCP tools into Naive records;
// without one the kind shows "capability missing" and offers no choice. The web server runs adapters for Naive's
// mcp connector (web/src/server/naive-mcp.ts, packages/platform/connectors/mcp.ts).
import { SERVICE_CAPABILITIES, type Capability } from "./integrations";
import type { SourceState } from "./integrations-machines";

/** A record kind: one Naive record type, and the capabilities a service needs to hold it (P13). */
export type RecordKind = { type: string; name: string; line: string; capabilities: readonly Capability[] };

export const RECORD_KINDS: readonly RecordKind[] = [
  { type: "customer", name: "Customers", line: "The people and companies who buy from the business.", capabilities: ["keep-contacts", "take-payments"] },
  { type: "deal", name: "Deals", line: "Sales in progress and their stage.", capabilities: ["keep-contacts"] },
  { type: "support-case", name: "Support cases", line: "Each question a customer asked and its answer.", capabilities: ["answer-customers"] },
  { type: "calendar-event", name: "Calendar events", line: "Meetings and bookings.", capabilities: ["book-time"] },
  { type: "money-account", name: "Money accounts", line: "Where the business's money sits and moves.", capabilities: ["take-payments"] },
  { type: "supplier", name: "Suppliers", line: "Who the business buys from.", capabilities: ["store-records"] },
  { type: "investor", name: "Investors", line: "Who has invested or might.", capabilities: ["keep-contacts", "store-records"] },
];

/** A Naive record an adapter makes: an id, a name and a short summary (data-master.schema.json). */
export type AdaptedRecord = { id: string; name?: string; summary?: string };

/** An adapter: how one service's read tool becomes one record type, as files under `folder` (design step 2). Reads
 * only: `read` must be a tool that changes nothing at the service, and writes wait for M7, a person's Send. */
export type Adapter = { service: string; record: string; folder: string; read: string; args: Record<string, unknown>; toRecord: (raw: unknown) => AdaptedRecord | null };

const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const obj = (v: unknown): Record<string, unknown> | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null);

/** Stripe's customer (its API's Customer object) as a Naive customer record. */
export function stripeCustomer(raw: unknown): AdaptedRecord | null {
  const c = obj(raw);
  const id = str(c?.id);
  if (!c || !id || !/^cus_[A-Za-z0-9]+$/.test(id)) return null;
  const email = str(c.email);
  const name = str(c.name) ?? email ?? id;
  const created = typeof c.created === "number" ? new Date(c.created * 1000).toISOString().slice(0, 10) : undefined;
  const summary = [email && email !== name ? email : undefined, created ? `customer since ${created}` : undefined, "from Stripe"].filter(Boolean).join(", ");
  return { id, name, summary };
}

/** Adapters built so far. */
export const ADAPTERS: readonly Adapter[] = [
  { service: "stripe", record: "customer", folder: "customers", read: "list_customers", args: { limit: 100 }, toRecord: stripeCustomer },
];

/** The items a read tool answered with: an array, or one under data, items or results, as structured content or JSON text. */
export function itemsOf(structured: unknown, text: string): unknown[] {
  const pick = (v: unknown): unknown[] | null => {
    if (Array.isArray(v)) return v;
    const o = obj(v);
    for (const k of ["data", "items", "results", "customers"]) if (o && Array.isArray(o[k])) return o[k] as unknown[];
    return null;
  };
  const fromStructured = pick(structured);
  if (fromStructured) return fromStructured;
  try { return pick(JSON.parse(text)) ?? []; } catch { return []; }
}

export const adapterFor = (service: string, record: string, adapters: readonly Adapter[] = ADAPTERS): Adapter | null =>
  adapters.find((a) => a.service === service && a.record === record) ?? null;

/** The part of knowledge/sources.json this reads (knowledge-sources.schema.json). */
export type SourceMap = {
  sources?: { id: string; connector: string; api?: string }[];
  rules?: { record: string; attribute: string; phase: string; product: string; account: string; actor: string; system_of_record: string; owner?: string }[];
};

/** A connection as the screens see it (web/src/server/mcp-connections.ts). */
export type SourceConnection = { id: string; connector: string; status: string; businesses: readonly string[] | null };

/** A connected service's source entry: Naive's `mcp` connector (packages/platform/connectors/mcp.ts), the service in `api`, read-only. */
export const sourceEntryOf = (service: string, connection: string) =>
  ({ id: sourceIdOf(service, connection), connector: "mcp", api: service, writes: "none" }) as const;

/** A source id for one connection: Naive's ids are lowercase words, a connection's id is not, so it is hashed (FNV-1a). */
export function sourceIdOf(service: string, connection: string): string {
  let h = 0x811c9dc5;
  for (const ch of connection) h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193) >>> 0;
  return `mcp-${service.replace(/[^a-z0-9-]/g, "-")}-${h.toString(16).padStart(8, "0")}`;
}

/** The rule that names this record kind's source for the whole business: every context field "*". */
export const ruleFor = (map: SourceMap, record: string) =>
  (map.rules ?? []).find((r) => r.record === record && r.attribute === "*" && r.phase === "*" && r.product === "*" && r.account === "*" && r.actor === "*") ?? null;

export type KindSource = {
  kind: RecordKind;
  /** M4: reflect (no rule), outside (a rule whose connection is live here), unreachable (a rule it cannot reach). */
  state: SourceState;
  /** The connection the rule names, when it still exists. */
  connection: SourceConnection | null;
  /** The service the rule names, read from its source entry. */
  service: string | null;
  /** Services connected and open to this business that could hold the kind, each with or without an adapter. */
  candidates: { connection: SourceConnection; adapter: Adapter | null }[];
};

const live = (c: SourceConnection, business: string) => c.status === "connected" && (c.businesses === null || c.businesses.includes(business));

/** Each record kind's M4 state for one business, from its source map and the person's connections. */
export function sourcesOf(map: SourceMap, connections: readonly SourceConnection[], business: string, adapters: readonly Adapter[] = ADAPTERS): KindSource[] {
  return RECORD_KINDS.map((kind) => {
    const candidates = connections
      .filter((c) => live(c, business) && kind.capabilities.some((k) => SERVICE_CAPABILITIES[c.connector]?.includes(k)))
      .map((connection) => ({ connection, adapter: adapterFor(connection.connector, kind.type, adapters) }));
    const rule = ruleFor(map, kind.type);
    if (!rule || rule.system_of_record === "venture") return { kind, state: "reflect", connection: null, service: null, candidates };
    const entry = (map.sources ?? []).find((s) => s.id === rule.system_of_record);
    const service = entry?.connector === "mcp" && typeof entry.api === "string" ? entry.api : null;
    const connection = service ? connections.find((c) => c.connector === service && sourceIdOf(service, c.id) === rule.system_of_record) ?? null : null;
    // P15: a rule it cannot reach stays a rule and says so; it never falls back to Mentura on its own.
    const reachable = connection !== null && live(connection, business) && service !== null && adapterFor(service, kind.type, adapters) !== null;
    return { kind, state: reachable ? "outside" : "unreachable", connection, service, candidates };
  });
}
