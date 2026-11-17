import { notFound, redirect } from "next/navigation";
import { exemplarById, exemplarHref } from "@reflect/core/formation";

/** A person's page moved to Scholē, where the qualities they name can be kept (doc "Qualities design guide"). */
export default async function ExemplarPage({ params }: { params: Promise<{ id: string }> }) {
  const e = exemplarById((await params).id);
  if (!e) notFound();
  redirect(exemplarHref(e));
}
