import { redirect } from "next/navigation";

/** Collections are called playlists now (Torian, 2026-11-16 01:17Z). */
export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) { redirect(`/schole/playlists/${encodeURIComponent((await params).id)}`); }
