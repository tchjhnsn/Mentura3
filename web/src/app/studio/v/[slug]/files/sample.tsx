"use client";

// V2 Files: every file the venture has, by Naive folder, with the selected one previewed beside the list.
// Follows Replit's files anatomy: tree on the left, list in the middle, preview on the right.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useMemo, useRef, useState } from "react";
import {
  BotIcon, BracesIcon, ChevronDownIcon, ChevronRightIcon, FileTextIcon, FolderIcon, FolderOpenIcon, ImageIcon,
  LayoutGridIcon, ListIcon, PlusIcon, PresentationIcon, SearchIcon, SparklesIcon, TableIcon, UploadIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Face, Num } from "@/components/studio/bits";
import { ScreenHead, useChat } from "@/components/studio/shell";
import { agentOf, ventureOf } from "@/components/studio/data";
import {
  FOLDERS, SHEET_ROWS, fileName, hrefOfFile, filesFor, folderOf, isAgentId, mdBlocks, recordBody, titleOf, type FileKind, type VFile,
} from "@/components/studio/files-data";

const KIND_ICON: Record<FileKind, typeof FileTextIcon> = { doc: FileTextIcon, deck: PresentationIcon, sheet: TableIcon, record: BracesIcon, image: ImageIcon };
const KIND_LABEL: Record<FileKind, string> = { doc: "Doc", deck: "Deck", sheet: "Sheet", record: "Record", image: "Image" };

/** "Marketing agent" or "Torian", the short name of whoever last touched a file. */
function ByLine({ f }: { f: VFile }) {
  if (isAgentId(f.by)) {
    const recent = f.mins < 60;
    return (
      <span className={cn("inline-flex min-w-0 items-center gap-1 text-xs", recent ? "font-medium text-fuchsia-700 dark:text-fuchsia-400" : "text-muted-foreground")}>
        <BotIcon className="size-3.5 shrink-0" /><span className="truncate">Edited by {agentOf(f.by).name} {f.updated}</span>
      </span>
    );
  }
  return <span className="text-muted-foreground inline-flex min-w-0 items-center gap-1.5 text-xs"><Face id={f.by} size={16} showName={false} /><span className="truncate">Edited {f.updated}</span></span>;
}

type Node = { path: string; name: string; children: Node[]; count: number };
function buildTree(files: VFile[]): Node[] {
  const all = new Set<string>(FOLDERS);
  for (const f of files) { const parts = folderOf(f.path).split("/"); for (let i = 1; i <= parts.length; i++) all.add(parts.slice(0, i).join("/")); }
  const make = (parent: string): Node[] => [...all].filter((p) => p !== "" && folderOf(p) === parent).sort()
    .map((p) => ({ path: p, name: fileName(p), children: make(p), count: files.filter((f) => f.path.startsWith(`${p}/`)).length }));
  return make("");
}

function TreeNode({ node, at, onPick, depth }: { node: Node; at: string; onPick: (p: string) => void; depth: number }) {
  const [open, setOpen] = useState(at.startsWith(node.path) || depth === 0);
  const active = at === node.path;
  const Icon = open && node.children.length ? FolderOpenIcon : FolderIcon;
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className={cn("flex items-center rounded-md text-sm", active ? "bg-accent font-medium" : "hover:bg-accent/60")} style={{ paddingLeft: depth * 12 }}>
        {node.children.length ? (
          <CollapsibleTrigger asChild>
            <button type="button" className="text-muted-foreground grid size-6 place-items-center" aria-label={open ? `Close ${node.name}` : `Open ${node.name}`}>
              {open ? <ChevronDownIcon className="size-3.5" /> : <ChevronRightIcon className="size-3.5" />}
            </button>
          </CollapsibleTrigger>
        ) : <span className="size-6" />}
        <button type="button" onClick={() => onPick(node.path)} className="flex min-w-0 flex-1 items-center gap-1.5 py-1 pr-2 text-left">
          <Icon className="text-muted-foreground size-4 shrink-0" /><span className="flex-1 truncate">{node.name}</span>
          <span className="text-muted-foreground text-xs">{node.count || ""}</span>
        </button>
      </div>
      {node.children.length ? (
        <CollapsibleContent>{node.children.map((c) => <TreeNode key={c.path} node={c} at={at} onPick={onPick} depth={depth + 1} />)}</CollapsibleContent>
      ) : null}
    </Collapsible>
  );
}

function Preview({ slug, f }: { slug: string; f: VFile | undefined }) {
  if (!f) return <div className="text-muted-foreground grid h-40 place-items-center text-sm">Pick a file to see it here.</div>;
  const Icon = KIND_ICON[f.kind];
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
        <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{titleOf(f)}</div><div className="text-muted-foreground truncate font-mono text-xs">{f.path}</div></div>
      </div>
      <ByLine f={f} />
      <div className="bg-muted/40 max-h-[50vh] overflow-y-auto rounded-md border p-3 text-sm">
        {f.kind === "doc" && f.body ? mdBlocks(f.body).slice(0, 14).map((b, i) =>
          b.t === "h1" ? <p key={i} className="mb-1 font-semibold">{b.text}</p>
            : b.t === "h2" || b.t === "h3" ? <p key={i} className="mt-2 text-xs font-semibold">{b.text}</p>
              : b.t === "li" ? <p key={i} className="text-muted-foreground pl-3 text-xs">• {b.text}</p>
                : <p key={i} className="text-muted-foreground text-xs">{b.text}</p>) : null}
        {f.kind === "record" ? <pre className="overflow-x-auto font-mono text-xs">{recordBody(f)}</pre> : null}
        {f.kind === "sheet" ? (
          <div className="space-y-1 text-xs">{SHEET_ROWS.map((r, i) => <div key={i} className={cn("grid grid-cols-3 gap-2", i === 0 && "font-medium")}>{r.map((c, k) => <span key={k}>{c}</span>)}</div>)}</div>
        ) : null}
        {f.kind === "image" ? <div className="grid aspect-video place-items-center rounded bg-gradient-to-br from-stone-200 to-stone-400 text-xs text-stone-700 dark:from-stone-700 dark:to-stone-900 dark:text-stone-300">{fileName(f.path)}</div> : null}
        {f.kind === "deck" ? <div className="grid aspect-video place-items-center rounded border bg-background text-center text-xs"><span><span className="block text-base font-semibold">{ventureOf(slug).name}</span>{f.size}</span></div> : null}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-xs">Worked on by</span>
        <span className="flex -space-x-1">{f.editors.filter((e) => !isAgentId(e)).map((e) => <Face key={e} id={e} size={20} showName={false} />)}</span>
        {f.editors.filter(isAgentId).map((e) => <span key={e} className="text-muted-foreground inline-flex items-center gap-0.5 text-xs"><BotIcon className="size-3" />{agentOf(e).name}</span>)}
      </div>
      <Button variant="outline" size="sm" asChild className="w-full"><Link href={hrefOfFile(slug, f)}>Open {KIND_LABEL[f.kind].toLowerCase()}</Link></Button>
    </div>
  );
}

export default function FilesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const chat = useChat();
  const [files, setFiles] = useState<VFile[]>(() => filesFor(slug));
  const [at, setAt] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"edited" | "name" | "kind">("edited");
  const [view, setView] = useState<"list" | "grid">("list");
  const [selected, setSelected] = useState<string | undefined>(files[0]?.path);
  const [note, setNote] = useState<string | null>(null);
  const upload = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLElement>(null);

  const tree = useMemo(() => buildTree(files), [files]);
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    const list = files.filter((f) => (at === "" || f.path.startsWith(`${at}/`)) && (!t || f.path.toLowerCase().includes(t) || titleOf(f).toLowerCase().includes(t) || (f.body ?? "").toLowerCase().includes(t)));
    return [...list].sort((a, b) => sort === "edited" ? a.mins - b.mins : sort === "name" ? fileName(a.path).localeCompare(fileName(b.path)) : a.kind.localeCompare(b.kind));
  }, [files, at, q, sort]);
  const recent = files.filter((f) => isAgentId(f.by) && f.mins < 60).sort((a, b) => a.mins - b.mins);
  const sel = files.find((f) => f.path === selected);
  const subfolders = tree.length ? (at === "" ? tree : findNode(tree, at)?.children ?? []) : [];

  const pick = (f: VFile) => {
    const wide = previewRef.current?.offsetParent != null;
    if (wide && selected !== f.path) { setSelected(f.path); return; }
    router.push(hrefOfFile(slug, f));
  };
  const add = (kind: FileKind, name: string, by = "torian") => {
    const folder = at || (kind === "deck" ? "marketing/decks" : kind === "sheet" ? "finance" : "raw");
    const path = `${folder}/${name}`;
    const f: VFile = { path, kind, by, mins: 0, updated: "just now", editors: [by], size: kind === "deck" ? "1 slide" : "1 KB", body: kind === "doc" ? `# ${name.replace(/\.md$/, "").replace(/-/g, " ")}\n\nStart writing here.` : undefined, deckId: kind === "deck" ? "investor" : undefined };
    setFiles((xs) => [f, ...xs.filter((x) => x.path !== path)]);
    setSelected(path);
    setNote(`Created ${path}.`);
  };

  return (
    <div className="@container pb-16">
      <ScreenHead n="V2" title="Files" job="Every file the business has, by folder, with the open one beside it.">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="relative"><Num n="V2.3" className="absolute -top-2 -left-2" /><PlusIcon />New<ChevronDownIcon /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onSelect={() => add("doc", "untitled.md")}><FileTextIcon />Doc</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => add("deck", "untitled.deck")}><PresentationIcon />Deck</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => add("sheet", "untitled.sheet")}><TableIcon />Sheet</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => upload.current?.click()}><UploadIcon />Upload</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => { chat.setOpen(true); setNote("The agent panel is open. Say what to draft and where it should go."); }}><SparklesIcon />Ask the agent to draft</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <input ref={upload} type="file" className="hidden" onChange={(e) => { const n = e.target.files?.[0]?.name; if (n) add(/\.(png|jpe?g|gif)$/i.test(n) ? "image" : "doc", n); e.target.value = ""; }} />
      </ScreenHead>

      {note ? (
        <div className="mx-4 mb-3 flex items-center justify-between gap-2 rounded-md border bg-emerald-500/5 px-3 py-2 text-sm md:mx-8">
          <span>{note}</span><Button variant="ghost" size="xs" onClick={() => setNote(null)}>Dismiss</Button>
        </div>
      ) : null}

      {recent.length ? (
        <section className="relative mx-4 mb-4 rounded-lg border p-3 md:mx-8">
          <Num n="V2.6" className="absolute -top-2 right-2" />
          <h2 className="mb-2 text-xs font-medium">Changed by agents in the last hour</h2>
          <ul className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:gap-x-5">
            {recent.map((f) => (
              <li key={f.path} className="min-w-0">
                <button type="button" onClick={() => pick(f)} className="flex min-w-0 max-w-full items-center gap-1.5 text-left text-sm hover:underline">
                  <BotIcon className="size-3.5 shrink-0 text-fuchsia-600" />
                  <span className="truncate"><span className="font-medium">{fileName(f.path)}</span><span className="text-muted-foreground"> edited by {agentOf(f.by).name} {f.updated}</span></span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex gap-4 px-4 md:px-8">
        <aside className="relative hidden w-56 shrink-0 @3xl:block">
          <Num n="V2.1" className="absolute -top-2 right-0" />
          <button type="button" onClick={() => setAt("")} className={cn("mb-1 flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-sm", at === "" ? "bg-accent font-medium" : "hover:bg-accent/60")}>
            <FolderOpenIcon className="text-muted-foreground size-4" /><span className="flex-1">All files</span><span className="text-muted-foreground text-xs">{files.length}</span>
          </button>
          {tree.map((n) => <TreeNode key={n.path} node={n} at={at} onPick={setAt} depth={0} />)}
        </aside>

        <section className="relative min-w-0 flex-1">
          <Num n="V2.2" className="absolute -top-2 right-0 z-10" />
          <nav aria-label="Folder" className="mb-2 flex min-w-0 flex-wrap items-center gap-1 text-sm @3xl:hidden">
            <button type="button" onClick={() => setAt("")} className={cn("rounded px-1.5 py-0.5", at === "" ? "font-medium" : "text-muted-foreground hover:bg-accent")}>All files</button>
            {at.split("/").filter(Boolean).map((seg, i, arr) => {
              const p = arr.slice(0, i + 1).join("/");
              return <span key={p} className="flex items-center gap-1"><ChevronRightIcon className="text-muted-foreground size-3.5" /><button type="button" onClick={() => setAt(p)} className={cn("rounded px-1.5 py-0.5", p === at ? "font-medium" : "text-muted-foreground hover:bg-accent")}>{seg}</button></span>;
            })}
            {subfolders.length ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="xs"><FolderIcon />Folders<ChevronDownIcon /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="start">{subfolders.map((n) => <DropdownMenuItem key={n.path} onSelect={() => setAt(n.path)}><FolderIcon />{n.name}<span className="text-muted-foreground ml-auto text-xs">{n.count}</span></DropdownMenuItem>)}</DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </nav>

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="relative min-w-0 flex-1 basis-48">
              <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search names and text" className="pl-8" aria-label="Search files" />
            </div>
            <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
              <SelectTrigger className="w-36" aria-label="Sort"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="edited">Last edited</SelectItem><SelectItem value="name">Name</SelectItem><SelectItem value="kind">Kind</SelectItem></SelectContent>
            </Select>
            <div className="flex rounded-md border">
              <Button variant={view === "list" ? "secondary" : "ghost"} size="icon-sm" onClick={() => setView("list")} aria-label="List" aria-pressed={view === "list"}><ListIcon /></Button>
              <Button variant={view === "grid" ? "secondary" : "ghost"} size="icon-sm" onClick={() => setView("grid")} aria-label="Grid" aria-pressed={view === "grid"}><LayoutGridIcon /></Button>
            </div>
          </div>

          <div className="relative">
            <Num n="V2.4" className="absolute -top-2 left-1 z-10" />
            {shown.length === 0 ? (
              <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
                Nothing here matches {q ? `"${q}"` : "this folder"}.
                <div className="mt-2"><Button variant="ghost" size="sm" onClick={() => { setQ(""); setAt(""); }}>Show all files</Button></div>
              </div>
            ) : view === "list" ? (
              <ul className="divide-y rounded-lg border">
                {shown.map((f) => {
                  const Icon = KIND_ICON[f.kind];
                  return (
                    <li key={f.path}>
                      <button type="button" onClick={() => pick(f)} className={cn("flex w-full min-w-0 items-center gap-3 px-3 py-2.5 text-left", selected === f.path ? "@5xl:bg-accent" : "hover:bg-accent/50")} title="Click to preview, click again to open">
                        <Icon className="text-muted-foreground size-4 shrink-0" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{fileName(f.path)}</span>
                          <span className="flex min-w-0 flex-wrap items-center gap-x-2"><span className="text-muted-foreground truncate font-mono text-[11px]">{folderOf(f.path)}</span><ByLine f={f} /></span>
                        </span>
                        <span className="text-muted-foreground hidden shrink-0 text-xs sm:block">{KIND_LABEL[f.kind]} · {f.size}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <ul className="grid grid-cols-2 gap-3 @xl:grid-cols-3 @7xl:grid-cols-4">
                {shown.map((f) => {
                  const Icon = KIND_ICON[f.kind];
                  return (
                    <li key={f.path}>
                      <button type="button" onClick={() => pick(f)} className={cn("flex h-full w-full min-w-0 flex-col gap-2 rounded-lg border p-3 text-left", selected === f.path ? "@5xl:ring-2 @5xl:ring-ring" : "hover:bg-accent/50")}>
                        <span className="bg-muted grid aspect-[4/3] place-items-center rounded"><Icon className="text-muted-foreground size-6" /></span>
                        <span className="block truncate text-sm font-medium">{fileName(f.path)}</span>
                        <ByLine f={f} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <aside ref={previewRef} className="relative hidden w-80 shrink-0 @5xl:block">
          <Num n="V2.5" className="absolute -top-2 right-0" />
          <div className="sticky top-4 rounded-lg border p-3"><Preview slug={slug} f={sel} /></div>
        </aside>
      </div>
    </div>
  );
}

function findNode(nodes: Node[], path: string): Node | undefined {
  for (const n of nodes) { if (n.path === path) return n; const c = findNode(n.children, path); if (c) return c; }
  return undefined;
}
