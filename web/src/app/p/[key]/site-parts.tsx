import Link from "next/link";
import { readingMinutes } from "@reflect/core/site";
import { cn } from "@/lib/utils";
import type { Post } from "@/server/site-store";

/** A post's date as people read it. */
export const postDay = (iso: string) => new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "America/Chicago" });

/** Posts as a list: the title (serif, the biggest thing in the row), then the date and minutes to read. */
export function WritingList({ posts, href, serif }: { posts: Post[]; href: string; serif?: boolean }) {
  return (
    <ul className="divide-y">
      {posts.map((p) => (
        <li key={p.id} className="py-3 first:pt-0">
          <Link href={`${href}/${p.slug}`} className={cn("block text-lg leading-snug font-semibold hover:underline", serif && "font-serif text-xl")}>{p.title}</Link>
          <p className="text-muted-foreground text-sm">{postDay(p.publishedAt)} · {readingMinutes(p.body)} min read</p>
        </li>
      ))}
    </ul>
  );
}

/** The foot of every page of the site: the feed and where it is made. */
export function SiteFooter({ href }: { href: string }) {
  return (
    <footer className="text-muted-foreground mt-16 flex items-center gap-4 border-t pt-4 text-xs">
      <a href={`${href}/feed.xml`} className="hover:text-foreground">RSS</a>
      <Link href="/" className="hover:text-foreground ml-auto">Made with Reflect</Link>
    </footer>
  );
}
