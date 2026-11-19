import type { Metadata } from "next";
import { doorOf } from "@reflect/core/crafts";
import { requireUser } from "@/server/session";
import { DoorPage } from "../door-page";

export const metadata: Metadata = { title: "Knowing" };
export const dynamic = "force-dynamic";

/** The Knowing door: science and wisdom, knowing what is so and why, for its own sake. */
export default async function KnowingPage() {
  await requireUser();
  return (
    <DoorPage
      door={doorOf("knowing")!}
      ways={[
        { href: "/schole/courses", label: "Courses", line: "Lectures and courses, examined by people." },
        { href: "/schole/topics", label: "Topics", line: "Subjects to learn, with what to read and watch on each." },
        { href: "/schole/philosophers", label: "Philosophers", line: "The thinkers and their works." },
        { href: "/schole/works", label: "Works", line: "The books and works you read and study." },
        { href: "/schole/terms", label: "Terms", line: "Words and the meanings you have learned." },
      ]}
    />
  );
}
