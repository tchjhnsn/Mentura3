import Link from "next/link";
import { LockIcon } from "lucide-react";
import { rehearsedCount } from "@reflect/core/meetings";
import { prepOf } from "@/server/meetings-store";
import { PrepSearch } from "./prep-search";

/**
 * The host's prep, compact, for the meeting and call pages (design guide, Meeting prep): the key points, then a search
 * box over the questions, answers and assets, so two typed words bring up the answer and the asset link during the
 * call. Private: only render it for the host. `hostId` must be the signed-in person; prepOf refuses anyone who does
 * not host the meeting, and the panel then renders nothing.
 */
export async function PrepPanel({ meetingId, hostId }: { meetingId: string; hostId: string }) {
  const prep = await prepOf(hostId, meetingId).catch(() => null);
  if (!prep) return null;
  const { done, of } = rehearsedCount(prep);
  const href = `/meetings/${meetingId}/prep`;
  const blank = !prep.keyPoints.length && !prep.questions.length && !prep.assets.length;

  return (
    <section aria-labelledby="prep-panel-title" className="grid gap-3 rounded-xl border p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="prep-panel-title" className="flex items-center gap-1.5 text-base font-semibold">Your prep<LockIcon aria-label="Only you see this" className="text-muted-foreground size-3.5" /></h2>
        <Link href={href} className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-2">{blank ? "Prepare" : "Open"}</Link>
      </div>
      {blank ? (
        <p className="text-muted-foreground text-sm">No prep yet. Write your key points, answers and assets before the call.</p>
      ) : (
        <>
          {prep.keyPoints.length ? (
            <ol className="grid gap-1.5">
              {prep.keyPoints.map((p, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span aria-hidden className="text-muted-foreground w-4 shrink-0 font-semibold tabular-nums">{i + 1}</span>
                  <span className="min-w-0 break-words">{p}</span>
                </li>
              ))}
            </ol>
          ) : null}
          {prep.questions.length || prep.assets.length ? (
            <PrepSearch
              questions={prep.questions.map(({ id, question, answer }) => ({ id, question, answer }))}
              assets={prep.assets}
            />
          ) : null}
          {of ? <p className="text-muted-foreground text-xs">{done} of {of} rehearsed</p> : null}
        </>
      )}
    </section>
  );
}
