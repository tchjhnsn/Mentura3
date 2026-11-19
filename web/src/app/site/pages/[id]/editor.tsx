"use client";

import { useCallback, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, BoldIcon, ExternalLinkIcon, Heading2Icon, ItalicIcon, LayersIcon, ListIcon, MoreHorizontalIcon, PaletteIcon, PlusIcon, QuoteIcon } from "lucide-react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import Placeholder from "@tiptap/extension-placeholder";
import { COMPONENTS, LIBRARY_GROUPS, type GroupId, type Props } from "@reflect/core/site-page";
import type { PublishablePart } from "@/server/part-share";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { VirtuInlinePublish } from "@/components/virtu-sections";
import { cn } from "@/lib/utils";
import { ICONS, LooksContext, PartsContext, SiteComponent, type BlockLooks } from "./component-node";
import { partsForLibraryAction, publishPageAction, removePageAction, savePageAction, setPagePathAction, setPageTitleAction, shareOnSiteAction, unpublishPageAction } from "../actions";

type Status = "saved" | "unsaved" | "saving" | { error: string };
type PageInfo = { id: string; path: string; title: string; body: string; version: number; published: boolean; changed: boolean; fixed: boolean };
const SAVE_AFTER_MS = 1200;

/** Where the library opens, and the range of the line it replaces. */
type Open = { top: number; left: number; from: number; to: number };

/** The empty paragraph (or one holding only "/") the cursor is on, if any. */
function emptyLine(e: Editor): { from: number; to: number; slash: boolean } | null {
  const { $from, empty } = e.state.selection;
  if (!empty || $from.parent.type.name !== "paragraph" || $from.depth !== 1) return null;
  const t = $from.parent.textContent;
  if (t !== "" && t !== "/") return null;
  return { from: $from.before(), to: $from.after(), slash: t === "/" };
}

/**
 * The site editor (plan "Appearance, Virtu and the site editor", "The Markdown site editor"): the journal's Tiptap and
 * Markdown editor with the component library. / on an empty line, or the + in the margin beside it, opens the library.
 * The draft saves itself; Publish, the one filled button, puts it live. Title and address are behind the ... menu.
 */
export function PageEditor({ page, base, parts: initialParts, design = null, looks = null }: {
  page: PageInfo; base: string; parts: PublishablePart[];
  /** The editor.panel slot drawn on the server (Virtu's sections), or null when no added plugin fills it. */
  design?: ReactNode;
  /** What added plugins put on a selected block's bar (editor.component-option), or null. */
  looks?: BlockLooks | null;
}) {
  const router = useRouter();
  const [designOpen, setDesignOpen] = useState(false);
  const wide = useWide();
  const [status, setStatus] = useState<Status>("saved");
  const [published, setPublished] = useState(page.published);
  const [changed, setChanged] = useState(page.changed);
  const [title, setTitle] = useState(page.title);
  const [path, setPath] = useState(page.path);
  const [editing, setEditing] = useState<"title" | "path" | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [parts, setParts] = useState(initialParts);
  const [open, setOpen] = useState<Open | null>(null);
  const [plus, setPlus] = useState<{ top: number } | null>(null);
  const [pending, start] = useTransition();
  const version = useRef(page.version);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saving = useRef(false);
  const again = useRef(false);
  const scheduleRef = useRef<() => void>(() => undefined);
  const wrap = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: { openOnClick: false } }),
      Markdown,
      SiteComponent,
      Placeholder.configure({ placeholder: ({ editor: e }) => (e.isEmpty ? "Write, or type / for a photo, a post list and more" : "Type / for the library") }),
    ],
    content: page.body,
    contentType: "markdown",
    editorProps: { attributes: { class: "writing min-h-[60vh] font-serif", "aria-label": "Page text" } },
    onUpdate: () => scheduleRef.current(),
  });

  const save = useCallback(async () => {
    if (!editor) return;
    if (saving.current) {
      again.current = true;
      return;
    }
    saving.current = true;
    setStatus("saving");
    const r = await savePageAction(page.id, editor.getMarkdown(), version.current);
    saving.current = false;
    if ("error" in r) setStatus({ error: r.error });
    else {
      version.current = r.version;
      setChanged(true);
      setStatus("saved");
    }
    if (again.current) {
      again.current = false;
      void save();
    }
  }, [editor, page.id]);

  const schedule = useCallback(() => {
    setStatus("unsaved");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void save(), SAVE_AFTER_MS);
  }, [save]);
  useEffect(() => {
    scheduleRef.current = schedule;
  }, [schedule]);

  // The margin +, the / trigger, and where the library opens.
  const state = useEditorState({ editor, selector: ({ editor: e }) => (e ? { line: emptyLine(e), sel: e.state.selection.from, doc: e.state.doc.content.size } : null) });
  useEffect(() => {
    if (!editor || !state || !wrap.current) return;
    const box = wrap.current.getBoundingClientRect();
    const line = state.line;
    if (!line) {
      setPlus(null);
      return;
    }
    const at = editor.view.coordsAtPos(line.from + 1);
    setPlus({ top: at.top - box.top });
    if (line.slash && !open) setOpen({ top: at.bottom - box.top + 4, left: Math.max(0, at.left - box.left), from: line.from, to: line.to });
  }, [editor, state, open]);

  const openLibrary = () => {
    if (!editor || !wrap.current) return;
    const line = emptyLine(editor);
    const box = wrap.current.getBoundingClientRect();
    if (line) {
      const at = editor.view.coordsAtPos(line.from + 1);
      setOpen({ top: at.bottom - box.top + 4, left: Math.max(0, at.left - box.left), from: line.from, to: line.to });
    } else {
      // From the header on a phone, after the line the cursor is on.
      const { $from } = editor.state.selection;
      const end = $from.depth ? $from.after(1) : editor.state.doc.content.size;
      const at = editor.view.coordsAtPos(Math.max(1, end - 1));
      setOpen({ top: at.bottom - box.top + 4, left: 0, from: end, to: end });
    }
    void partsForLibraryAction().then(setParts);
  };

  const insert = (name: string, props: Props) => {
    if (!editor || !open) return;
    const node = { type: "siteComponent", attrs: { name, props } };
    const line = editor.state.doc.nodeAt(open.from);
    const replaces = open.to > open.from && line?.type.name === "paragraph" && (line.textContent === "" || line.textContent === "/");
    editor.chain().focus().insertContentAt(replaces ? { from: open.from, to: open.to } : open.from, [node, { type: "paragraph" }]).run();
    setOpen(null);
  };

  const close = () => {
    if (editor && open) {
      const line = editor.state.doc.nodeAt(open.from);
      if (line?.textContent === "/") editor.chain().focus().deleteRange({ from: open.from + 1, to: open.from + 2 }).run();
    }
    setOpen(null);
  };

  const publish = () =>
    start(async () => {
      if (timer.current) clearTimeout(timer.current);
      await save();
      const r = await publishPageAction(page.id);
      if ("error" in r) setStatus({ error: r.error });
      else {
        setPublished(true);
        setChanged(false);
        setNote("Published.");
        router.refresh();
      }
    });

  const commit = (which: "title" | "path", value: string) =>
    start(async () => {
      const r = which === "title" ? await setPageTitleAction(page.id, value) : await setPagePathAction(page.id, value);
      if ("error" in r) {
        setNote(r.error);
        if (which === "title") setTitle(page.title);
        else setPath(page.path);
      } else setNote(null);
      setEditing(null);
    });

  const marks = useEditorState({
    editor,
    selector: ({ editor: e }) => ({ bold: e?.isActive("bold") ?? false, italic: e?.isActive("italic") ?? false, h2: e?.isActive("heading", { level: 2 }) ?? false, list: e?.isActive("bulletList") ?? false, quote: e?.isActive("blockquote") ?? false }),
  });
  const tool = (label: string, Icon: typeof BoldIcon, on: boolean | undefined, run: () => void) => (
    <Button key={label} type="button" size="icon" variant="ghost" className={cn("hidden size-8 sm:inline-flex", on && "bg-muted")} aria-label={label} aria-pressed={!!on} onMouseDown={(e) => e.preventDefault()} onClick={run}>
      <Icon className="size-4" />
    </Button>
  );

  const live = path ? `${base}/${path}` : base;
  const statusText = typeof status === "object" ? "Not saved" : status === "saved" ? (published && !changed ? "Published" : "Saved") : status === "saving" ? "Saving" : "Edited";

  return (
    <PartsContext.Provider value={parts}>
    <LooksContext.Provider value={looks}>
      <main className="min-h-screen">
        <header className="bg-background/90 sticky top-0 z-20 border-b backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center gap-1 px-4 py-2">
            <Button asChild variant="ghost" size="icon" aria-label="Your site" onClick={() => void save()}><Link href="/settings/site"><ArrowLeftIcon /></Link></Button>
            <div className="grid min-w-0 flex-1 leading-tight">
              {editing === "title" ? (
                <input autoFocus aria-label="Title" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => commit("title", title)}
                  onKeyDown={(e) => { if (e.key === "Enter") commit("title", title); if (e.key === "Escape") { setTitle(page.title); setEditing(null); } }}
                  className="bg-muted/60 rounded px-1 text-sm font-semibold outline-none" />
              ) : <span className="truncate text-sm font-semibold">{title}</span>}
              {editing === "path" ? (
                <span className="text-muted-foreground flex items-center text-xs">{base}/
                  <input autoFocus aria-label="Address" value={path} onChange={(e) => setPath(e.target.value.toLowerCase())} onBlur={() => commit("path", path)}
                    onKeyDown={(e) => { if (e.key === "Enter") commit("path", path); if (e.key === "Escape") { setPath(page.path); setEditing(null); } }}
                    className="bg-muted/60 min-w-0 flex-1 rounded px-1 outline-none" />
                </span>
              ) : <span className="text-muted-foreground truncate text-xs">{live}</span>}
            </div>
            {editor ? [
              tool("Heading", Heading2Icon, marks?.h2, () => editor.chain().focus().toggleHeading({ level: 2 }).run()),
              tool("Bold", BoldIcon, marks?.bold, () => editor.chain().focus().toggleBold().run()),
              tool("Italic", ItalicIcon, marks?.italic, () => editor.chain().focus().toggleItalic().run()),
              tool("List", ListIcon, marks?.list, () => editor.chain().focus().toggleBulletList().run()),
              tool("Quote", QuoteIcon, marks?.quote, () => editor.chain().focus().toggleBlockquote().run()),
            ] : null}
            <Button type="button" variant="ghost" size="icon" className="size-8 sm:hidden" aria-label="Add a component" onMouseDown={(e) => e.preventDefault()} onClick={openLibrary}><PlusIcon /></Button>
            {design ? (
              <Button type="button" variant="ghost" size="icon" className={cn("size-8", designOpen && "bg-muted")} aria-label="Design" aria-pressed={designOpen}
                onMouseDown={(e) => e.preventDefault()} onClick={() => setDesignOpen((o) => !o)}><PaletteIcon /></Button>
            ) : null}
            <span className={cn("text-muted-foreground w-16 text-right text-xs", typeof status === "object" && "text-destructive")} role="status">{statusText}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-8" aria-label="Page settings"><MoreHorizontalIcon /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onSelect={() => setEditing("title")}>Title<span className="text-muted-foreground ml-auto max-w-28 truncate text-xs">{title}</span></DropdownMenuItem>
                {!page.fixed ? <DropdownMenuItem onSelect={() => setEditing("path")}>Address<span className="text-muted-foreground ml-auto max-w-28 truncate text-xs">/{path}</span></DropdownMenuItem> : null}
                {published ? <DropdownMenuItem asChild><a href={live} target="_blank" rel="noreferrer">View page<ExternalLinkIcon className="ml-auto" /></a></DropdownMenuItem> : null}
                {published ? <DropdownMenuItem onSelect={() => start(async () => { await unpublishPageAction(page.id); setPublished(false); setNote(page.fixed ? "Unpublished. Visitors see your profile layout again." : "Unpublished."); })}>Unpublish</DropdownMenuItem> : null}
                {!page.fixed ? <><DropdownMenuSeparator /><DropdownMenuItem variant="destructive" onSelect={() => start(() => removePageAction(page.id))}>Remove page</DropdownMenuItem></> : null}
                {!design ? <><DropdownMenuSeparator /><DropdownMenuItem asChild className="text-muted-foreground"><Link href="/marketplace/plugins/virtu">More options with Virtu</Link></DropdownMenuItem></> : null}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button type="button" size="sm" className="ml-1" disabled={pending || !editor || (published && !changed && status === "saved")} onClick={publish}>Publish</Button>
          </div>
          {typeof status === "object" || note ? (
            <p className={cn("mx-auto max-w-3xl px-4 pb-2 text-xs", typeof status === "object" ? "text-destructive" : "text-muted-foreground")}>{typeof status === "object" ? status.error : note}</p>
          ) : null}
        </header>
        <article className="mx-auto max-w-2xl px-6 pt-10 pb-40">
          <div ref={wrap} className="relative">
            {plus && !open ? (
              <Button type="button" variant="ghost" size="icon" aria-label="Add a component" style={{ top: plus.top - 4 }}
                className="text-muted-foreground absolute -left-11 hidden size-8 sm:inline-flex" onMouseDown={(e) => e.preventDefault()} onClick={openLibrary}>
                <PlusIcon />
              </Button>
            ) : null}
            <EditorContent editor={editor} />
            {open ? <Library at={open} parts={parts} onPick={insert} onClose={close} onShare={async (source) => {
              const r = await shareOnSiteAction(source);
              if ("error" in r) return r.error;
              setParts(r.parts);
              return null;
            }} /> : null}
          </div>
        </article>
      </main>
      {design ? (
        // The Design panel: Virtu's sections on the person's site, a panel on the right on a wide screen and a sheet on a
        // phone. Non-modal, so the page stays in view and editable beside it.
        <Sheet open={designOpen} onOpenChange={setDesignOpen} modal={false}>
          <SheetContent side={wide ? "right" : "bottom"} overlay={false} onInteractOutside={(e) => e.preventDefault()}
            className={cn("gap-0 overflow-y-auto", wide ? "w-full sm:max-w-sm" : "max-h-[75svh] rounded-t-2xl")}>
            {wide ? null : <span aria-hidden className="bg-muted mx-auto mt-2 h-1 w-10 rounded-full" />}
            <SheetHeader className="pb-2">
              <SheetTitle>Design</SheetTitle>
              <SheetDescription>Your site&apos;s colours, type, shape and looks, for every page. Visitors see a change once you publish it here.</SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-4"><VirtuInlinePublish.Provider value={true}>{design}</VirtuInlinePublish.Provider></div>
          </SheetContent>
        </Sheet>
      ) : null}
    </LooksContext.Provider>
    </PartsContext.Provider>
  );
}

function useWide(): boolean {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const m = matchMedia("(min-width: 640px)");
    const on = () => setWide(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return wide;
}

/** The library's search: a name that starts with the words typed first, then any word that does, then words that contain them. */
function wordFilter(value: string, search: string): number {
  const v = value.toLowerCase();
  const s = search.trim().toLowerCase();
  if (!s) return 1;
  if (v.startsWith(s)) return 1;
  if (v.split(/[^a-z0-9]+/).some((w) => w.startsWith(s))) return 0.7;
  return v.includes(s) ? 0.3 : 0;
}

const PART_GROUP: Record<PublishablePart["group"], GroupId> = { tiles: "tiles", household: "household", shared: "shared" };

/** The component library: a search field and the groups, Media down to Shared domains. Parts not yet shared ask first. */
function Library({ at, parts, onPick, onClose, onShare }: { at: Open; parts: PublishablePart[]; onPick: (name: string, props: Props) => void; onClose: () => void; onShare: (source: string) => Promise<string | null> }) {
  const [asking, setAsking] = useState<PublishablePart | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  // The editor keeps the focus after "/"; hand it to the search field so typing searches the library.
  useEffect(() => {
    const f = requestAnimationFrame(() => box.current?.querySelector("input")?.focus());
    return () => cancelAnimationFrame(f);
  }, [asking]);
  useEffect(() => {
    const down = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", down);
    return () => document.removeEventListener("mousedown", down);
  }, [onClose]);
  const defaults: Record<string, Props> = { PostList: { limit: 3 } };
  return (
    <div ref={box} role="dialog" aria-label="Add a component" style={{ top: at.top, left: Math.min(at.left, 8) }}
      className="bg-popover text-popover-foreground absolute right-0 z-30 max-w-[22rem] sm:right-auto sm:w-[22rem] overflow-hidden rounded-xl border shadow-lg">
      {asking ? (
        <div className="grid gap-3 p-4 text-sm">
          <p className="font-medium">Share {asking.label.replace(/^\w+: /, "")} on your site?</p>
          <p className="text-muted-foreground">Anyone who visits your site will see its name{asking.group === "household" ? "s" : ", place and dates"}. {asking.group === "household" ? "The person who made your household gives their OK too." : ""} You can stop sharing it at any time.</p>
          {error ? <p className="text-destructive">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setAsking(null)}>Cancel</Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={async () => {
              setBusy(true);
              const err = await onShare(asking.source);
              setBusy(false);
              if (err) setError(err);
              else onPick("Part", { source: asking.source, view: "card" });
            }}>Share on my site</Button>
          </div>
        </div>
      ) : (
        <Command loop filter={wordFilter} onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); onClose(); } }}>
          <CommandInput autoFocus placeholder="Search" />
          <CommandList className="max-h-80">
            <CommandEmpty>Nothing by that name.</CommandEmpty>
            {LIBRARY_GROUPS.map((g) => {
              if (g.id === "tiles" || g.id === "household" || g.id === "shared") {
                const mine = parts.filter((p) => PART_GROUP[p.group] === g.id);
                return (
                  <CommandGroup key={g.id} heading={g.label}>
                    {mine.length ? mine.map((p) => (
                      <CommandItem key={p.source} value={`${g.label} ${p.label}`} onSelect={() => (p.state === "not shared" ? setAsking(p) : onPick("Part", { source: p.source, view: "card" }))}>
                        <LayersIcon />
                        <span className="truncate">{p.label}</span>
                        <span className="text-muted-foreground ml-auto shrink-0 text-xs">{p.state === "shared" ? "" : p.state === "waiting" ? "Waiting" : "Share on my site"}</span>
                      </CommandItem>
                    )) : <p className="text-muted-foreground px-2 py-1.5 text-xs">{g.id === "shared" ? "No shared domains yet." : g.id === "household" ? "Add people to your household first." : "Add an adventure or a venture first."}</p>}
                  </CommandGroup>
                );
              }
              return (
                <CommandGroup key={g.id} heading={g.label}>
                  {COMPONENTS.filter((c) => c.group === g.id).map((c) => {
                    const Icon = ICONS[c.name] ?? LayersIcon;
                    return (
                      <CommandItem key={c.name} value={`${c.label} ${c.line}`} onSelect={() => onPick(c.name, defaults[c.name] ?? {})}>
                        <Icon />
                        <span className="grid min-w-0"><span>{c.label}</span><span className="text-muted-foreground truncate text-xs">{c.line}</span></span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      )}
    </div>
  );
}
