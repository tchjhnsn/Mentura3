"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon, MoreHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

/** An invite link shown in full, with a button that copies it. */
export function CopyField({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex min-w-0 items-center gap-2">
      <code className="bg-muted min-w-0 flex-1 truncate rounded-md px-3 py-2 text-xs">{url}</code>
      <Button type="button" variant="outline" size="icon" aria-label={copied ? "Copied" : "Copy link"} onClick={() => { void navigator.clipboard.writeText(url).then(() => setCopied(true)); }}>
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Button>
    </div>
  );
}

/**
 * The host's More menu: copy each guest's invite link, take shared notes back, and cancel or restore the meeting.
 * The actions are server actions bound on the page.
 */
export function MoreMenu({ links, cancelled, onCancel, notesShared, onUnshare }: {
  links: { guestId: string; label: string; url: string }[];
  cancelled: boolean;
  onCancel: () => Promise<void>;
  notesShared: boolean;
  onUnshare: () => Promise<void>;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (guestId: string, url: string) => { void navigator.clipboard.writeText(url).then(() => setCopied(guestId)); };
  return (
    <DropdownMenu onOpenChange={(open) => { if (!open) setCopied(null); }}>
      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="More"><MoreHorizontalIcon /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-w-72">
        {links.map((l) => (
          <DropdownMenuItem key={l.guestId} onSelect={(e) => { e.preventDefault(); copy(l.guestId, l.url); }}>
            {copied === l.guestId ? <CheckIcon /> : <CopyIcon />}
            <span className="truncate">{copied === l.guestId ? "Copied" : `Copy invite link for ${l.label}`}</span>
          </DropdownMenuItem>
        ))}
        {links.length ? <DropdownMenuSeparator /> : null}
        {notesShared ? (
          <form action={onUnshare}>
            <DropdownMenuItem asChild><button type="submit" className="w-full">Stop sharing notes</button></DropdownMenuItem>
          </form>
        ) : null}
        <form action={onCancel}>
          {cancelled
            ? <DropdownMenuItem asChild><button type="submit" className="w-full">Restore meeting</button></DropdownMenuItem>
            : <DropdownMenuItem asChild variant="destructive"><button type="submit" className="w-full">Cancel meeting</button></DropdownMenuItem>}
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
