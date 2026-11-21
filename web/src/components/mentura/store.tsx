"use client";

// Mentura's prototype state, shared by every screen so a tap on one screen shows on the others: who you follow, what
// you liked, saved and reposted, your posts and replies, the events you are going to, what you have read, the messages
// you sent and the roles on your account. Kept in this browser only (localStorage, when it is there); nothing reaches a
// server yet. `say` shows a short note at the foot of the screen for actions whose result is elsewhere.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { EVENTS, ME, NOTES, personOf, type Post, type Role } from "./data";

type Reply = { by: string; when: string; text: string; likes: number };
type Sent = { from: string; text: string; when: string };
type State = {
  follows: string[]; likes: string[]; saved: string[]; reposts: string[];
  posts: Post[]; replies: Record<string, Reply[]>; going: string[]; read: string[];
  sent: Record<string, Sent[]>; answered: Record<string, "accepted" | "declined">; roles: Role[];
};

const KEY = "mentura-prototype-v1";
const START: State = {
  follows: ["maya", "dev", "lena"], likes: [], saved: [], reposts: [], posts: [], replies: {},
  going: EVENTS.filter((e) => e.going.includes(ME)).map((e) => e.id), read: NOTES.filter((n) => !n.unread).map((n) => n.id),
  sent: {}, answered: {}, roles: personOf(ME).roles,
};

type Store = State & {
  toggle: (list: "follows" | "likes" | "saved" | "reposts" | "going", id: string) => void;
  has: (list: "follows" | "likes" | "saved" | "reposts" | "going", id: string) => boolean;
  addPost: (text: string, kind: Post["kind"], tags?: string[]) => void;
  addReply: (postId: string, text: string) => void;
  markRead: (ids: string[]) => void;
  send: (convo: string, text: string) => void;
  answer: (convo: string, a: "accepted" | "declined") => void;
  setRoles: (r: Role[]) => void;
  reset: () => void;
  say: (text: string) => void;
};

const Ctx = createContext<Store | null>(null);

export function MenturaStore({ children }: { children: ReactNode }) {
  const [s, setS] = useState<State>(START);
  const [note, setNote] = useState<string | null>(null);
  const loaded = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setS({ ...START, ...(JSON.parse(raw) as Partial<State>) });
    } catch {
      // No storage: the prototype starts fresh on each visit.
    }
    loaded.current = true;
  }, []);
  useEffect(() => {
    if (!loaded.current) return;
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* no storage */ }
  }, [s]);

  const say = useCallback((text: string) => {
    setNote(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setNote(null), 2600);
  }, []);

  const store = useMemo<Store>(() => ({
    ...s,
    toggle: (list, id) => setS((x) => ({ ...x, [list]: x[list].includes(id) ? x[list].filter((v) => v !== id) : [...x[list], id] })),
    has: (list, id) => s[list].includes(id),
    addPost: (text, kind, tags = []) => setS((x) => ({ ...x, posts: [{ id: `mine-${Date.now()}`, by: ME, when: "now", kind, text, tags, likes: 0, replies: 0, reposts: 0 }, ...x.posts] })),
    addReply: (postId, text) => setS((x) => ({ ...x, replies: { ...x.replies, [postId]: [...(x.replies[postId] ?? []), { by: ME, when: "now", text, likes: 0 }] } })),
    markRead: (ids) => setS((x) => ({ ...x, read: [...new Set([...x.read, ...ids])] })),
    send: (convo, text) => setS((x) => ({ ...x, sent: { ...x.sent, [convo]: [...(x.sent[convo] ?? []), { from: ME, text, when: "now" }] } })),
    answer: (convo, a) => setS((x) => ({ ...x, answered: { ...x.answered, [convo]: a } })),
    setRoles: (roles) => setS((x) => ({ ...x, roles })),
    reset: () => setS(START),
    say,
  }), [s, say]);

  return (
    <Ctx.Provider value={store}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        {note ? <span className="bg-foreground text-background rounded-full px-4 py-2 text-sm shadow-lg">{note}</span> : null}
      </div>
    </Ctx.Provider>
  );
}

export function useMentura(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useMentura needs MenturaStore (src/app/mentura/layout.tsx)");
  return s;
}

/** All posts, yours first, as the feed and profiles show them. */
export function useAllPosts(base: Post[]): Post[] {
  const { posts } = useMentura();
  return [...posts, ...base];
}
