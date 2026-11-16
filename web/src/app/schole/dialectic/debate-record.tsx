import Link from "next/link";
import type { DebateRecord } from "@reflect/core/dialectic-media";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { keepVerdictAction } from "./verdict-actions";

const names = (xs: readonly string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}` : xs[0] ?? "");

/** What a debate argued, who spoke on each side, and how it ended, with where that was checked. */
export function DebateFacts({ r }: { r: DebateRecord }) {
  return (
    <div className="space-y-3">
      <p className="text-lg leading-snug font-semibold tracking-tight">{r.form === "motion" ? <>&ldquo;{r.motion}&rdquo;</> : r.motion}</p>
      <p className="text-muted-foreground text-sm">{r.when} · {r.where}</p>
      {r.for?.length && r.against?.length ? (
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg border p-3"><dt className="text-muted-foreground text-xs">{r.form === "motion" ? "For the motion" : "Yes"}</dt><dd className="mt-0.5 font-medium">{names(r.for)}</dd></div>
          <div className="rounded-lg border p-3"><dt className="text-muted-foreground text-xs">{r.form === "motion" ? "Against" : "No"}</dt><dd className="mt-0.5 font-medium">{names(r.against)}</dd></div>
        </dl>
      ) : r.speakers?.length ? <p className="text-sm">With <span className="font-medium">{names(r.speakers)}</span></p> : null}
      {r.result ? <p className="text-sm"><span className="text-muted-foreground">Result:</span> <span className="font-medium">{r.result}</span></p> : null}
      <p className="text-muted-foreground text-xs">From <a href={r.source.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">{r.source.label}</a>.</p>
    </div>
  );
}

/** The sides a person can say won them over, from the record when it has them. */
function sidesOf(r: DebateRecord | null): string[] {
  if (r?.for?.length && r.against?.length) {
    const yes = r.form === "motion" ? "For the motion" : "Yes";
    const no = r.form === "motion" ? "Against" : "No";
    return [`${yes} (${names(r.for)})`, `${no} (${names(r.against)})`, "Neither"];
  }
  if (r?.speakers?.length) return [...r.speakers, "Neither"];
  return [];
}

/**
 * Your verdict: which side won you over and why, kept as a private note in your journal. Once kept, a line says so
 * and opens the note.
 */
export function Verdict({ title, url, record, back, kept }: { title: string; url: string; record: DebateRecord | null; back: string; kept?: string }) {
  const sides = sidesOf(record);
  return (
    <form action={keepVerdictAction} className="space-y-3" id="verdict">
      <input type="hidden" name="title" value={title} /><input type="hidden" name="url" value={url} /><input type="hidden" name="back" value={back} />
      {sides.length ? (
        <fieldset className="space-y-1.5">
          <legend className="mb-1.5 text-sm font-medium">Who won you over?</legend>
          {sides.map((s) => (
            <label key={s} className="hover:bg-muted/50 flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm">
              <input type="radio" name="side" value={s} className="accent-foreground size-4" />{s}
            </label>
          ))}
        </fieldset>
      ) : null}
      <label className="block space-y-1.5 text-sm font-medium">
        {sides.length ? "Why" : "Where you stand after it, and why"}
        <Textarea name="why" rows={3} maxLength={5000} placeholder="The argument that moved you, or the one that didn't land" />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="outline" size="sm">Keep in your journal</Button>
        {kept ? <span className="text-sm">Kept. <Link href={`/journal/w/${kept}`} className="underline underline-offset-4">Open the note</Link></span> : <span className="text-muted-foreground text-xs">Only you see it, in your Notes.</span>}
      </div>
    </form>
  );
}
