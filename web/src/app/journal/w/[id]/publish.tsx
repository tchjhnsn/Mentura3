"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ExternalLinkIcon } from "lucide-react";
import { excerpt, isSlug, readingMinutes, slugify } from "@reflect/core/site";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { publishWorkAction, republishAction, unpublishWorkAction, type Published } from "./publish-actions";

/**
 * The Publish sheet (doc "Personal site and blog design guide", page 3): a preview of the post, its address on the
 * site, and one filled button. A published work shows Update post and Unpublish. The journal itself never leaves.
 */
export function PublishButton({ workId, siteBase, initial, read, save, mail }: {
  workId: string;
  siteBase: string;
  initial: Published | null;
  read: () => { title: string; body: string };
  save: () => Promise<void>;
  /** How the site sends email (the person's email connector, or Reflect), and how many confirmed subscribers it has. */
  mail: { via: string | null; subscribers: number };
}) {
  const [open, setOpen] = useState(false);
  const [post, setPost] = useState<Published | null>(initial);
  const [draft, setDraft] = useState<{ title: string; body: string }>({ title: "", body: "" });
  const [slug, setSlug] = useState(initial?.slug ?? "");
  // A slug the person did not touch is a suggestion: the site picks a free one near it.
  const [edited, setEdited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [undo, setUndo] = useState<{ postId: string; post: Published } | null>(null);
  const [pending, start] = useTransition();
  const [email, setEmail] = useState(false);
  const [emailed, setEmailed] = useState<number | null>(null);
  const canMail = !!mail.via && mail.subscribers > 0;

  const show = () => {
    const d = read();
    setDraft(d);
    setSlug(post?.slug ?? slugify(d.title || "post"));
    setEdited(false);
    setError(null);
    setUndo(null);
    setOpen(true);
  };
  const publish = () =>
    start(async () => {
      setError(null);
      await save();
      const r = await publishWorkAction(workId, edited || post ? slug || null : null, canMail && email);
      if ("error" in r) return setError(r.error);
      setPost(r);
      setEmailed(canMail && email ? (r.emailed ?? 0) : null);
      setEmail(false);
      setSlug(r.slug);
    });
  const unpublish = () =>
    start(async () => {
      const r = await unpublishWorkAction(workId);
      if ("error" in r) return setError(r.error);
      if (r.postId && post) setUndo({ postId: r.postId, post });
      setPost(null);
    });
  const putBack = (u: { postId: string; post: Published }) =>
    start(async () => {
      const r = await republishAction(u.postId);
      if ("error" in r) return setError(r.error);
      setUndo(null);
      setPost(u.post);
      setSlug(u.post.slug);
    });

  const okSlug = isSlug(slug);
  return (
    <>
      <Button type="button" size="sm" variant={post ? "ghost" : "outline"} className="ml-1 h-8" onMouseDown={(e) => e.preventDefault()} onClick={show}>
        {post ? "Published" : "Publish"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{post ? "On your site" : "Publish to your site"}</DialogTitle>
            <DialogDescription>A copy goes on your site. Your journal stays private.</DialogDescription>
          </DialogHeader>
          <div className="bg-muted/40 grid gap-1 rounded-xl border p-4">
            <span className="font-serif text-lg leading-snug font-semibold">{draft.title || "Untitled"}</span>
            <span className="text-muted-foreground line-clamp-3 font-serif text-sm">{excerpt(draft.body, 220) || "Nothing written yet."}</span>
            <span className="text-muted-foreground text-xs">{readingMinutes(draft.body)} min read</span>
          </div>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Address</span>
            <span className="focus-within:ring-ring/50 flex items-center rounded-md border text-sm focus-within:ring-2">
              <span className="text-muted-foreground truncate pl-3">{siteBase}/</span>
              <input
                value={slug}
                onChange={(e) => { setEdited(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 60)); }}
                aria-label="Address"
                className="min-w-0 flex-1 bg-transparent py-2 pr-3 outline-none"
              />
            </span>
          </label>
          <div className={cn("flex items-center justify-between gap-3", !canMail && "opacity-60")}>
            <span className="grid">
              <span className="text-sm font-medium">Email it to subscribers</span>
              <span className="text-muted-foreground text-xs">
                {!mail.via ? <>Connect an email account in the <Link href="/marketplace?c=email" className="underline underline-offset-2">marketplace</Link> first.</> : mail.subscribers ? `${mail.subscribers} ${mail.subscribers === 1 ? "subscriber" : "subscribers"}, sent through ${mail.via}.` : "No subscribers yet."}
              </span>
            </span>
            <button type="button" role="switch" aria-checked={email} aria-label="Email it to subscribers" disabled={!canMail} onClick={() => setEmail((v) => !v)}
              className={cn("inline-flex h-6 w-10 shrink-0 items-center rounded-full border p-0.5 transition", email ? "bg-primary justify-end" : "bg-muted")}>
              <span className="bg-background size-4 rounded-full shadow" />
            </button>
          </div>
          {emailed !== null ? <p className="text-sm" role="status">Emailed to {emailed} {emailed === 1 ? "subscriber" : "subscribers"}.</p> : null}
          {error ? <p className="text-destructive text-sm" role="alert">{error}</p> : null}
          {undo ? (
            <p className="text-sm" role="status">
              Taken down from your site.{" "}
              <button type="button" className="underline underline-offset-2" onClick={() => putBack(undo)} disabled={pending}>Undo</button>
            </p>
          ) : null}
          {post ? (
            <div className="grid gap-2">
              <Button type="button" className="w-full" onClick={publish} disabled={pending || !okSlug}>{pending ? "Updating" : "Update post"}</Button>
              <div className="flex items-center justify-between">
                <Link href={post.href} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm" target="_blank">
                  View post <ExternalLinkIcon className="size-3.5" />
                </Link>
                <Button type="button" variant="ghost" size="sm" className={cn("text-muted-foreground")} onClick={unpublish} disabled={pending}>Unpublish</Button>
              </div>
            </div>
          ) : (
            <Button type="button" className="w-full" onClick={publish} disabled={pending || !okSlug || !draft.title.trim()}>
              {pending ? "Publishing" : draft.title.trim() ? "Publish" : "Give it a title first"}
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
