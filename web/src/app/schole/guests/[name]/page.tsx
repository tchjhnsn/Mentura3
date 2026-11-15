import { redirect } from "next/navigation";

/** Guest pages became people's pages (Torian, 2026-11-15 16:47Z: a guest may host a show of their own). */
export default async function GuestPage({ params, searchParams }: { params: Promise<{ name: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(await searchParams)) if (typeof v === "string") q.set(k, v);
  redirect(`/schole/people/${(await params).name}${q.size ? `?${q}` : ""}`);
}
