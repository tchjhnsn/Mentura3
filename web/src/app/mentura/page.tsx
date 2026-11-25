import { redirect } from "next/navigation";

// Mentura's social feed was archived on 2026-11-21 and still showed made-up people (doc "Mentura console: screens,
// navigation and teams", 2026-11-25). /mentura opens the business console; the feed is kept, unrouted, in ./home-feed.tsx.
export default function MenturaHome() {
  redirect("/studio");
}
