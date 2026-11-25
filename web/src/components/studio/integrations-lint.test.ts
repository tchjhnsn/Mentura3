// The Integrations lint (spec "Integrations: formal specification", Lint suites). It reads the screen inventory and the
// machines as data and the code as text. Rules here: S-1 numbered, S-3 entry points, C-5 words and T-4 names agree.
// The rest of the suites follow as the catalogs they read (components, capabilities) are written.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { MACHINES } from "./integrations-machines";
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
