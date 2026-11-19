import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { myInterests } from "@/server/interests-store";
import { Sort, type SortCard } from "./sort";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Make, Do, Know" };

/**
 * Sort into Make, Do, Know (design guide "Get to know you: person dashboard", page 5, on the levels in
 * `@reflect/core/interests`): the picks already placed by a first guess; move one and set its commitment, and its
 * skill (Make, Do) or depth (Know).
 */
export default async function SortPage({ searchParams }: { searchParams: Promise<{ focus?: string }> }) {
  const { focus } = await searchParams;
  const user = await requireUser();
  const cards: SortCard[] = (await myInterests(user.id)).map((i) => ({
    ref: i.ref, title: i.title, image: i.item?.image ?? null, round: i.area === "music", modes: i.modes,
    make: { commitment: i.make?.commitment ?? null, skill: i.make?.skill ?? null },
    do: { commitment: i.do?.commitment ?? null, skill: i.do?.skill ?? null },
    know: { commitment: i.know?.commitment ?? null, depth: i.know?.depth ?? null },
  }));
  return <Sort cards={cards} focus={focus ?? null} />;
}
