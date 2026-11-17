// Connections (doc "Tiles and their connections"; design guide "Connections interface design guide", 2026-11-17).
// The interface comes before the connectors: every connector has a page that says what Reflect would read, what it
// never does, and which tiles use it, whether or not it can be connected yet. A connector's state for one person
// (connected or not) is worked out on the server; this file holds the catalog and the parts fetchable by path.

/** How far a connector is: one a person can connect today, one not built yet, one read on the phone, one not offered. */
export type Availability = "built" | "not-built" | "phone-app" | "not-offered";
export type ConnectorGroup = "household" | "ventures" | "person" | "polis";
export type Connector = {
  id: string;
  /** What it brings, as the person would name it ("Bank accounts"). */
  name: string;
  /** Who provides it ("Plaid"). */
  by: string;
  group: ConnectorGroup;
  availability: Availability;
  /** The tiles that use it, as "app" or "app/kind" (`@reflect/core/life`). */
  tiles: readonly string[];
  reads: readonly string[];
  never: readonly string[];
  /** Why it cannot be connected, for every connector that is not built. */
  why?: string;
  /** A page that states the reason, where there is one. */
  source?: { name: string; url: string };
  /** For a built connector that needs the deployment's keys: what the owner must set up. Its row says "Needs setup". */
  setup?: string;
};

export const GROUP_LABEL: Record<ConnectorGroup, string> = { household: "The household", ventures: "Ventures", person: "The person", polis: "The polis" };
export const GROUPS: readonly ConnectorGroup[] = ["household", "ventures", "person", "polis"];

const NO_PASSWORD = "Ask for or keep your password";
const NO_SHARE = "Show your data to anyone you have not chosen";

export const CONNECTORS: readonly Connector[] = [
  {
    id: "place", name: "Where you live", by: "FEMA and the EPA", group: "household", availability: "built", tiles: ["home/safety", "home/water"],
    reads: ["Your county's natural hazard ratings, from FEMA's National Risk Index", "Your water system's health-based violations, from the EPA"],
    never: ["Ask for your street address", "Send where you live to anyone"],
  },
  {
    id: "plaid", name: "Bank accounts", by: "Plaid", group: "household", availability: "not-built", tiles: ["work/income"],
    reads: ["Each account's name and balance", "Transactions, to set what you spend beside your income plan"],
    never: [NO_PASSWORD, "Move money", NO_SHARE],
    why: "Reflect cannot connect to Plaid yet.",
  },
  {
    id: "pinwheel", name: "Payroll", by: "Pinwheel", group: "household", availability: "not-built", tiles: ["work/income"],
    reads: ["Your employer, pay and pay dates"],
    never: [NO_PASSWORD, "Change your direct deposit", NO_SHARE],
    why: "Reflect cannot connect to Pinwheel yet. It needs a business contract.",
  },
  {
    id: "instacart", name: "Groceries", by: "Instacart", group: "household", availability: "built", tiles: ["home/food"],
    reads: ["Nothing. Reflect sends Instacart your week's shopping list, and you shop it on Instacart's page"],
    never: ["Buy anything for you", "Send Instacart anything but the list"],
  },
  {
    id: "stripe", name: "Payments", by: "Stripe", group: "ventures", availability: "not-built", tiles: ["ventures"],
    reads: ["Payments and payouts for your business"],
    never: ["Charge or refund anyone", NO_SHARE],
    why: "Reflect cannot connect to Stripe yet.",
  },
  {
    id: "shopify", name: "Store", by: "Shopify", group: "ventures", availability: "not-built", tiles: ["ventures"],
    reads: ["Orders and products from your store"],
    never: ["Change your store", NO_SHARE],
    why: "Reflect cannot connect to Shopify yet.",
  },
  {
    id: "etsy", name: "Shop", by: "Etsy", group: "ventures", availability: "not-built", tiles: ["ventures"],
    reads: ["Orders and listings from your shop"],
    never: ["Change your listings", NO_SHARE],
    why: "Reflect cannot connect to Etsy yet.",
  },
  {
    id: "calendars", name: "Calendar subscriptions", by: "iCalendar", group: "person", availability: "built", tiles: ["calendar"],
    reads: [
      "The events of a calendar you subscribe to by its address in iCal format: Google Calendar's secret address, an iCloud public calendar, or Outlook's ICS link",
      "Its events again at most every 15 minutes, shown in your calendar beside your own",
    ],
    never: ["Change or add events in that calendar", "Show or send the calendar's address once it is saved"],
  },
  {
    id: "google-calendar", name: "Google Calendar", by: "Google", group: "person", availability: "built", tiles: ["calendar"],
    reads: ["The events on your primary Google calendar, shown in your calendar", "Events you add in Reflect after connecting, which Reflect adds to Google Calendar"],
    never: [NO_PASSWORD, "Change or remove events you made in Google Calendar", NO_SHARE],
    setup: "Google Calendar needs setup: the owner of this Reflect has not added Google's sign-in keys yet.",
  },
  {
    id: "microsoft-calendar", name: "Outlook Calendar", by: "Microsoft", group: "person", availability: "built", tiles: ["calendar"],
    reads: ["The events on your default Outlook calendar, from a work, school or personal Microsoft account, shown in your calendar", "Your mailbox's time zone, so times match", "Events you add in Reflect after connecting, which Reflect adds to Outlook Calendar"],
    never: [NO_PASSWORD, "Change or remove events you made in Outlook Calendar", "Read your mail", NO_SHARE],
    setup: "Outlook Calendar needs setup: the owner of this Reflect has not added Microsoft's sign-in keys yet.",
  },
  {
    id: "apple-health", name: "Health", by: "Apple Health", group: "person", availability: "phone-app", tiles: ["body"],
    reads: ["Workouts, sleep and steps"],
    never: [NO_SHARE],
    why: "Apple Health is read on your phone, through the Reflect app, which is not built yet.",
  },
  {
    id: "strava", name: "Workouts", by: "Strava", group: "person", availability: "not-offered", tiles: ["body"],
    reads: ["Workouts"],
    never: [],
    why: "Strava forbids using its data with AI, so Reflect does not connect to it.",
    source: { name: "Strava API Agreement", url: "https://www.strava.com/legal/api" },
  },
  {
    id: "polity", name: "Your representatives and ballot", by: "Polity", group: "polis", availability: "not-built", tiles: ["polis"],
    reads: ["Who represents you, and what is on your ballot"],
    never: [NO_SHARE],
    why: "Reflect cannot connect to Polity yet.",
  },
];

/** Public data Reflect reads for everyone, and what each feeds. */
export const PUBLIC_SOURCES: readonly { name: string; url: string; feeds: string }[] = [
  { name: "USDA Food Plans", url: "https://www.fns.usda.gov/cnpp/usda-food-plans-cost-food-monthly-reports", feeds: "Food in your income plan" },
  { name: "IRS tax brackets, tax year 2026", url: "https://www.irs.gov/filing/federal-income-tax-rates-and-brackets", feeds: "Taxes in your income plan" },
  { name: "FEMA National Risk Index", url: "https://hazards.fema.gov/nri/", feeds: "Safety, from where you live" },
  { name: "EPA Safe Drinking Water Information System", url: "https://enviro.epa.gov/facts/sdwis/search.html", feeds: "Water, from where you live" },
  { name: "Project Gutenberg, LibriVox, Open Library", url: "https://openlibrary.org", feeds: "Books and audiobooks in Scholē" },
  { name: "Apple Podcasts search, fyyd, gpodder", url: "https://fyyd.de", feeds: "Podcasts in Scholē" },
];

export const connectorOf = (id: string): Connector | undefined => CONNECTORS.find((c) => c.id === id);

/**
 * The connectors a tile shows: on its first view, every one that names the tile; on one of its parts, the ones that
 * name that part.
 */
export function connectorsFor(app: string, kind?: string | null): Connector[] {
  return CONNECTORS.filter((c) => c.tiles.some((t) => (kind ? t === `${app}/${kind}` : t.split("/")[0] === app)));
}

/** A person's state with one connector. */
export type ConnectionState = "connected" | "not-connected" | "unavailable";
export type Connection = { id: string; state: ConnectionState; /** What it holds once connected ("Travis County, TX"). */ detail?: string };

/** The word on a list row's right, from the design guide's states. */
export function stateWord(c: Connector, s: ConnectionState): string {
  if (s === "connected") return c.id === "instacart" ? "Ready" : "Connected";
  if (s === "unavailable" && c.setup) return "Needs setup";
  if (c.availability === "phone-app") return "Phone app";
  if (c.availability === "not-offered") return "Not offered";
  if (s === "unavailable" || c.availability === "not-built") return "Not yet";
  return "Connect";
}

const TILE_LABEL: Record<string, string> = {
  "home/safety": "Home, Safety", "home/water": "Home, Water", "home/food": "Home, Food", "work/income": "Work, Income",
  ventures: "Ventures", body: "Body", polis: "Polis", calendar: "Calendar",
};
export const tileLabel = (t: string) => TILE_LABEL[t] ?? t;
export const tileHref = (t: string) => { if (t === "calendar") return "/calendar"; const [app, kind] = t.split("/"); return `/life/${app}${kind ? `?k=${kind}` : ""}`; };

export const CONNECTIONS_PATHS = "'' (every connector and its state), 'connected', 'public' (public data Reflect reads), '<connector id>' (such as 'plaid' or 'place')";

/** One part of a person's connections by path, or null. */
export function connectionsPart(states: readonly Connection[], path: string): unknown {
  const [head, ...rest] = path.split("/").filter(Boolean);
  if (rest.length) return null;
  const byId = new Map(states.map((s) => [s.id, s]));
  const brief = (c: Connector) => { const s = byId.get(c.id); return { id: c.id, name: c.name, by: c.by, state: stateWord(c, s?.state ?? "not-connected"), ...(s?.detail ? { detail: s.detail } : {}) }; };
  if (!head) return GROUPS.map((g) => ({ group: GROUP_LABEL[g], connectors: CONNECTORS.filter((c) => c.group === g).map(brief) }));
  if (head === "connected") return CONNECTORS.filter((c) => byId.get(c.id)?.state === "connected").map(brief);
  if (head === "public") return PUBLIC_SOURCES.map((s) => ({ ...s }));
  const c = connectorOf(head);
  if (!c) return null;
  return { ...brief(c), reads: c.reads, never: c.never, usedBy: c.tiles.map(tileLabel), ...(c.why ? { why: c.why } : byId.get(c.id)?.state === "unavailable" && c.setup ? { why: c.setup } : {}) };
}
