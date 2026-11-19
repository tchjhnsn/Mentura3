import type { Metadata } from "next";
import { PAGE } from "@/components/page-header";
import { TaskHeader } from "@/components/headers";
import { requireUser } from "@/server/session";
import { myAnswers } from "@/server/crafts-store";
import { DiscoverFlow } from "./flow";

export const metadata: Metadata = { title: "Discover crafts" };
export const dynamic = "force-dynamic";

/**
 * Discover crafts (design guide, Discover): one activity at a time with three tap answers. The answers so far are
 * read here and the flow carries on from the first one not yet answered.
 */
export default async function DiscoverPage() {
  const user = await requireUser();
  const answers = await myAnswers(user.id);
  return (
    <main className={PAGE}>
      <TaskHeader back={{ href: "/schole", label: "Back to Scholē" }} title="Scholē" position="Discover crafts" />
      <DiscoverFlow initial={answers} />
    </main>
  );
}
