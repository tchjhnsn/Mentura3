"use client";

import { useMemo, useState } from "react";
import { ExternalLinkIcon, SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

export type SearchQuestion = { id: string; question: string; answer: string };
export type SearchAsset = { id: string; name: string; url: string | null; notes: string };

const words = (s: string) => s.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);

/** Whether every typed word starts a word of the text ("fund use" finds "Use of funds"). */
export function matches(query: string, text: string): boolean {
  const want = words(query);
  if (!want.length) return false;
  const have = words(text);
  return want.every((w) => have.some((h) => h.startsWith(w)));
}

/**
 * The prep panel's search: the host types two words and sees the matching answers and asset links, during the call.
 * Filters in the browser over what the server already sent; nothing is fetched.
 */
export function PrepSearch({ questions, assets }: { questions: SearchQuestion[]; assets: SearchAsset[] }) {
  const [q, setQ] = useState("");
  const found = useMemo(() => ({
    questions: questions.filter((x) => matches(q, `${x.question} ${x.answer}`)).slice(0, 5),
    assets: assets.filter((x) => matches(q, `${x.name} ${x.notes}`)).slice(0, 5),
  }), [q, questions, assets]);
  const typed = q.trim().length > 0;
  const none = typed && !found.questions.length && !found.assets.length;

  return (
    <div className="grid gap-2">
      <div className="relative">
        <SearchIcon aria-hidden className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find an answer or asset" aria-label="Find an answer or asset in your prep" className="pl-8" />
      </div>
      {none ? <p className="text-muted-foreground text-sm">Nothing in your prep matches.</p> : null}
      {typed && (found.questions.length || found.assets.length) ? (
        <ul className="grid gap-2" aria-live="polite">
          {found.assets.map((a) => (
            <li key={a.id} className="text-sm">
              {a.url ? <a href={a.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium underline underline-offset-2">{a.name}<ExternalLinkIcon className="size-3.5" /></a> : <span className="font-medium">{a.name}</span>}
              {a.notes ? <p className="text-muted-foreground whitespace-pre-line">{a.notes}</p> : null}
            </li>
          ))}
          {found.questions.map((x) => (
            <li key={x.id} className="text-sm">
              <p className="font-medium">{x.question}</p>
              <p className="text-muted-foreground whitespace-pre-line">{x.answer || "No answer yet."}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
