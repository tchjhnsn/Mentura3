import { SectionHead, type Add } from "@/components/section-head";
/** What every tile's workspace shares: its column and its section heads. */
export const SPACE = "grid grid-cols-[minmax(0,1fr)] gap-10";


/** A workspace section's head: its title (linked when it has a page), a + to add, and a note. */
export function Head({ title, note, href, add }: { title: string; note: string; href?: string; add?: Add }) {
  return <SectionHead title={title} note={note} href={href} add={add} />;
}
