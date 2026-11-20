"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronDownIcon, ExternalLinkIcon } from "lucide-react";
import { excerpt, isSlug, readingMinutes, slugify } from "@reflect/core/site";
import { OCCASIONS, VIRTUES, type Occasion } from "@reflect/core/presentation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { SitePresenting } from "@/server/actions/presentations";
import { draftSitePresentationAction, publishWorkAction, republishAction, unpublishWorkAction, type GateAnswer, type Published } from "./publish-actions";

const SELECT = "border-input bg-background h-9 w-full rounded-md border px-3 text-sm";
/** The occasion kinds of Rhetoric I.3, as the sheet names them. */
const OCCASION_LABEL: Record<Occasion, string> = { deliberative: "Deliberative: about what to do", judicial: "Judicial: about what was done", ceremonial: "Ceremonial: praise or ceremony" };

/**
 * The Publish sheet (doc "Personal site and blog design guide", page 3): a preview of the post, its address on the
 * site, its presentation record (Reflect framework plan, step 6: who you speak as, for what end, to whom, with the six
 * circumstances optional), the gate's answer, and one filled button that publishes only once the record passes the
 * gate. A published work shows Update the post and Unpublish. The journal itself never leaves.
 */
export function PublishButton({ workId, siteBase, initial, read, save, mail, presenting }: {
  workId: string;
  siteBase: string;
  initial: Published | null;
  read: () => { title: string; body: string };
  save: () => Promise<void>;
  /** How the site sends email (the person's email connector, or Reflect), and how many confirmed subscribers it has. */
  mail: { via: string | null; subscribers: number };
  /** The site channel of the person's presentation policy, or null when it has none. */
  presenting: SitePresenting | null;
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
  const [repoNote, setRepoNote] = useState<{ ok: boolean; text: string } | null>(null);
  const canMail = !!mail.via && mail.subscribers > 0;

  // The presentation record: a new one each time the sheet opens, started from the last record on the channel.
  const rules = presenting?.rules ?? [];
  const lastRule = presenting?.last ? rules.findIndex((r) => r.role === presenting.last!.role && r.end === presenting.last!.end) : -1;
  const [rule, setRule] = useState<number>(lastRule);
  const [audience, setAudience] = useState("");
  const [relation, setRelation] = useState("");
  const [six, setSix] = useState({ what: "", about: "", means: "", how: "", occasion: "", virtue: "" });
  const [recordId, setRecordId] = useState<string | null>(null);
  const [gate, setGate] = useState<GateAnswer | null>(null);
  // Any change to the record means the gate must be asked again before Publish.
  const changed = <T,>(set: (v: T) => void) => (v: T) => { set(v); setGate(null); };

  const show = () => {
    const d = read();
    setDraft(d);
    setSlug(post?.slug ?? slugify(d.title || "post"));
    setEdited(false);
    setError(null);
    setUndo(null);
    setRepoNote(null);
    setRule(lastRule);
    setAudience(presenting?.last?.audience || presenting?.audience || "");
    setRelation(presenting?.last?.relation ?? "");
    setSix({ what: d.title ? `The post "${d.title}"` : "", about: "", means: "", how: "", occasion: "", virtue: "" });
    setRecordId(null);
    setGate(null);
    setOpen(true);
  };
  const check = () =>
    start(async () => {
      setError(null);
      const r = rules[rule];
      const g = await draftSitePresentationAction({ ...(recordId ? { id: recordId } : {}), role: r?.role ?? "", end: r?.end ?? "", audience, relation, ...six });
      if ("error" in g) return setError(g.error);
      setRecordId(g.id);
      setGate(g);
    });
  const publish = () =>
    start(async () => {
      if (!gate?.ready) return;
      setError(null);
      await save();
      const r = await publishWorkAction(workId, edited || post ? slug || null : null, canMail && email, gate.id);
      if ("error" in r) return setError(r.error);
      setPost(r);
      setEmailed(canMail && email ? (r.emailed ?? 0) : null);
      setRepoNote(r.repoError ? { ok: false, text: `Not written to your repository: ${r.repoError}` } : r.repo ? { ok: true, text: `Committed to your repository at ${r.repo}. Your host deploys it.` } : null);
      setEmail(false);
      setSlug(r.slug);
      // The record was for this appearance; the next publish starts a new one.
      setRecordId(null);
      setGate(null);
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
  const ready = gate?.ready === true;
  const publishLabel = pending ? (post ? "Updating" : "Publishing") : !draft.title.trim() && !post ? "Give it a title first" : !ready ? "Check the presentation first" : post ? (presenting?.repo ? `Update the post and commit to ${presenting.repo}` : "Update the post") : presenting?.repo ? `Publish and commit to ${presenting.repo}` : "Publish to your site";
  return (
    <>
      <Button type="button" size="sm" variant={post ? "ghost" : "outline"} className="ml-1 h-8" onMouseDown={(e) => e.preventDefault()} onClick={show}>
        {post ? "Published" : "Publish"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
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

          <section className="grid gap-3 rounded-xl border p-4" aria-labelledby="presentation-heading">
            <div className="grid gap-0.5">
              <span id="presentation-heading" className="text-sm font-medium">How you appear</span>
              <span className="text-muted-foreground text-xs">Before it goes out, say who you speak as, for what end, and to whom. Only you approve.</span>
            </div>
            {presenting ? (
              <>
                <label className="grid gap-1.5">
                  <span className="text-sm">Who acts, and for what end</span>
                  <select aria-label="Who acts, and for what end" className={SELECT} value={rule} onChange={(e) => changed(setRule)(Number(e.target.value))}>
                    <option value={-1}>Choose a role and an end</option>
                    {rules.map((r, i) => <option key={`${r.role}-${r.end}`} value={i}>As {r.role}, to {r.end} ({r.content})</option>)}
                  </select>
                </label>
                <label className="grid gap-1.5">
                  <span className="text-sm">Who will see or hear it</span>
                  <Input value={audience} onChange={(e) => changed(setAudience)(e.target.value)} placeholder="anyone who looks you up" />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-sm">Your relation to them</span>
                  <Input value={relation} onChange={(e) => changed(setRelation)(e.target.value)} placeholder="Optional, such as a colleague or a stranger" disabled={!audience.trim()} />
                </label>
                <Collapsible>
                  <CollapsibleTrigger className="text-muted-foreground hover:text-foreground group inline-flex items-center gap-1 text-sm">
                    The six circumstances (optional) <ChevronDownIcon className="size-3.5 transition group-data-[state=open]:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="grid gap-3 pt-3">
                    {([
                      ["what", "What is done or said"],
                      ["about", "About what, or to whom"],
                      ["means", "By what means"],
                      ["how", "How: the manner"],
                    ] as const).map(([k, label]) => (
                      <label key={k} className="grid gap-1.5">
                        <span className="text-sm">{label}</span>
                        <Input value={six[k]} onChange={(e) => changed(setSix)({ ...six, [k]: e.target.value })} />
                      </label>
                    ))}
                    <label className="grid gap-1.5">
                      <span className="text-sm">The occasion</span>
                      <select aria-label="The occasion" className={SELECT} value={six.occasion} onChange={(e) => changed(setSix)({ ...six, occasion: e.target.value })}>
                        <option value="">Not said</option>
                        {OCCASIONS.map((o) => <option key={o} value={o}>{OCCASION_LABEL[o]}</option>)}
                      </select>
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-sm">The virtue at stake</span>
                      <select aria-label="The virtue at stake" className={SELECT} value={six.virtue} onChange={(e) => changed(setSix)({ ...six, virtue: e.target.value })}>
                        <option value="">Not said</option>
                        {VIRTUES.map((v) => <option key={v.id} value={v.id}>{v.name}, between {v.excess} and {v.deficiency}</option>)}
                      </select>
                    </label>
                  </CollapsibleContent>
                </Collapsible>
                <Button type="button" variant="outline" onClick={check} disabled={pending}>{recordId ? "Save and check the presentation again" : "Save and check the presentation"}</Button>
                {gate ? (
                  gate.ready ? (
                    <div className="grid gap-1 text-sm" role="status">
                      <span>Ready to go out: as {gate.rule.role}, to {gate.rule.end}.</span>
                      <span className="text-muted-foreground text-xs">Read it once more: {gate.checks.join(" ")}</span>
                    </div>
                  ) : (
                    <div className="text-destructive grid gap-1 text-sm" role="status">
                      <span>Not ready to go out. Still needed:</span>
                      <ul className="list-disc pl-5">{gate.missing.map((m) => <li key={m.item + m.message}>{m.message}</li>)}</ul>
                    </div>
                  )
                ) : null}
              </>
            ) : (
              <p className="text-destructive text-sm">Your presentation policy has no channel for your site, so nothing can be published from here.</p>
            )}
          </section>

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
          {repoNote ? <p className={cn("text-sm", !repoNote.ok && "text-destructive")} role="status">{repoNote.text}</p> : null}
          {error ? <p className="text-destructive text-sm" role="alert">{error}</p> : null}
          {undo ? (
            <p className="text-sm" role="status">
              Taken down from your site.{" "}
              <button type="button" className="underline underline-offset-2" onClick={() => putBack(undo)} disabled={pending}>Undo</button>
            </p>
          ) : null}
          {post ? (
            <div className="grid gap-2">
              <Button type="button" className="w-full" onClick={publish} disabled={pending || !okSlug || !ready}>{publishLabel}</Button>
              <div className="flex items-center justify-between">
                <Link href={post.href} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm" target="_blank">
                  View post <ExternalLinkIcon className="size-3.5" />
                </Link>
                <Button type="button" variant="ghost" size="sm" className={cn("text-muted-foreground")} onClick={unpublish} disabled={pending}>Unpublish</Button>
              </div>
            </div>
          ) : (
            <Button type="button" className="w-full" onClick={publish} disabled={pending || !okSlug || !draft.title.trim() || !ready}>{publishLabel}</Button>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
