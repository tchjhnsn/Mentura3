import type { Wanted } from "@/server/work-space";

// Shared by Work's workspace, its aim pages and Add an aim (doc "Work design guide").

const TYPE: Record<string, string> = { job: "Job", career: "Career", venture: "Venture", company: "Company", role: "Role", other: "Work" };
export const STATE: Record<string, string> = { drawn: "Drawn to it", exploring: "Exploring it", pursuing: "Pursuing it", "let-go": "Let go", imagined: "Imagined", forming: "Forming", real: "Real now" };

/** What kind of aim it is, in a word. */
export const kindLabel = (w: Pick<Wanted, "record" | "job">) => (w.record.kind === "imagined" ? "Imagined" : TYPE[String(w.record.body.type ?? "")] ?? (w.job ? "Job" : "Work"));

/** The ways to an aim (Work design guide, Add an aim; roles moved to Scholē's Lives, Qualities design guide). */
export const WAYS = [
  { href: "/life/work/browse", label: "Browse work", note: "Jobs that exist, existed or are forming" },
  { href: "/life/work?k=imagined", label: "Imagine work", note: "Work that does not exist yet" },
  { href: "/life/work/add#own", label: "Name your own", note: "A job, a career or a venture" },
] as const;
