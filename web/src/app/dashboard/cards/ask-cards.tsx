import { homeCardsToday } from "@/server/home-cards-store";
import { HomeCards } from "../../home-cards";
import { cardView } from "../../home-card-view";
import { safe, type Ctx } from "../parts";

/** The cards Ask Reflect placed on Home, here too; nothing when there are none. */
export async function AskCardsCard({ ctx }: { ctx: Ctx }) {
  // Streak and checklist cards are on the Habits card, with their taps.
  const cards = (await safe(homeCardsToday(ctx.userId, ctx.today), [])).filter((c) => c.content.kind !== "streak" && c.content.kind !== "checklist");
  if (!cards.length) return null;
  return (
    <section className="grid gap-3">
      <h2 className="text-lg font-semibold">From Ask Reflect</h2>
      <div className="-mt-6"><HomeCards cards={cards.map((c) => cardView(c, ctx.today))} /></div>
    </section>
  );
}
