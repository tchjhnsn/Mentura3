// A real business's Files used to open here; they now open in the business console. ./raw stays: it carries the bytes.
import { redirect } from "next/navigation";

export default async function OldRealFiles({ params }: { params: Promise<{ id: string }> }) {
  redirect(`/studio/v/${(await params).id}/files`);
}
