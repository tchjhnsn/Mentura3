import Link from "next/link";
import { exemplarById, exemplarHref, ROLES } from "@reflect/core/formation";
import { personNamed } from "@reflect/core/historical-people";
import { SectionHead } from "@/components/section-head";
import { facesOf } from "@/server/topics";
import { CoverImg } from "../cover-img";

const initials = (name: string) => name.split(/\s+/).filter((w) => /^[A-Z]/.test(w)).map((w) => w[0]).slice(0, 2).join("");

/**
 * Lives (doc "Qualities design guide"): the broad roles as rows of people who did them well, each opening their page,
 * where the qualities they name in their own words can be kept. A role is a way in, not something to hold.
 */
export async function Lives() {
  const names = [...new Set(ROLES.flatMap((r) => r.exemplars))].map((x) => exemplarById(x)!.name);
  const faces = new Map((await facesOf(names.map((name) => ({ name, wiki: personNamed(name)?.wiki ?? name.replace(/ /g, "_") })))).map((f) => [f.name, f.image]));
  return (
    <section id="lives" className="scroll-mt-20 space-y-4">
      <SectionHead title="Lives" note="People who did a kind of life well, in their own words. Their pages name the qualities they practised." />
      {ROLES.map((r) => (
        <div key={r.id} id={`lives-${r.id}`} className="scroll-mt-20 space-y-2">
          <h3 className="text-sm font-medium">{r.plural}</h3>
          <ul className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-1">
            {r.exemplars.map((x) => {
              const e = exemplarById(x)!;
              return (
                <li key={x} className="w-24 shrink-0 snap-start">
                  <Link href={exemplarHref(e)} className="group grid justify-items-center gap-1.5 text-center">
                    <span aria-hidden className="bg-muted group-hover:bg-accent relative flex size-16 items-center justify-center overflow-hidden rounded-full border text-base font-semibold">
                      {initials(e.name)}
                      {faces.get(e.name) ? <CoverImg src={faces.get(e.name)!} className="absolute inset-0 size-full object-cover object-top" /> : null}
                    </span>
                    <span className="text-xs leading-tight">{e.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}
