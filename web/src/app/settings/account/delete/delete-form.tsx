"use client";

// A4's confirmation: the person types their email address, and the one destructive button deletes the account. The
// server checks the address and the teams again (src/server/moving.ts), so the button being on is never the only door.
import { useState, useTransition } from "react";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteAccountAction } from "./actions";

export function DeleteAccountForm({ email, blocked }: { email: string; blocked: boolean }) {
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const matches = typed.trim().toLowerCase() === email.trim().toLowerCase();

  const submit = () => start(async () => {
    setError(null);
    const r = await deleteAccountAction(typed);
    if (!r.ok) { setError(r.error); return; }
    // The sessions are gone with the account, so the next page is sign-in.
    window.location.assign("/sign-in");
  });

  return (
    <form className="bg-card grid gap-3 rounded-2xl border p-4" onSubmit={(e) => { e.preventDefault(); if (matches && !blocked && !pending) submit(); }}>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium">Type your email address, <span className="font-semibold">{email}</span>, to confirm</span>
        <Input value={typed} onChange={(e) => { setTyped(e.target.value); setError(null); }} disabled={blocked} autoComplete="off" spellCheck={false} aria-label="Your email address" />
      </label>
      {error ? <p className="text-destructive text-sm" role="alert">{error}</p> : null}
      <Button type="submit" variant="destructive" className="justify-self-start" disabled={blocked || !matches || pending}>
        {pending ? <Loader2Icon className="animate-spin" /> : null}{pending ? "Deleting your account" : "Delete account"}
      </Button>
    </form>
  );
}
