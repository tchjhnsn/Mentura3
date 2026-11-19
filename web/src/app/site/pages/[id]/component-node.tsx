"use client";

import { createContext, useContext, type ComponentType } from "react";
import { Node, mergeAttributes, NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import {
  AtSignIcon, ClockIcon, ImageIcon, ImagesIcon, LayersIcon, LinkIcon, ListIcon, MessageSquareIcon, MinusIcon,
  MousePointerClickIcon, MusicIcon, QuoteIcon, Trash2Icon, UserIcon, VideoIcon, type LucideProps,
} from "lucide-react";
import { checkComponent, componentByName, looseTag, parseTag, safeUrl, serializeTag, type PropSpec, type Props } from "@reflect/core/site-page";
import type { PublishablePart } from "@/server/part-share";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Each library component's icon. */
export const ICONS: Record<string, ComponentType<LucideProps>> = {
  Photo: ImageIcon, Gallery: ImagesIcon, Video: VideoIcon, Audio: MusicIcon, Embed: LinkIcon, Quote: QuoteIcon, Callout: MessageSquareIcon,
  Divider: MinusIcon, Button: MousePointerClickIcon, PostList: ListIcon, ProfileCard: UserIcon, Links: AtSignIcon, Now: ClockIcon, Part: LayersIcon,
};

/** The parts the person may publish, so a Part block can name what it shows. */
export const PartsContext = createContext<PublishablePart[]>([]);

const FIELD = "placeholder:text-muted-foreground/60 w-full rounded-md bg-transparent px-2 py-1 text-sm outline-none focus-visible:bg-muted/60";

/** One value of a component, edited in place in the block. */
function Field({ k, spec, value, set }: { k: string; spec: PropSpec; value: unknown; set: (v: unknown) => void }) {
  if (spec.kind === "choice") {
    return (
      <div className="flex items-center gap-1 px-2 text-xs" role="radiogroup" aria-label={spec.label}>
        <span className="text-muted-foreground mr-1">{spec.label}</span>
        {spec.choices!.map((c) => (
          <button key={c} type="button" role="radio" aria-checked={value === c} onClick={() => set(value === c ? undefined : c)}
            className={cn("rounded-full border px-2 py-0.5 capitalize", value === c ? "bg-foreground text-background" : "hover:bg-accent")}>{c}</button>
        ))}
      </div>
    );
  }
  if (spec.kind === "number") {
    return (
      <label className="flex items-center gap-1 px-2 text-xs">
        <span className="text-muted-foreground">{spec.label}</span>
        <input type="number" min={spec.min} max={spec.max} value={typeof value === "number" ? value : ""}
          onChange={(e) => set(e.target.value === "" ? undefined : Math.round(Number(e.target.value)))} className={cn(FIELD, "w-20")} />
      </label>
    );
  }
  if (spec.kind === "urls") {
    return <textarea aria-label={spec.label} placeholder="One picture address a line (https://...)" rows={3} value={Array.isArray(value) ? value.join("\n") : ""}
      onChange={(e) => { const l = e.target.value.split("\n").map((s) => s.trim()); set(l.some(Boolean) ? l.filter((s, i) => s || i === l.length - 1) : undefined); }} className={FIELD} />;
  }
  const long = spec.kind === "text" && (spec.max ?? 0) > 500;
  const props = {
    "aria-label": spec.label,
    placeholder: spec.kind === "url" ? `${spec.label} (https://...)` : spec.label,
    value: typeof value === "string" ? value : "",
    onChange: (e: { target: { value: string } }) => set(e.target.value === "" ? undefined : e.target.value),
    className: cn(FIELD, k === "text" && "text-base"),
  };
  return long ? <textarea rows={2} {...props} /> : <input {...props} />;
}

/** A component in the editor: what it is, a small preview, and its values to fill in place. */
function ComponentView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const name = node.attrs.name as string;
  const props = (node.attrs.props ?? {}) as Props;
  const spec = componentByName(name);
  const parts = useContext(PartsContext);
  const Icon = ICONS[name] ?? LayersIcon;
  if (!spec) return <NodeViewWrapper data-drag-handle className="text-destructive my-3 text-sm">Not in the library</NodeViewWrapper>;
  let problem: string | null = null;
  try {
    checkComponent(name, props);
  } catch (e) {
    problem = e instanceof Error ? e.message.replace(/^<\w+> /, "") : "Not finished";
  }
  const set = (k: string) => (v: unknown) => {
    const next = { ...props } as Record<string, unknown>;
    if (v === undefined) delete next[k];
    else next[k] = v;
    updateAttributes({ props: next });
  };
  const part = name === "Part" ? parts.find((p) => p.source === props.source) : null;
  const fields = Object.entries(spec.props).filter(([k]) => !(name === "Part" && k === "source"));
  const src = safeUrl(props.src);
  return (
    <NodeViewWrapper data-site-component={name} className={cn("not-prose group/c my-4 rounded-xl border bg-card transition", selected && "ring-ring/50 ring-2")} contentEditable={false}>
      <div className="flex items-center gap-2 px-3 py-2">
        <Icon className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
        <span className="text-sm font-medium">{name === "Part" && part ? part.label : spec.label}</span>
        {name === "Part" && part && part.state !== "shared" ? <span className="text-muted-foreground text-xs">{part.state === "waiting" ? "Waiting for the household's OK" : "Not shared"}</span> : null}
        {name === "Part" && !part ? <span className="text-muted-foreground text-xs italic">This part is no longer shared.</span> : null}
        <Button type="button" variant="ghost" size="icon" className="ml-auto size-7 opacity-60 group-hover/c:opacity-100" aria-label={`Remove ${spec.label}`} onClick={() => deleteNode()}><Trash2Icon /></Button>
      </div>
      {name === "Photo" && src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={typeof props.alt === "string" ? props.alt : ""} className={cn("mx-3 mb-2 max-h-72 rounded-lg object-cover", props.shape === "round" ? "aspect-square w-40 rounded-full" : "w-[calc(100%-1.5rem)]")} />
      ) : null}
      {fields.length ? <div className="grid gap-1 px-1 pb-2">{fields.map(([k, p]) => <Field key={k} k={k} spec={p} value={props[k]} set={set(k)} />)}</div>
        : <p className="text-muted-foreground px-3 pb-3 text-sm">{spec.line}</p>}
      {problem && Object.keys(props).length ? <p className="text-muted-foreground px-3 pb-2 text-xs">{problem}</p> : null}
    </NodeViewWrapper>
  );
}

/**
 * The library's components as one Tiptap node, saved in the page's Markdown as an MDX tag with literal values only
 * (`@reflect/core/site-page`): the same strict parser reads it back and the public renderer draws it.
 */
export const SiteComponent = Node.create({
  name: "siteComponent",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,
  addAttributes() {
    return {
      name: { default: "Divider" },
      props: { default: {} },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-site-component]", getAttrs: (el) => ({ name: (el as HTMLElement).dataset.siteComponent ?? "Divider" }) }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-site-component": HTMLAttributes.name })];
  },
  addNodeView() {
    return ReactNodeViewRenderer(ComponentView);
  },
  markdownTokenName: "siteComponent",
  markdownTokenizer: {
    name: "siteComponent",
    level: "block",
    start(src: string) {
      const m = /^ {0,3}<[A-Z]/m.exec(src);
      return m ? m.index : -1;
    },
    tokenize(src: string) {
      if (!/^ {0,3}<[A-Z]/.test(src)) return undefined;
      const lead = /^ */.exec(src)![0].length;
      try {
        const { component, length } = parseTag(src.slice(lead));
        const rest = src.slice(lead + length);
        const eol = /^[ \t]*(\n|$)/.exec(rest);
        if (!eol) return undefined;
        return { type: "siteComponent", raw: src.slice(0, lead + length + eol[0].length), component };
      } catch {
        return undefined;
      }
    },
  },
  parseMarkdown(token, h) {
    const c = (token as unknown as { component: { name: string; props: Props } }).component;
    return h.createNode("siteComponent", { name: c.name, props: c.props }, []);
  },
  renderMarkdown(node) {
    const name = String(node.attrs?.name ?? "");
    const props = (node.attrs?.props ?? {}) as Props;
    try {
      return serializeTag(name, props);
    } catch {
      return looseTag(name, props);
    }
  },
});
