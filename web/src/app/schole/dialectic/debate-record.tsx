import type { DebateRecord } from "@reflect/core/dialectic-media";

const names = (xs: readonly string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}` : xs[0] ?? "");

/**
 * What a debate argued, who spoke on each side, and how it ended, with where that was checked: lines in a watch
 * page's description box, whose bold first line is `whenWhere`.
 */
export function DebateFacts({ r }: { r: DebateRecord }) {
  const yes = r.form === "motion" ? "For the motion" : "Yes";
  const no = r.form === "motion" ? "Against" : "No";
  return (
    <div className="space-y-1.5">
      <p><span className="text-muted-foreground">{r.form === "motion" ? "Motion" : "Question"}:</span> <span className="font-medium">{r.form === "motion" ? <>&ldquo;{r.motion}&rdquo;</> : r.motion}</span></p>
      {r.for?.length && r.against?.length ? (
        <>
          <p><span className="text-muted-foreground">{yes}:</span> {names(r.for)}</p>
          <p><span className="text-muted-foreground">{no}:</span> {names(r.against)}</p>
        </>
      ) : r.speakers?.length ? <p><span className="text-muted-foreground">With:</span> {names(r.speakers)}</p> : null}
      {r.result ? <p><span className="text-muted-foreground">Result:</span> <span className="font-medium">{r.result}</span></p> : null}
      <p className="text-muted-foreground">Source: <a href={r.source.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">{r.source.label}</a></p>
    </div>
  );
}

/** When and where a debate took place, for the description box's bold first line. */
export const whenWhere = (r: DebateRecord) => `${r.when} · ${r.where}`;
