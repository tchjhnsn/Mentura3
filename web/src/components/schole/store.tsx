"use client";

// Scholē's course state, shared by every screen so a lesson finished on one screen shows on the others: the subjects you
// want to understand and the time a day you chose (S2), the lessons you have read and checked, the lesson you were on
// in each course, what you saved, and the days you studied. Kept in this browser for now (localStorage when it is
// there); moving it to the person's records is not built (README, "Scholē").
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type State = {
  picks: string[];
  minutes: number | null;
  /** Lessons read and checked, by course: { "nicomachean-ethics": ["every-action-aims"] }. */
  done: Record<string, string[]>;
  /** The lesson last opened in each course, and when, for Continue. */
  at: Record<string, { lesson: string; when: string }>;
  /** "course" or "course/lesson". */
  saved: string[];
  /** Days studied, YYYY-MM-DD. */
  days: string[];
};

const KEY = "schole-courses-v1";
const START: State = { picks: [], minutes: null, done: {}, at: {}, saved: [], days: [] };
export const today = () => new Date().toISOString().slice(0, 10);

type Store = State & {
  ready: boolean;
  setPicks: (p: string[], minutes: number | null) => void;
  open: (course: string, lesson: string) => void;
  finish: (course: string, lesson: string) => void;
  isDone: (course: string, lesson: string) => boolean;
  toggleSave: (key: string) => void;
  say: (text: string) => void;
  reset: () => void;
};

const Ctx = createContext<Store | null>(null);

export function ScholeStore({ children }: { children: ReactNode }) {
  const [s, setS] = useState<State>(START);
  const [ready, setReady] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setS({ ...START, ...(JSON.parse(raw) as Partial<State>) });
    } catch {
      // No storage: the courses start fresh on each visit.
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* no storage */ }
  }, [s, ready]);

  const say = useCallback((text: string) => {
    setNote(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setNote(null), 2600);
  }, []);

  const store = useMemo<Store>(() => ({
    ...s,
    ready,
    setPicks: (picks, minutes) => setS((x) => ({ ...x, picks, minutes })),
    open: (course, lesson) => setS((x) => ({ ...x, at: { ...x.at, [course]: { lesson, when: new Date().toISOString() } } })),
    finish: (course, lesson) => setS((x) => ({
      ...x,
      done: { ...x.done, [course]: [...new Set([...(x.done[course] ?? []), lesson])] },
      days: x.days.includes(today()) ? x.days : [...x.days, today()],
    })),
    isDone: (course, lesson) => (s.done[course] ?? []).includes(lesson),
    toggleSave: (key) => setS((x) => ({ ...x, saved: x.saved.includes(key) ? x.saved.filter((v) => v !== key) : [key, ...x.saved] })),
    say,
    reset: () => setS(START),
  }), [s, ready, say]);

  return (
    <Ctx.Provider value={store}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        {note ? <span className="bg-foreground text-background rounded-full px-4 py-2 text-sm shadow-lg">{note}</span> : null}
      </div>
    </Ctx.Provider>
  );
}

export function useSchole(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useSchole needs ScholeStore (src/app/schole/layout.tsx)");
  return s;
}

/** The seven days of this week, Monday first, and whether each was a study day. */
export function weekOf(days: string[]): { day: string; label: string; on: boolean; isToday: boolean }[] {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const day = d.toISOString().slice(0, 10);
    return { day, label: "MTWTFSS"[i]!, on: days.includes(day), isToday: day === today() };
  });
}
