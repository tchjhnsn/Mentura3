// The Integrations lint (spec "Integrations: formal specification", Lint suites). It reads the screen inventory and the
// machines as data and the code as text. Rules here: S-1 numbered, S-3 entry points, C-5 words, T-4 names agree,
// T-5 failure actions come from the machines, and
// the catalog's K-1 membership, K-2 capabilities, K-4 logos and K-6 coverage.
// The rest of the suites follow as the catalogs they read (components, capabilities) are written.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { MARKET } from "@reflect/core/marketplace";
import { INITIAL_ONLY, logoSrc } from "@/app/marketplace/logos";
import { FUNCTIONS } from "./data";
import { CAPABILITIES, CATEGORIES, PRIMARY, SERVICE_CAPABILITIES, categoriesOf, categoryOf, servicesThat } from "./integrations";
import { MACHINES, failureAction } from "./integrations-machines";
import { alternativesFor } from "./recommend";
import { SCREENS } from "./integrations-screens";

const SRC = join(__dirname, "..", "..");
const read = (file: string) => readFileSync(join(SRC, file), "utf8");
const filesUnder = (dir: string): string[] =>
  readdirSync(join(SRC, dir)).flatMap((name) => {
    const path = join(dir, name);
    return statSync(join(SRC, path)).isDirectory() ? filesUnder(path) : [path];
  });

const PAGES = "app/studio/v/[slug]/integrations";
const drawn = SCREENS.filter((s) => s.status !== "proposed");
const UI_FILES = { ui: "components/studio/integrations-ui.tsx", search: "components/studio/integrations-search.tsx", why: "components/studio/integrations-why.tsx" };

describe("S-1 numbered: every integrations route has a screen number, and every built screen is drawn with its own", () => {
  it("each page under integrations carries the number of a screen whose file it is", () => {
    for (const page of filesUnder(PAGES).filter((f) => f.endsWith("page.tsx"))) {
      const screens = SCREENS.filter((s) => (s.page ?? s.file) === page);
      expect(screens.length, `${page} is in no screen row`).toBeGreaterThan(0);
    }
  });

  it("each built screen's file exists and draws its number", () => {
    for (const s of SCREENS.filter((s) => s.status === "built")) {
      expect(s.file, s.id).toBeTruthy();
      expect(existsSync(join(SRC, s.file as string)), `${s.id} ${s.file}`).toBe(true);
      expect(read(s.file as string), `${s.id} does not draw its number`).toContain(`"${s.id}"`);
    }
  });

  it("numbers are unique and a proposed screen names no file yet", () => {
    expect(new Set(SCREENS.map((s) => s.id)).size).toBe(SCREENS.length);
    for (const s of SCREENS.filter((s) => s.status === "proposed")) expect(s.file, s.id).toBeUndefined();
    for (const s of SCREENS.filter((s) => s.status === "partial")) expect(s.note, `${s.id} says what is missing`).toBeTruthy();
  });
});

describe("S-3 entry points: every listed way in is a real link", () => {
  for (const s of drawn) {
    it(`${s.id} ${s.name}`, () => {
      expect(s.entries.length, `${s.id} has no way in`).toBeGreaterThan(0);
      for (const e of s.entries) expect(read(e.file), `${s.id} from ${e.from} (${e.file})`).toContain(e.href);
    });
  }
});

/** Words a person reads: JSX text and string literals with a space in them, comments removed. */
function copyIn(source: string): string[] {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
  const jsxText = [...code.matchAll(/>([^<>{}]*[A-Za-z][^<>{}]*)</g)].map((m) => m[1]);
  const literals = [...code.matchAll(/(["'`])((?:(?!\1)[^\\\n]|\\.)*\s(?:(?!\1)[^\\\n]|\\.)*)\1/g)].map((m) => m[2]);
  return [...jsxText, ...literals].filter((w): w is string => w !== undefined);
}

describe("C-5 words: the copy says business, never venture, and never coming soon", () => {
  const files = [
    ...filesUnder(PAGES).filter((f) => f.endsWith(".tsx")),
    UI_FILES.ui, UI_FILES.search, UI_FILES.why,
  ];
  for (const file of files) {
    it(relative(".", file), () => {
      for (const words of copyIn(read(file))) {
        expect(words, `${file}: "${words.trim()}"`).not.toMatch(/\bventures?\b|coming soon/i);
      }
    });
  }

  it("the rule itself catches the words it is for", () => {
    expect(copyIn('<p>Your venture is ready</p>').join()).toMatch(/venture/);
    expect(copyIn('const t = "Coming soon to you";').join()).toMatch(/Coming soon/);
    expect(copyIn('ventureHref(slug, "integrations") // venture word in a comment').join()).not.toMatch(/venture/);
  });
});

describe("T-4 names agree: every machine state a screen cites is a state of that machine", () => {
  const states = new Map(MACHINES.map((m) => [m.id, new Set<string>(m.states)]));
  for (const s of SCREENS) {
    it(s.id, () => {
      for (const ref of s.machine) {
        const [id = "", state = ""] = ref.split(":");
        expect(states.get(id)?.has(state), `${s.id} cites ${ref}`).toBe(true);
      }
    });
  }
});

describe("T-5 failure actions come from the machines: a built screen that cites a failure state takes its next action from the machine's data", () => {
  const byId = new Map(MACHINES.map((m) => [m.id, m]));
  // Built screens only: a partial one (V32) is drawn outside the console and joins when it is mirrored there.
  for (const s of SCREENS.filter((x) => x.status === "built")) {
    const failures = s.machine.filter((ref) => {
      const [id = "", state = ""] = ref.split(":");
      const m = byId.get(id);
      return m ? failureAction(m, state as never) !== null : false;
    });
    if (!failures.length || !s.file) continue;
    it(s.id, () => {
      const code = read(s.file!);
      for (const ref of failures) {
        const [id = "", state = ""] = ref.split(":");
        // M2's failures are drawn by SignInFailed, which reads failureAction(M2, state) itself.
        const reaches = id === "M2" ? /<SignInFailed\b/.test(code) : new RegExp(`failureAction\\(${id}, "${state}"\\)`).test(code);
        expect(reaches, `${s.id} cites ${ref} but does not take its next action from ${id}`).toBe(true);
        expect(code, `${s.id} writes "${failureAction(byId.get(id)!, state as never)}" by hand`).not.toMatch(new RegExp(`>\\s*${failureAction(byId.get(id)!, state as never)}\\s*<`));
      }
    });
  }
});

describe("catalog lint", () => {
  const services = MARKET.map((c) => c.id);

  it("K-1 membership: every service has one primary category, it is among its categories, and every member is in the catalog (P1, P2)", () => {
    for (const id of services) {
      const primary = PRIMARY[id];
      expect(primary, `${id} has no primary category`).toBeTruthy();
      expect(categoryOf(primary as string)?.members, `${id}'s primary ${primary} does not list it`).toContain(id);
      expect(categoriesOf(id)[0]?.id, `${id} is not shown under its primary first`).toBe(primary);
    }
    for (const id of Object.keys(PRIMARY)) expect(services, `${id} has a primary but is not in the catalog`).toContain(id);
    for (const c of CATEGORIES) for (const m of c.members) expect(services, `${c.id} lists ${m}`).toContain(m);
  });

  it("K-1 a service can carry several categories: Notion keeps knowledge, documents and plans", () => {
    expect(categoriesOf("notion").map((c) => c.id)).toEqual(["knowledge", "files", "project-management"]);
  });

  it("K-2 capabilities: every service names at least one, each from the fixed list (P4)", () => {
    for (const id of services) {
      const caps = SERVICE_CAPABILITIES[id] ?? [];
      expect(caps.length, `${id} has no capabilities`).toBeGreaterThan(0);
      for (const cap of caps) expect(Object.keys(CAPABILITIES), `${id}: ${cap}`).toContain(cap);
    }
    for (const id of Object.keys(SERVICE_CAPABILITIES)) expect(services, `${id} has capabilities but is not in the catalog`).toContain(id);
  });

  it("K-2 existing storage: files and knowledge can live in more than one outside service, so no business has to move", () => {
    expect(servicesThat("store-files").length).toBeGreaterThan(1);
    expect(servicesThat("store-knowledge")).toEqual(expect.arrayContaining(["notion", "atlassian"]));
  });

  it("K-4 logos: every service has a logo file or keeps its initial on purpose", () => {
    for (const id of services) {
      const src = logoSrc(id);
      if (src) expect(existsSync(join(SRC, "..", "public", src)), `${id}: ${src}`).toBe(true);
      else expect(INITIAL_ONLY, `${id} has no logo and is not listed as initial only`).toContain(id);
    }
    for (const id of INITIAL_ONLY) expect(logoSrc(id), `${id} has a logo now; take it off INITIAL_ONLY`).toBeNull();
  });

  it("K-6 coverage: a category that fills a capability cluster has a service or a built-in alternative", () => {
    for (const c of CATEGORIES.filter((c) => c.cluster)) {
      if (c.members.length) continue;
      expect(alternativesFor(c.id, { functions: FUNCTIONS.map((f) => f.id) }).length, `${c.id} is empty with no alternative`).toBeGreaterThan(0);
    }
  });
});
