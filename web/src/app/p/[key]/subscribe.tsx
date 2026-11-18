"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { subscribeToSite } from "./actions";

/** Subscribe on someone's site: one email field, then a line saying what happens next. */
export function SubscribeButton({ ownerId, name, className, size }: { ownerId: string; name: string; className?: string; size?: "sm" | "default" | "lg" }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const go = () =>
    start(async () => {
      setError(null);
      const r = await subscribeToSite(ownerId, email);
      if ("error" in r) return setError(r.error);
      setDone(r.confirmed ? "You already get this writing by email." : r.sent ? "Check your email and tap the link to confirm." : "Saved. This site cannot send email yet, so your confirmation link comes once it can.");
    });
  return (
    <>
      <Button type="button" size={size} className={cn(className)} onClick={() => { setDone(null); setError(null); setOpen(true); }}>Subscribe</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Get {name}&apos;s writing</DialogTitle>
            <DialogDescription>New posts by email. You confirm by a link first, and can leave any time.</DialogDescription>
          </DialogHeader>
          {done ? (
            <p className="text-sm" role="status">{done}</p>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); go(); }} className="grid gap-3">
              <Input type="email" required autoComplete="email" placeholder="you@example.com" aria-label="Your email" value={email} onChange={(e) => setEmail(e.target.value)} />
              {error ? <p className="text-destructive text-sm" role="alert">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={pending}>{pending ? "Subscribing" : "Subscribe"}</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
