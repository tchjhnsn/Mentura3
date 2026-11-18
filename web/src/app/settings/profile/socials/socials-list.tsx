"use client";

import { useState, useTransition } from "react";
import { CheckIcon, ChevronRightIcon, CircleCheckIcon, CopyIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { normalizeLink, serviceById } from "@reflect/core/profile";
import { Group } from "@/components/list-rows";
import { ServiceIcon } from "@/components/service-icon";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { addSocialFromPage, confirmSocialFromPage, removeSocialFromPage } from "./actions";

export type LinkRow = { id: string; service: string; label: string; url: string; handle: string | null; confirmed: boolean; canConfirm: boolean; noConfirmLine: string | null };

const ROW = "hover:bg-accent flex min-h-14 w-full items-center gap-4 px-4 py-3 text-left transition";
const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};
const shown = (l: LinkRow) => (l.handle && l.service !== "website" ? (l.service === "substack" ? hostOf(l.url) : `@${l.handle.replace(/^@/, "")}`) : hostOf(l.url));

type Sheet = { kind: "link"; link: LinkRow } | { kind: "add"; service: string | null } | null;
type Failed = { reason: string; line: string };

/** The person's links, then services to add, then + Add; each opens a one-field sheet. */
export function SocialsList({ links, addable }: { links: LinkRow[]; addable: { id: string; label: string }[] }) {
  const [sheet, setSheet] = useState<Sheet>(null);
  return (
    <>
      {links.length ? (
        <Group title="Your links" id="yours">
          {links.map((l) => (
            <li key={l.id}>
              <button type="button" className={ROW} onClick={() => setSheet({ kind: "link", link: l })}>
                <ServiceIcon service={l.service} />
                <span className="grid min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-base">
                    {l.label}
                    {l.confirmed ? <CircleCheckIcon aria-label="Confirmed" className="text-primary size-4" /> : null}
                  </span>
                  <span className="text-muted-foreground truncate text-sm">{shown(l)}</span>
                </span>
                <ChevronRightIcon aria-hidden="true" className="text-muted-foreground size-4 shrink-0" />
              </button>
            </li>
          ))}
        </Group>
      ) : (
        <p className="text-muted-foreground text-center text-sm">No links yet. Add the places people can find you.</p>
      )}

      <Group title="Add" id="add">
        {addable.map((s) => (
          <li key={s.id}>
            <button type="button" className={ROW} onClick={() => setSheet({ kind: "add", service: s.id })}>
              <ServiceIcon service={s.id} />
              <span className="flex-1 text-base">{s.label}</span>
              <PlusIcon aria-hidden="true" className="text-muted-foreground size-4 shrink-0" />
            </button>
          </li>
        ))}
        <li>
          <button type="button" className={`${ROW} text-primary`} onClick={() => setSheet({ kind: "add", service: null })}>
            <span className="grid size-8 shrink-0 place-items-center"><PlusIcon className="size-5" /></span>
            <span className="text-base">Add</span>
          </button>
        </li>
      </Group>

      <Dialog open={sheet !== null} onOpenChange={(o) => (o ? null : setSheet(null))}>
        <DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-md">
          {sheet?.kind === "link" ? <LinkSheet key={sheet.link.id} link={sheet.link} done={() => setSheet(null)} /> : null}
          {sheet?.kind === "add" ? <AddSheet key={sheet.service ?? "any"} service={sheet.service} done={() => setSheet(null)} /> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function AddSheet({ service, done }: { service: string | null; done: () => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const known = service ? serviceById(service) : undefined;
  const seen = value.trim() ? normalizeLink(value, service ?? undefined) : null;
  const add = () =>
    start(async () => {
      const r = await addSocialFromPage(value, service);
      if (r.error) setError(r.error);
      else done();
    });
  return (
    <>
      <DialogHeader>
        <DialogTitle>{known ? `Add ${known.label}` : "Add a link"}</DialogTitle>
        <DialogDescription>{known && known.hosts.length ? "Paste your link or type your handle." : "Paste a link. Reflect recognises the service."}</DialogDescription>
      </DialogHeader>
      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <Input autoFocus value={value} onChange={(e) => (setValue(e.target.value), setError(null))} placeholder={known?.hosts.length ? `${known.hosts[0]}/yourname` : "https://"} aria-label="Link" maxLength={300} />
        <p className="text-muted-foreground min-h-5 text-sm">{seen ? `${serviceById(seen.service)?.label ?? "Link"}${seen.handle && seen.service !== "website" ? `, ${seen.handle}` : ""}` : value.trim() ? "Not a link yet." : ""}</p>
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
        <Button type="submit" disabled={!seen || pending} className="justify-self-end">Add</Button>
      </form>
    </>
  );
}

function LinkSheet({ link, done }: { link: LinkRow; done: () => void }) {
  const [value, setValue] = useState(link.url);
  const [error, setError] = useState<string | null>(null);
  const [failed, setFailed] = useState<Failed | null>(null);
  const [confirmed, setConfirmed] = useState(link.confirmed);
  const [pending, start] = useTransition();
  const changed = value.trim() !== link.url;
  const save = () =>
    start(async () => {
      const r = await addSocialFromPage(value, link.service, link.id);
      if (r.error) setError(r.error);
      else done();
    });
  const confirm = () =>
    start(async () => {
      setError(null);
      const r = await confirmSocialFromPage(link.id);
      if ("error" in r) setError(r.error);
      else if (r.confirmed) (setConfirmed(true), setFailed(null));
      else setFailed({ reason: r.reason ?? "That page has no rel=\"me\" link to your profile yet.", line: r.line });
    });
  const remove = () =>
    start(async () => {
      const r = await removeSocialFromPage(link.id);
      if (r.error) setError(r.error);
      else done();
    });
  const confirmFirst = link.canConfirm && !confirmed && !changed;
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <ServiceIcon service={link.service} className="size-7" />
          {link.label}
          {confirmed ? <CircleCheckIcon aria-label="Confirmed" className="text-primary size-4" /> : null}
        </DialogTitle>
        <DialogDescription>{confirmed ? "Confirmed: this page links back to your profile." : "Change the link, confirm it is yours, or remove it."}</DialogDescription>
      </DialogHeader>
      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (changed) save();
        }}
      >
        <Input value={value} onChange={(e) => (setValue(e.target.value), setError(null))} aria-label="Link" maxLength={300} />
        {!link.canConfirm && link.noConfirmLine ? <p className="text-muted-foreground text-sm">{link.noConfirmLine}</p> : null}
        {failed ? (
          <div className="grid gap-2 rounded-xl border p-3">
            <p className="text-sm">{failed.reason} Add this line to your page, then tap Confirm again:</p>
            <CopyLine text={failed.line} />
          </div>
        ) : null}
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon" aria-label="Remove" onClick={remove} disabled={pending} className="text-destructive">
            <Trash2Icon />
          </Button>
          <span className="flex-1" />
          {changed ? <Button type="submit" disabled={pending}>Save</Button> : null}
          {link.canConfirm && !confirmed && !changed ? (
            <Button type="button" variant={confirmFirst ? "default" : "outline"} onClick={confirm} disabled={pending}>
              {pending ? "Checking" : "Confirm"}
            </Button>
          ) : null}
        </div>
      </form>
    </>
  );
}

/** A line of code to paste into a page, with a button that copies it. */
function CopyLine({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex min-w-0 items-center gap-2">
      <code className="bg-muted min-w-0 flex-1 rounded-md px-3 py-2 text-xs break-all">{text}</code>
      <Button type="button" variant="outline" size="icon" aria-label={copied ? "Copied" : "Copy"} onClick={() => void navigator.clipboard.writeText(text).then(() => setCopied(true))}>
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Button>
    </div>
  );
}
