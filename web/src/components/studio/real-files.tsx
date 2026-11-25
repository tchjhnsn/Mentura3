"use client";

// Files: a venture's own storage (venture console spec, 2026-11-24, phase 2), the first universal tool. The founder
// uploads, opens folders, downloads, renames and deletes; every change is a person's act in Naive's provenance log.
// Listing and changes go through src/app/studio/actions.ts; bytes go through src/app/studio/r/[id]/files/raw/route.ts (with ?team=).
import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import { ChevronRightIcon, DownloadIcon, FileIcon, FolderIcon, FolderPlusIcon, Loader2Icon, MoreHorizontalIcon, PencilIcon, Trash2Icon, UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { deleteFile, moveFile, newFolder, ventureFiles, type StoredFile } from "@/app/studio/actions";
import { useTeam, useTeamSlug } from "./team";

const size = (n: number) => (n < 1024 ? `${n} B` : n < 1024 ** 2 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1024 ** 2).toFixed(1)} MB`);
const when = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

/** The children of the folder at `path` ("" is the top). */
function at(tree: StoredFile[], path: string): StoredFile[] | null {
  if (!path) return tree;
  let level = tree;
  for (const part of path.split("/")) {
    const next = level.find((f) => f.kind === "folder" && f.name === part);
    if (!next) return null;
    level = next.children ?? [];
  }
  return level;
}

type Ask = { kind: "folder" } | { kind: "rename"; file: StoredFile } | { kind: "delete"; file: StoredFile } | null;

/** V2 Files for a real business, inside the console at /studio/<team>/<id>/files. */
export function RealFiles({ id }: { id: string }) {
  const team = useTeamSlug() ?? "";
  // A Viewer reads and downloads; the server refuses their changes (src/server/naive.ts), so no change control shows.
  const viewer = useTeam()?.role === "viewer";
  const raw = (q = "") => `/studio/r/${encodeURIComponent(id)}/files/raw?team=${encodeURIComponent(team)}${q}`;
  const [tree, setTree] = useState<StoredFile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [folder, setFolder] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [ask, setAsk] = useState<Ask>(null);
  const [text, setText] = useState("");
  const [over, setOver] = useState(false);
  const picker = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const r = await ventureFiles(id, team);
    if (r.ok) { setTree(r.value.files); setError(null); } else setError(r.error);
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const upload = async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      setBusy(`Uploading ${file.name}`);
      const body = new FormData();
      body.set("file", file);
      body.set("folder", folder);
      const res = await fetch(raw(), { method: "POST", body });
      if (!res.ok) { setError(`${file.name}: ${await res.text()}`); break; }
    }
    setBusy(null);
    await load();
  };

  const act = async (label: string, f: () => Promise<{ ok: boolean; error?: string }>) => {
    setBusy(label);
    const r = await f();
    setBusy(null);
    setAsk(null);
    if (!r.ok) setError(r.error ?? "Naive refused this.");
    await load();
  };

  const confirm = () => {
    if (!ask) return;
    const joined = (n: string) => (folder ? `${folder}/${n}` : n);
    if (ask.kind === "folder") void act("Making the folder", () => newFolder(id, joined(text.trim()), team));
    if (ask.kind === "rename") void act("Renaming", () => moveFile(id, ask.file.path, joined(text.trim()), team));
    if (ask.kind === "delete") void act("Deleting", () => deleteFile(id, ask.file.path, team));
  };

  const drop = (e: DragEvent) => { e.preventDefault(); setOver(false); if (!viewer && e.dataTransfer.files.length) void upload(e.dataTransfer.files); };
  const items = tree ? at(tree, folder) : null;
  const crumbs = folder ? folder.split("/") : [];

  return (
    <div className="mx-auto max-w-4xl px-4 pt-6 pb-16 md:px-8" onDragOver={(e) => { e.preventDefault(); setOver(!viewer); }} onDragLeave={() => setOver(false)} onDrop={drop}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Files</h1>
          <p className="text-muted-foreground mt-1 text-sm">This business&apos;s own storage. Only you can open it, and every change is logged.</p>
        </div>
        {viewer ? null : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setText(""); setAsk({ kind: "folder" }); }} disabled={!!busy || !tree}><FolderPlusIcon />New folder</Button>
            <Button onClick={() => picker.current?.click()} disabled={!!busy || !tree}><UploadIcon />Upload</Button>
            <input ref={picker} type="file" multiple hidden onChange={(e) => { if (e.target.files?.length) void upload(e.target.files); e.target.value = ""; }} />
          </div>
        )}
      </div>

      <nav aria-label="Folder" className="mt-6 flex flex-wrap items-center gap-1 text-sm">
        <button type="button" onClick={() => setFolder("")} className={cn("hover:bg-accent rounded px-1.5 py-0.5", !folder && "font-medium")}>Files</button>
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1">
            <ChevronRightIcon className="text-muted-foreground size-3.5" />
            <button type="button" onClick={() => setFolder(crumbs.slice(0, i + 1).join("/"))} className={cn("hover:bg-accent rounded px-1.5 py-0.5", i === crumbs.length - 1 && "font-medium")}>{c}</button>
          </span>
        ))}
      </nav>

      {error ? <p role="alert" className="text-destructive mt-3 text-sm">{error}</p> : null}
      {busy ? <p aria-live="polite" className="text-muted-foreground mt-3 flex items-center gap-2 text-sm"><Loader2Icon className="size-4 animate-spin" />{busy}</p> : null}

      <div className={cn("mt-3 overflow-hidden rounded-xl border", over && "border-foreground bg-accent/40")}>
        {tree === null && !error ? (
          <p className="text-muted-foreground p-6 text-sm">Reading the business&apos;s files</p>
        ) : !items || items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-10 text-center">
            <UploadIcon className="text-muted-foreground size-6" />
            <p className="text-sm font-medium">{folder ? "This folder is empty" : "No files yet"}</p>
            {viewer ? <p className="text-muted-foreground max-w-sm text-sm">A Viewer can open and download this business&apos;s files, but cannot add any.</p> : <>
              <p className="text-muted-foreground max-w-sm text-sm">Drop files here, or upload decks, contracts, receipts and anything else the business keeps. Up to 20 MB each.</p>
              <Button size="sm" onClick={() => picker.current?.click()} disabled={!!busy || !tree}><UploadIcon />Upload a file</Button>
            </>}
          </div>
        ) : (
          <ul>
            {items.map((f) => (
              <li key={f.path} className="hover:bg-accent/50 flex items-center gap-3 border-b px-4 py-2.5 text-sm last:border-b-0">
                {f.kind === "folder" ? <FolderIcon className="size-4 shrink-0" /> : <FileIcon className="text-muted-foreground size-4 shrink-0" />}
                {f.kind === "folder" ? (
                  <button type="button" onClick={() => setFolder(f.path)} className="min-w-0 flex-1 truncate text-left font-medium hover:underline">{f.name}</button>
                ) : (
                  <a href={raw(`&path=${encodeURIComponent(f.path)}`)} className="min-w-0 flex-1 truncate hover:underline">{f.name}</a>
                )}
                <span className="text-muted-foreground hidden w-20 text-right tabular-nums sm:block">{f.kind === "file" ? size(f.size) : `${f.children?.length ?? 0} items`}</span>
                <span className="text-muted-foreground hidden w-28 text-right md:block">{when(f.modified)}</span>
                {viewer && f.kind === "folder" ? <span className="size-8" aria-hidden /> : <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-8" aria-label={`More for ${f.name}`}><MoreHorizontalIcon /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {f.kind === "file" ? <DropdownMenuItem asChild><a href={raw(`&path=${encodeURIComponent(f.path)}`)}><DownloadIcon />Download</a></DropdownMenuItem> : null}
                    {viewer ? null : <>
                      <DropdownMenuItem onSelect={() => { setText(f.name); setAsk({ kind: "rename", file: f }); }}><PencilIcon />Rename</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onSelect={() => setAsk({ kind: "delete", file: f })}><Trash2Icon />Delete</DropdownMenuItem>
                    </>}
                  </DropdownMenuContent>
                </DropdownMenu>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={ask !== null} onOpenChange={(o) => { if (!o) setAsk(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{ask?.kind === "folder" ? "New folder" : ask?.kind === "rename" ? `Rename ${ask.file.name}` : ask?.kind === "delete" ? `Delete ${ask.file.name}?` : ""}</DialogTitle>
            <DialogDescription>{ask?.kind === "delete" ? (ask.file.kind === "folder" ? "The folder and everything in it leave the business. The log keeps a record of each file." : "The file leaves the business. The log keeps a record of it.") : "A name without a slash or a leading dot."}</DialogDescription>
          </DialogHeader>
          {ask?.kind !== "delete" ? <Input autoFocus value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && text.trim()) confirm(); }} aria-label="Name" /> : null}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAsk(null)}>Cancel</Button>
            <Button variant={ask?.kind === "delete" ? "destructive" : "default"} disabled={ask?.kind !== "delete" && !text.trim()} onClick={confirm}>{ask?.kind === "delete" ? "Delete" : ask?.kind === "rename" ? "Rename" : "Make folder"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
