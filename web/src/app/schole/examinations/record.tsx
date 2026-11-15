import type { Examination } from "@/server/examination-store";

const day = (iso: string) => new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

/** What a person put themselves under examination on, and each examiner's attestation as written. */
export function ExamRecord({ e, me, hideOthers = false }: { e: Examination; me?: string; /** An examiner who has not attested yet does not see what the others wrote. */ hideOthers?: boolean }) {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-base font-semibold">What {me === e.candidate ? "you answer" : `${e.name} answers`} for</h2>
        <blockquote className="border-foreground/30 max-w-prose border-l-2 pl-4 font-serif text-lg leading-relaxed whitespace-pre-wrap">{e.claim}</blockquote>
        <p className="text-muted-foreground text-[13px]">From {e.courseTitle} · put under examination {day(e.createdAt)}{e.closedAt ? ` · closed ${day(e.closedAt)}` : ""}</p>
      </section>
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Examiners</h2>
        {e.examiners.length ? (
          <ul className="space-y-5">
            {e.examiners.map((x) => (
              <li key={x.userId} className="flex gap-3 text-sm">
                <span aria-hidden className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-medium">{x.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}</span>
                <div className="min-w-0 space-y-1">
                <p className="font-medium">{x.name}{x.userId === me ? " (you)" : ""}</p>
                {x.attestation && !(hideOthers && x.userId !== me) ? (
                  <>
                    <p className="text-muted-foreground">{x.attests ? "Attests that they know it" : "Does not attest yet"} · {day(x.attestedAt!)}</p>
                    <p className="leading-relaxed whitespace-pre-wrap">{x.attestation}</p>
                  </>
                ) : <p className="text-muted-foreground">{x.attestation ? "Has attested; you will see it once you have." : `Joined ${day(x.joinedAt)}; has not attested yet.`}</p>}
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="text-muted-foreground text-sm">Nobody has joined yet.</p>}
      </section>
    </div>
  );
}
