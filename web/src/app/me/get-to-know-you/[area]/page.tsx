import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { areaOf, itemsIn } from "@reflect/core/interest-catalogue";
import { requireUser } from "@/server/session";
import { myAreas, myInterests } from "@/server/interests-store";
import { Pick } from "./pick";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Get to know you" };

/**
 * Pick, one area at a time (design guide "Get to know you: person dashboard", page 4): real books, shows or musicians;
 * each tap joins the live row at the foot and brings related things in beside it; at three, Done fills.
 */
export default async function PickPage({ params }: { params: Promise<{ area: string }> }) {
  const { area: id } = await params;
  const area = areaOf(id);
  if (!area) notFound();
  const user = await requireUser();
  const [mine, areas] = await Promise.all([myInterests(user.id), myAreas(user.id)]);
  const picked = mine.filter((i) => i.area === area.id).map((i) => i.ref);
  return <Pick area={area} items={itemsIn(area.id)} initial={picked} initialGenres={areas.genres} initialEras={areas.eras} />;
}
