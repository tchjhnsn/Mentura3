"use client";

// A venture's files (2026-11-18, the card "In Reflect, exportable"), drawn with shadcn's File Tree pattern
// (ui.shadcn.com/docs/ai-elements/radix/file-tree): a folder is a Collapsible, a file a Button. Before the venture is
// started in Naive, "Start in Naive" shows the files it would keep (a confirmation); Keep keeps them.
import * as React from "react";
import { ChevronRightIcon, DownloadIcon, FileIcon, FolderIcon, FolderTreeIcon } from "lucide-react";
import { fileTree, type FileNode, type VentureFile } from "@reflect/core/naive-venture";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { startNaiveAction } from "./venture-actions";

function FileTreeNode({ node, selected, onSelect }: { node: FileNode; selected: string; onSelect: (path: string) => void }) {
  // Every folder starts closed (Torian, 2026-11-18).
  if (node.type === "folder") {
    return (
      <Collapsible className="group/folder">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-start font-normal aria-expanded:bg-transparent aria-expanded:hover:bg-muted dark:aria-expanded:hover:bg-muted/50">
            {/* Rotated by its own trigger's state: the pattern's group-data selector also matched an open parent folder. */}
            <ChevronRightIcon className="transition-transform [[data-state=open]>&]:rotate-90" />
            <FolderIcon />
            {node.name}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="ml-4 flex flex-col">
            {node.children.length ? (
              node.children.map((child) => <FileTreeNode key={child.path} node={child} selected={selected} onSelect={onSelect} />)
            ) : (
              <p className="text-muted-foreground py-1 pl-8 text-xs">Empty</p>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }
  const on = selected === node.path;
  return (
    <Button variant="ghost" size="sm" className={`w-full justify-start font-normal ${on ? "bg-accent text-accent-foreground" : ""}`} aria-current={on ? "true" : undefined} onClick={() => onSelect(node.path)}>
      <FileIcon />
      {node.name}
    </Button>
  );
}

/** The tree beside the selected file's text; on a phone the text sits under the tree. */
function Browser({ files, first }: { files: VentureFile[]; first: string }) {
  const [selected, setSelected] = React.useState(first);
  const tree = React.useMemo(() => fileTree(files.map((f) => f.path)), [files]);
  const file = files.find((f) => f.path === selected);
  return (
    <div className="grid gap-3 rounded-lg border md:grid-cols-[16rem_1fr]">
      <nav aria-label="Files" className="flex flex-col border-b p-2 text-sm md:border-r md:border-b-0">
        {tree.map((node) => <FileTreeNode key={node.path} node={node} selected={selected} onSelect={setSelected} />)}
      </nav>
      <div className="min-w-0 p-3 md:p-4">
        {file ? (
          <>
            <p className="text-muted-foreground mb-2 font-mono text-xs">{file.path}</p>
            <pre className="max-h-[28rem] overflow-auto text-sm leading-relaxed whitespace-pre-wrap break-words">{file.body || " "}</pre>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">Choose a file to read it.</p>
        )}
      </div>
    </div>
  );
}

export function VentureFiles({ venture, files, draft }: { venture: string; files: VentureFile[]; draft: VentureFile[] }) {
  const [drafting, setDrafting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  const started = files.length > 0;

  return (
    <section aria-labelledby="files-title" className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="files-title" className="text-lg font-semibold">Files</h2>
        {started ? (
          <Button asChild variant="outline" size="sm">
            <a href={`/api/ventures/${venture}/export`} download><DownloadIcon />Download</a>
          </Button>
        ) : null}
      </div>
      {started ? (
        <>
          <Browser files={files} first="venture.json" />
          <p className="text-muted-foreground text-xs">Kept in Naive&apos;s layout. Download the folder and put it in your Naive workspace to keep working on it there.</p>
        </>
      ) : drafting ? (
        <div className="grid gap-3">
          <p className="text-sm">Naive starts this venture in Discovery with these files. Your notes from this page go in raw/dump.</p>
          <Browser files={draft} first="venture.json" />
          {error ? <p role="alert" className="text-destructive text-sm">{error}</p> : null}
          <div className="flex gap-2">
            <Button
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await startNaiveAction(venture);
                  if (r.error) setError(r.error);
                  else setDrafting(false);
                })
              }
            >
              {pending ? "Keeping" : "Keep these files"}
            </Button>
            <Button variant="ghost" disabled={pending} onClick={() => { setDrafting(false); setError(null); }}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed p-4 sm:flex-row sm:items-center">
          <FolderTreeIcon className="text-muted-foreground size-5 shrink-0" />
          <p className="text-muted-foreground flex-1 text-sm">Start this venture in Naive to keep its files here, in the folders Naive uses.</p>
          <Button onClick={() => setDrafting(true)}>Start in Naive</Button>
        </div>
      )}
    </section>
  );
}
