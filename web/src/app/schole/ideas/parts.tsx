import Link from "next/link";
import { DOMAINS } from "@reflect/core/book";
import { articleSlug } from "@reflect/core/articles";
import { cite } from "@reflect/core/historical-people";
import type { IdeaPassage } from "@reflect/core/great-ideas";
import type { Passage } from "@reflect/core/historical";
import { workById } from "@reflect/core/topic-pages";
import { Button } from "@/components/ui/button";
import { writePromptAction } from "./actions";

/** A citation that opens the work it is in, when Scholē has a page for it. */
export function Cite({ a }: { a: Passage }) {
  const text = `${cite(a)}${a.tr ? `, tr. ${a.tr}` : ""}`;
  return workById(a.work)
    ? <Link href={`/schole/works/${a.work}`} className="text-muted-foreground text-[13px] underline-offset-4 hover:underline">{text}</Link>
    : <span className="text-muted-foreground text-[13px]">{text}</span>;
}

/** Passages grouped by era, earliest first, each with its quote when one is checked. */
export function Passages({ passages }: { passages: readonly IdeaPassage[] }) {
  const eras = [...new Set(passages.map((x) => x.era))];
  return (
    <div className="space-y-6">
      {eras.map((era) => (
        <section key={era} className="space-y-2">
          <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{era}</h3>
          <ul className="divide-y">
            {passages.filter((x) => x.era === era).map((x) => (
              <li key={`${x.at.work}${x.at.at}`} className="space-y-1 py-3">
                <p className="font-medium">{x.what} <span className="text-muted-foreground text-sm font-normal">{x.by}</span></p>
                {x.at.words ? <blockquote className="border-l-2 pl-3 text-[15px] leading-relaxed">&ldquo;{x.at.words}&rdquo;</blockquote> : null}
                <Cite a={x.at} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** Articles read inside Scholē, each with its one-line note. */
export function Articles({ articles, from }: { articles: readonly { title: string; note: string }[]; from: string }) {
  return (
    <ul className="divide-y">
      {articles.map((a) => (
        <li key={a.title} className="py-2.5">
          <Link href={`/schole/articles/${articleSlug(a.title)}?from=${from}`} className="group block">
            <span className="font-medium group-hover:underline group-hover:underline-offset-4">{a.title}</span>
            <span className="text-muted-foreground block text-sm">{a.note} Wikipedia, read in Scholē.</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** A prompt that opens a new journal entry, optionally filed under a part of life. */
export function JournalPrompt({ template, about, label, primary, domains }: { template: string; about: string; label: string; primary?: boolean; domains?: boolean }) {
  return (
    <form action={writePromptAction.bind(null, template, about)} className="flex flex-wrap items-center gap-2">
      {domains ? (
        <select name="domain" aria-label="Part of your life" defaultValue="" className="border-input bg-background h-9 rounded-md border px-2 text-sm">
          <option value="">Any part of life</option>
          {DOMAINS.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
        </select>
      ) : null}
      <Button type="submit" variant={primary ? "default" : "outline"} size={primary ? "default" : "sm"}>{label}</Button>
    </form>
  );
}
