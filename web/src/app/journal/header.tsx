import type { ReactNode } from "react";
import { PageHeader } from "@/components/page-header";
import { Segmented } from "@/components/segmented";

/** The journal's header: what you write, and the lenses beside it: the log of what you did, Legacy, what you will hand on, and Qualities, what you are building. */
export function JournalHeader({ on, children }: { on: "writing" | "log" | "qualities"; children?: ReactNode }) {
  return (
    <>
      <PageHeader back="/" backLabel="Home" title="Journal">{children}</PageHeader>
      <div className="mt-2">
        <Segmented label="Journal lenses" items={[{ label: "Writing", href: "/journal", on: on === "writing" }, { label: "Log", href: "/journal/log", on: on === "log" }, { label: "Legacy", href: "/life/legacy", on: false }, { label: "Qualities", href: "/journal/qualities", on: on === "qualities" }]} />
      </div>
    </>
  );
}
