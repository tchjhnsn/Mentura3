"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, ExternalLinkIcon, FileTextIcon, Trash2Icon, UploadIcon } from "lucide-react";
import type { ExperienceIn, LinkedinFiles } from "@reflect/core/profile";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { keepLinkedinAction, previewLinkedinAction, removeLinkedinConnectionsFromPage, type Preview } from "./actions";
import { readUpload } from "./files";

const EXPORT_PAGE = "https://www.linkedin.com/mypreferences/d/download-my-data";
const CARD = "bg-card grid gap-3 rounded-2xl border p-4";
const HEAD = "text-muted-foreground px-4 text-sm";

const years = (e: ExperienceIn) => [e.starts, e.ends ?? (e.kind === "position" && e.starts ? "now" : null)].filter(Boolean).join(" to ");

/** One position or school with its tick: the role (or school) semibold, the rest muted. */
function Pick({ e, on, toggle }: { e: ExperienceIn; on: boolean; toggle: () => void }) {
  const main = e.kind === "position" ? (e.title ?? e.organisation) : e.organisation;
  const rest = [e.kind === "position" && e.title ? e.organisation : e.title, years(e)].filter(Boolean).join(" · ");
  return (
    <li>
      <label className="hover:bg-accent flex min-h-14 cursor-pointer items-center gap-3 px-4 py-3 transition">
        <input type="checkbox" checked={on} onChange={toggle} className="accent-primary size-5 shrink-0" />
        <span className="grid min-w-0 flex-1">
          <span className="truncate font-semibold">{main}</span>
          {rest ? <span className="text-muted-foreground truncate text-sm">{rest}</span> : null}
        </span>
      </label>
    </li>
  );
}

const all = (n: number) => new Set(Array.from({ length: n }, (_, i) => i));

/** Steps 1 to 3: get the export, upload it (unzipped here; only LinkedIn's five files are sent), keep what is ticked. */
export function LinkedinImport() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<LinkedinFiles | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [positions, setPositions] = useState<Set<number>>(new Set());
  const [schools, setSchools] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const [pending, start] = useTransition();

  const choose = async (list: FileList | null) => {
    if (!list?.length) return;
    setError(null);
    setPreview(null);
    setDone(null);
    try {
      const found = await readUpload([...list]);
      if (!Object.keys(found).length) {
        setFiles(null);
        setError("None of LinkedIn's files were in that. Choose the zip LinkedIn sent, or its CSV files.");
      } else setFiles(found);
    } catch {
      setFiles(null);
      setError("That file could not be opened. Choose the zip LinkedIn sent, or its CSV files.");
    }
  };

  const upload = () =>
    files &&
    start(async () => {
      const r = await previewLinkedinAction(files);
      if ("error" in r) return setError(r.error);
      setPreview(r.preview);
      setPositions(all(r.preview.positions.length));
      setSchools(all(r.preview.schools.length));
    });

  const keep = () =>
    files &&
    start(async () => {
      const r = await keepLinkedinAction(files, { positions: [...positions], schools: [...schools] });
      if ("error" in r) return setError(r.error);
      setDone(`Kept. ${r.added} added to Experience${r.connections ? `, ${r.connections.toLocaleString("en-US")} connections kept private` : ""}.`);
      setFiles(null);
      setPreview(null);
      router.refresh();
    });

  const flip = (set: Set<number>, put: (s: Set<number>) => void, i: number) => {
    const next = new Set(set);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    put(next);
  };

  return (
    <>
      <section aria-labelledby="get" className="grid gap-2">
        <h2 id="get" className={HEAD}>1. Get your export</h2>
        <div className={CARD}>
          <p className="text-sm">On LinkedIn, choose the larger archive, or tick at least Connections, Positions, Education, Skills and Profile, then request it.</p>
          <p className="text-muted-foreground text-xs">LinkedIn emails a link: most files within 10 minutes, connections within 48 hours.</p>
          <Button asChild variant="outline" className="justify-self-start">
            <a href={EXPORT_PAGE} target="_blank" rel="noopener noreferrer"><ExternalLinkIcon />Open LinkedIn</a>
          </Button>
        </div>
      </section>

      <section aria-labelledby="upload" className="grid gap-2">
        <h2 id="upload" className={HEAD}>2. Upload</h2>
        <div className={CARD}>
          {files && !preview ? (
            <>
              <ul className="grid gap-1.5">
                {Object.keys(files).map((f) => <li key={f} className="flex items-center gap-2 text-sm"><FileTextIcon className="text-muted-foreground size-4" />{f}</li>)}
              </ul>
              <p className="text-muted-foreground text-xs">Only these files are sent, and only when you tap Upload. Nothing is kept until you tap Keep.</p>
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={upload} disabled={pending}><UploadIcon />{pending ? "Reading" : "Upload"}</Button>
                <Button variant="ghost" onClick={() => input.current?.click()} disabled={pending}>Choose other files</Button>
              </div>
            </>
          ) : (
            <label
              htmlFor="linkedin-files"
              onDragOver={(e) => { e.preventDefault(); setOver(true); }}
              onDragLeave={() => setOver(false)}
              onDrop={(e) => { e.preventDefault(); setOver(false); void choose(e.dataTransfer.files); }}
              className={cn("hover:bg-accent grid cursor-pointer justify-items-center gap-1 rounded-xl border border-dashed px-4 py-8 text-center transition", over && "bg-accent border-primary")}
            >
              <UploadIcon className="text-muted-foreground size-6" />
              <span className="text-sm font-medium">{preview ? "Choose other files" : "Drop the zip LinkedIn sent, or choose it"}</span>
              <span className="text-muted-foreground text-xs">The zip, or its CSV files. Opened on this device; only LinkedIn&apos;s five files are sent.</span>
            </label>
          )}
          <input ref={input} id="linkedin-files" type="file" multiple accept=".zip,.csv,application/zip,text/csv" className="sr-only" aria-label="Choose LinkedIn export files" onChange={(e) => { void choose(e.target.files); e.target.value = ""; }} />
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          {done ? <p className="flex items-center gap-1.5 text-sm"><CheckIcon className="size-4" />{done}</p> : null}
        </div>
      </section>

      <section aria-labelledby="keep" className="grid gap-2">
        <h2 id="keep" className={HEAD}>3. Keep</h2>
        {preview ? (
          <div className="grid gap-4">
            {preview.positions.length ? (
              <div className="grid gap-1.5">
                <h3 className={HEAD}>Positions</h3>
                <ul className="bg-card divide-y overflow-hidden rounded-2xl border">
                  {preview.positions.map((e, i) => <Pick key={i} e={e} on={positions.has(i)} toggle={() => flip(positions, setPositions, i)} />)}
                </ul>
              </div>
            ) : null}
            {preview.schools.length ? (
              <div className="grid gap-1.5">
                <h3 className={HEAD}>Schools</h3>
                <ul className="bg-card divide-y overflow-hidden rounded-2xl border">
                  {preview.schools.map((e, i) => <Pick key={i} e={e} on={schools.has(i)} toggle={() => flip(schools, setSchools, i)} />)}
                </ul>
              </div>
            ) : null}
            {preview.skills.length ? (
              <div className="grid gap-1.5">
                <h3 className={HEAD}>Skills from LinkedIn</h3>
                <ul className="flex flex-wrap gap-1.5 px-4">
                  {preview.skills.map((s) => <li key={s} className="bg-muted rounded-full px-2.5 py-1 text-xs">{s}</li>)}
                </ul>
                <p className="text-muted-foreground px-4 text-xs">Listed here only; skills are not kept.</p>
              </div>
            ) : null}
            <p className="px-4 text-sm">{preview.connections ? `${preview.connections.toLocaleString("en-US")} ${preview.connections === 1 ? "connection" : "connections"}, kept private` : "No connections in this upload"}</p>
            <Button onClick={keep} disabled={pending} className="justify-self-start">{pending ? "Keeping" : "Keep"}</Button>
          </div>
        ) : (
          <p className="text-muted-foreground px-4 text-sm">After you upload, tick the positions and schools to keep.</p>
        )}
      </section>
    </>
  );
}

/** Remove your LinkedIn connections: a muted row that asks for a second tap. */
export function RemoveConnections({ count }: { count: string }) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [pending, start] = useTransition();
  const tap = () => {
    if (!armed) return setArmed(true);
    start(async () => {
      await removeLinkedinConnectionsFromPage();
      setArmed(false);
      router.refresh();
    });
  };
  return (
    <ul className="bg-card overflow-hidden rounded-2xl border">
      <li>
        <button type="button" onClick={tap} onBlur={() => setArmed(false)} disabled={pending} className="text-destructive hover:bg-accent flex min-h-14 w-full items-center gap-4 px-4 py-3 text-left transition">
          <Trash2Icon className="size-5 shrink-0" />
          <span className="text-base">{armed ? `Tap again to remove ${count}` : "Remove your LinkedIn connections"}</span>
        </button>
      </li>
    </ul>
  );
}
