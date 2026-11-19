import type { Metadata } from "next";
import { doorOf } from "@reflect/core/crafts";
import { requireUser } from "@/server/session";
import { DoorPage } from "../door-page";

export const metadata: Metadata = { title: "Doing" };
export const dynamic = "force-dynamic";

/** The Doing door: practical wisdom, learned by living well with others and weighing what to do. */
export default async function DoingPage() {
  await requireUser();
  return (
    <DoorPage
      door={doorOf("doing")!}
      ways={[
        { href: "/schole/qualities", label: "Qualities", line: "The virtues of character you are building, and the people who show them." },
        { href: "/schole/dialectic", label: "Dialectic", line: "Weigh a question with others, for and against." },
        { href: "/schole/ideas", label: "Ideas", line: "The ideas you keep and what you make of them." },
      ]}
    />
  );
}
