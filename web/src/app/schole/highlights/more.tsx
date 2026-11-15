"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DownloadIcon, EllipsisIcon, NotebookPenIcon, UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { highlightsToJournalAction, importKindleAction } from "../actions";

/**
 * The page's lesser acts behind one More menu (the Scholē design guide): export as Markdown, send every highlight to
 * the journal as one work, and bring Kindle highlights in from My Clippings.txt (in a Kindle's documents folder).
 */
export function HighlightsMore() {
  const input = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState<string | null>(null);
  const [pending, run] = useTransition();
  const router = useRouter();
  const take = (file: File | undefined) => file && run(async () => {
    const r = await importKindleAction(await file.text());
    if ("error" in r) setNote(r.error);
    else {
      setNote([
        `Added ${r.added} ${r.added === 1 ? "highlight" : "highlights"} from ${r.books} ${r.books === 1 ? "book" : "books"}.`,
        r.already ? `${r.already} were already here.` : "",
        r.notFound.length ? `Not found in the open library: ${r.notFound.slice(0, 5).join("; ")}${r.notFound.length > 5 ? `, and ${r.notFound.length - 5} more` : ""}.` : "",
        r.overLimit ? `${r.overLimit} more were left out; import again to bring them in.` : "",
      ].filter(Boolean).join(" "));
      router.refresh();
    }
    if (input.current) input.current.value = "";
  });
  return (
    <>
      <input ref={input} type="file" accept=".txt,text/plain" hidden onChange={(e) => take(e.target.files?.[0])} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" aria-label="More" title="More" disabled={pending}><EllipsisIcon /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild><a href="/schole/highlights/export"><DownloadIcon />Export Markdown</a></DropdownMenuItem>
          <DropdownMenuItem onSelect={() => run(async () => router.push(`/journal/w/${await highlightsToJournalAction()}`))}><NotebookPenIcon />Send to journal</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => input.current?.click()}><UploadIcon />Import Kindle highlights</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {pending || note ? <p className="text-muted-foreground w-full text-xs" role="status">{pending ? "Working..." : note}</p> : null}
    </>
  );
}
