import { redirect } from "next/navigation";

/** What drew you was the 32-question flow's result; the photo picker's matches replace it. */
export default function DrewPage() {
  redirect("/schole/discover/matches");
}
