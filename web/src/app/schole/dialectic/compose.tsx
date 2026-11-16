"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { topicPostAction } from "./actions";

export type TagGroup = { label: string; options: { value: string; label: string }[] };

/**
 * Writing a post or a reply: up to the post limit, with what is left counted, and a topic to tag it with (optional)
 * unless the place it is written in sets one.
 */
export function Compose({ path, max, placeholder, topic, parent, tags, rows = 3, cta = "Post" }: {
  path: string; max: number; placeholder: string; topic?: string; parent?: string; tags?: TagGroup[]; rows?: number; cta?: string;
}) {
  const [n, setN] = useState(0);
  return (
    <form action={topicPostAction} className="space-y-2" onSubmit={() => setTimeout(() => setN(0), 0)}>
      <input type="hidden" name="path" value={path} />
      {topic ? <input type="hidden" name="topic" value={topic} /> : null}
      {parent ? <input type="hidden" name="parent" value={parent} /> : null}
      <Textarea name="body" required rows={rows} maxLength={max} placeholder={placeholder} aria-label={placeholder} onChange={(e) => setN(e.target.value.length)} className="resize-none text-[15px]" />
      <div className="flex items-center gap-2">
        {tags?.length ? (
          <select name="topic" defaultValue="" aria-label="Topic" className="border-input bg-background text-muted-foreground h-8 min-w-0 flex-1 truncate rounded-md border px-2 text-sm sm:max-w-64">
            <option value="">No topic</option>
            {tags.map((g) => <optgroup key={g.label} label={g.label}>{g.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</optgroup>)}
          </select>
        ) : <span className="flex-1" />}
        <span className={`text-xs tabular-nums ${max - n < 40 ? "text-destructive" : "text-muted-foreground"}`}>{max - n}</span>
        <Button type="submit" size="sm" className="rounded-full px-4">{cta}</Button>
      </div>
    </form>
  );
}
