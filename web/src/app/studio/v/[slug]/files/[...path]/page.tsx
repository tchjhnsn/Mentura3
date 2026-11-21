"use client";

// V3 Document: read and edit one document with the agent beside it. Edits are held in this page only.
import Link from "next/link";
import { use, useState, type ReactNode } from "react";
import { BotIcon, BracesIcon, ChevronRightIcon, EyeIcon, HistoryIcon, PencilIcon, SparklesIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Face, Num } from "@/components/studio/bits";
import { ScreenHead, useChat } from "@/components/studio/shell";
import { recordOf } from "@/components/studio/records";
import { agentOf, ventureHref, ventureOf } from "@/components/studio/data";
import {
  COMMENTS, SHEET_ROWS, SUGGESTIONS, fileAt, fileName, isAgentId, mdBlocks, recordBody, titleOf, type Version,
} from "@/components/studio/files-data";

function Who({ id, size = 24 }: { id: string; size?: number }) {
  if (isAgentId(id)) {
    return (
      <span className="inline-flex min-w-0 items-center gap-2">
        <span className="bg-muted grid shrink-0 place-items-center rounded-full" style={{ width: size, height: size }}><BotIcon className="size-3.5" /></span>
        <span className="truncate text-sm font-medium">{agentOf(id).name}</span>
      </span>
    );
  }
  return <Face id={id} size={size} sub="" />;
}

function Rendered({ body }: { body: string }) {
  const blocks = mdBlocks(body);
  const out: ReactNode[] = [];
  let list: string[] = [];
  const flush = (k: number) => { if (list.length) { out.push(<ul key={`l${k}`} className="my-2 list-disc space-y-1 pl-5">{list.map((t, i) => <li key={i}>{t}</li>)}</ul>); list = []; } };
  blocks.forEach((b, i) => {
    if (b.t === "li") { list.push(b.text); return; }
    flush(i);
    if (b.t === "h1") out.push(<h2 key={i} className="mb-3 text-2xl font-semibold tracking-tight">{b.text}</h2>);
    else if (b.t === "h2") out.push(<h3 key={i} className="mt-6 mb-2 text-lg font-semibold">{b.text}</h3>);
    else if (b.t === "h3") out.push(<h4 key={i} className="mt-4 mb-1 font-semibold">{b.text}</h4>);
    else out.push(<p key={i} className="my-2 leading-relaxed">{b.text}</p>);
  });
  flush(blocks.length);
  return <article className="max-w-prose text-[15px]">{out}</article>;
}

export default function DocumentPage({ params }: { params: Promise<{ slug: string; path: string[] }> }) {
  const { slug, path: parts } = use(params);
  const path = parts.map((p) => decodeURIComponent(p)).join("/");
  const file = fileAt(slug, path);
  const chat = useChat();
  const initial = file ? (file.kind === "record" ? recordBody(file) : file.body ?? "") : "";
  const [body, setBody] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [mode, setMode] = useState<"preview" | "edit" | "record">("preview");
  const [history, setHistory] = useState<Version[]>(() => file?.history ?? (file ? [{ id: "v1", at: file.updated, by: file.by, note: "Last change" }] : []));
  const [histOpen, setHistOpen] = useState(false);
  const sug = SUGGESTIONS[path];
  const [sugState, setSugState] = useState<"held" | "accepted" | "rejected">("held");
  const [comments, setComments] = useState(() => COMMENTS[path] ?? []);
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const v = ventureOf(slug);

  if (!file) {
    return (
      <div className="pb-16">
        <ScreenHead n="V3" title="File not found" job={`${v.name} has no file at ${path}.`} />
        <div className="px-4 md:px-8"><Button variant="outline" asChild><Link href={ventureHref(slug, "files")}>Back to files</Link></Button></div>
      </div>
    );
  }

  const editable = file.kind === "doc" || file.kind === "record";
  const dirty = body !== saved;
  const save = () => {
    setSaved(body);
    setHistory((h) => [{ id: `v${h.length + 1}`, at: "just now", by: "torian", note: dirty ? "Your edit" : "Saved with no changes", body }, ...h]);
    setNote(dirty ? "Saved. A new version is in the history." : "Nothing changed since the last save.");
  };
  const restore = (ver: Version) => {
    const b = ver.body ?? body;
    setBody(b);
    setHistory((h) => [{ id: `v${h.length + 1}`, at: "just now", by: "torian", note: `Restored ${ver.id} from ${ver.at}`, body: b }, ...h]);
    setSaved(b);
    setHistOpen(false);
    setNote(`Restored ${ver.id}. The version you had is still in the history.`);
  };
  const accept = () => {
    if (!sug) return;
    setBody((b) => b.replace(sug.remove, sug.add));
    setSugState("accepted");
    setNote("Change accepted. Save to keep it.");
  };
  const crumbs = path.split("/");

  return (
    <div className="@container pb-16">
      <nav aria-label="Breadcrumb" className="relative flex min-w-0 flex-wrap items-center gap-1 px-4 pt-4 text-sm md:px-8">
        <Num n="V3.1" className="absolute -top-0 right-4" />
        <Link href={ventureHref(slug, "files")} className="text-muted-foreground hover:text-foreground">Files</Link>
        {crumbs.map((c, i) => (
          <span key={i} className="flex min-w-0 items-center gap-1">
            <ChevronRightIcon className="text-muted-foreground size-3.5 shrink-0" />
            <span className={cn("truncate", i === crumbs.length - 1 ? "font-medium" : "text-muted-foreground")}>{c}</span>
          </span>
        ))}
      </nav>

      <ScreenHead n="V3" title={titleOf(file)} job={dirty ? "You have changes that are not saved." : `Last saved ${history[0]?.at ?? file.updated}.`}>
        <Button variant="ghost" size="sm" onClick={() => { chat.setOpen(true); setNote(`The agent panel is open with ${fileName(path)} in view.`); }}><SparklesIcon />Ask the agent</Button>
        <Button variant="outline" size="sm" className="relative" onClick={() => setHistOpen(true)}><Num n="V3.7" className="absolute -top-2 -right-2" /><HistoryIcon />History</Button>
        <Button onClick={save}>Save</Button>
      </ScreenHead>

      {note ? (
        <div className="mx-4 mb-3 flex items-center justify-between gap-2 rounded-md border bg-emerald-500/5 px-3 py-2 text-sm md:mx-8">
          <span>{note}</span><Button variant="ghost" size="xs" onClick={() => setNote(null)}>Dismiss</Button>
        </div>
      ) : null}

      <div className="grid gap-6 px-4 md:px-8 @4xl:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex flex-wrap items-center gap-x-4 gap-y-2">
              <Num n="V3.3" className="absolute -top-3 -left-1" />
              <span className="text-muted-foreground text-xs">Edited by</span>
              {file.editors.map((e) => <Who key={e} id={e} />)}
            </div>
            <div className="relative flex rounded-md border p-0.5" role="group" aria-label="Document, record or edit">
              <Num n="V3.2" className="absolute -top-2 -right-2" />
              <Button variant={mode === "preview" ? "secondary" : "ghost"} size="sm" aria-pressed={mode === "preview"} onClick={() => setMode("preview")}><EyeIcon />Document</Button>
              <Button variant={mode === "record" ? "secondary" : "ghost"} size="sm" aria-pressed={mode === "record"} onClick={() => setMode("record")}><BracesIcon />Record</Button>
              {editable ? <Button variant={mode === "edit" ? "secondary" : "ghost"} size="sm" aria-pressed={mode === "edit"} onClick={() => setMode("edit")}><PencilIcon />Edit</Button> : null}
            </div>
          </div>
          <p className="text-muted-foreground -mt-2 text-xs">The record is the source of truth. This document is one way to read it.</p>

          {sug && file.kind === "doc" ? (
            <section className="relative rounded-lg border border-fuchsia-600/30 bg-fuchsia-600/5 p-3">
              <Num n="V3.4" className="absolute -top-2 right-2" />
              <div className="flex items-center gap-2 text-xs"><BotIcon className="size-3.5" /><span className="font-medium">{agentOf(sug.by).name}</span><span className="text-muted-foreground">suggests a change, held for your yes</span></div>
              <p className="text-muted-foreground mt-1 text-xs">{sug.why}</p>
              <div className="mt-2 overflow-hidden rounded-md border font-mono text-xs">
                <div className="bg-red-500/10 px-2 py-1.5 text-red-800 dark:text-red-300"><span className="select-none">- </span>{sug.remove}</div>
                <div className="bg-emerald-500/10 px-2 py-1.5 text-emerald-800 dark:text-emerald-300"><span className="select-none">+ </span>{sug.add}</div>
              </div>
              {sugState === "held" ? (
                <div className="mt-2 flex gap-2">
                  <Button variant="outline" size="xs" onClick={accept}>Accept</Button>
                  <Button variant="ghost" size="xs" onClick={() => { setSugState("rejected"); setNote(`${agentOf(sug.by).name} was told no and will not make this change.`); }}>Reject</Button>
                </div>
              ) : <p className="mt-2 text-xs font-medium">{sugState === "accepted" ? "Accepted and applied to the text below." : "Rejected. The text stays as it was."}</p>}
            </section>
          ) : null}

          <section className="relative rounded-lg border p-4 md:p-6">
            <Num n="V3.5" className="absolute -top-2 left-2" />
            {mode === "record" ? (
              <pre className="overflow-x-auto font-mono text-xs leading-relaxed">{JSON.stringify(recordOf(slug, { ...file, body }), null, 2)}</pre>
            ) : file.kind === "image" ? (
              <div className="grid aspect-video place-items-center rounded bg-gradient-to-br from-stone-200 to-stone-400 text-sm text-stone-700 dark:from-stone-700 dark:to-stone-900 dark:text-stone-300">{fileName(path)} · {file.size}</div>
            ) : file.kind === "sheet" ? (
              <div className="overflow-x-auto"><table className="w-full text-sm"><tbody>{SHEET_ROWS.map((r, i) => <tr key={i} className={cn("border-b", i === 0 && "font-medium")}>{r.map((c, k) => <td key={k} className="px-2 py-1.5">{c}</td>)}</tr>)}</tbody></table></div>
            ) : mode === "edit" ? (
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} className="min-h-[60vh] font-mono text-sm" aria-label="Document text" />
            ) : file.kind === "record" ? (
              <pre className="overflow-x-auto font-mono text-xs">{body}</pre>
            ) : <Rendered body={body} />}
          </section>
        </div>

        <aside className="relative min-w-0">
          <Num n="V3.6" className="absolute -top-2 right-0" />
          <h2 className="mb-2 text-sm font-semibold">Comments</h2>
          {comments.length === 0 ? <p className="text-muted-foreground mb-3 text-sm">No comments yet.</p> : null}
          <ul className="mb-3 space-y-3">
            {comments.map((c, i) => (
              <li key={i} className="rounded-md border p-2.5">
                <div className="flex items-center justify-between gap-2"><Who id={c.by} size={20} /><span className="text-muted-foreground shrink-0 text-xs">{c.at}</span></div>
                <p className="mt-1.5 text-sm">{c.text}</p>
              </li>
            ))}
          </ul>
          <form onSubmit={(e) => { e.preventDefault(); const t = draft.trim(); if (!t) return; setComments((cs) => [...cs, { by: "torian", at: "just now", text: t }]); setDraft(""); }} className="space-y-2">
            <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a comment" className="min-h-16 text-sm" aria-label="New comment" />
            <Button type="submit" variant="outline" size="sm" disabled={!draft.trim()}>Comment</Button>
          </form>
        </aside>
      </div>

      <Sheet open={histOpen} onOpenChange={setHistOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Version history</SheetTitle>
            <SheetDescription>Every saved version of {fileName(path)}. Restoring keeps the current one in the list.</SheetDescription>
          </SheetHeader>
          <ul className="space-y-2 px-4 pb-6">
            {history.map((ver, i) => (
              <li key={`${ver.id}-${i}`} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-2"><Who id={ver.by} size={20} /><span className="text-muted-foreground shrink-0 text-xs">{ver.at}</span></div>
                <p className="mt-1.5 text-sm">{ver.note}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-muted-foreground font-mono text-xs">{ver.id}</span>
                  {i === 0 ? <span className="text-xs font-medium">Current</span> : <Button variant="outline" size="xs" onClick={() => restore(ver)}>Restore</Button>}
                </div>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>
    </div>
  );
}
