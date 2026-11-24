// A real business used to open here; it now opens in the business console.
import { redirect } from "next/navigation";

export default async function OldRealVenture({ params }: { params: Promise<{ id: string }> }) {
  redirect(`/studio/v/${(await params).id}`);
}
