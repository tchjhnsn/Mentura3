"use client";

import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Accept = (newGuest: boolean) => Promise<{ id: string } | { error: string }>;

// A full page load into the meeting, so the layout drops or keeps the sidebar for the account that just signed in.
const open = (id: string) => window.location.assign(`/meetings/${id}`);

/** Already signed in: who they are, and Join. */
export function JoinAs({ name, accept }: { name: string | null; accept: Accept }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const join = async () => {
    setPending(true);
    setError(null);
    const r = await accept(false);
    if ("id" in r) open(r.id);
    else { setError(r.error); setPending(false); }
  };
  return (
    <div className="grid gap-3">
      <p className="text-muted-foreground text-sm">{name ? `Signed in as ${name}` : "Signed in"}</p>
      {error ? <p className="text-destructive text-sm" role="alert">{error}</p> : null}
      <Button type="button" className="w-full" disabled={pending} onClick={() => void join()}>Join</Button>
    </div>
  );
}

/**
 * Not signed in: make a guest account (name, email, password, the age line), or sign in to an account the person
 * already has. Either way the invite is then taken for them and the meeting opens.
 */
export function GuestForm({ accept }: { accept: Accept }) {
  const [mode, setMode] = useState<"sign-up" | "sign-in">("sign-up");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adult, setAdult] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    // "adult" is checked by the server's sign-up hook (@/server/adult); the client's type does not list it.
    const signUp = { email, password, name: name.trim(), adult };
    const result = mode === "sign-up" ? await authClient.signUp.email(signUp) : await authClient.signIn.email({ email, password });
    if (result.error) {
      setError(result.error.message ?? "That did not work. Try again.");
      setPending(false);
      return;
    }
    const r = await accept(mode === "sign-up");
    if ("id" in r) open(r.id);
    else { setError(r.error); setPending(false); }
  };

  return (
    <form className="grid gap-4" onSubmit={(e) => void submit(e)}>
      {mode === "sign-up" ? (
        <div className="grid gap-1.5">
          <label className="text-sm font-medium" htmlFor="name">Name</label>
          <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
      ) : null}
      <div className="grid gap-1.5">
        <label className="text-sm font-medium" htmlFor="email">Email</label>
        <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="grid gap-1.5">
        <label className="text-sm font-medium" htmlFor="password">Password</label>
        <Input id="password" type="password" autoComplete={mode === "sign-up" ? "new-password" : "current-password"} minLength={10} value={password} onChange={(e) => setPassword(e.target.value)} required />
        {mode === "sign-up" ? <span className="text-muted-foreground text-xs">At least 10 characters.</span> : null}
      </div>
      {mode === "sign-up" ? (
        <label className="flex items-start gap-2 text-sm" htmlFor="adult">
          <input id="adult" type="checkbox" className="accent-primary mt-0.5 size-4" checked={adult} onChange={(e) => setAdult(e.target.checked)} required />
          <span>I am 18 or older</span>
        </label>
      ) : null}
      {error ? <p className="text-destructive text-sm" role="alert">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>{mode === "sign-up" ? "Create guest account" : "Sign in"}</Button>
      <button type="button" className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-2" onClick={() => { setMode(mode === "sign-up" ? "sign-in" : "sign-up"); setError(null); }}>
        {mode === "sign-up" ? "Have an account? Sign in" : "New here? Create a guest account"}
      </button>
    </form>
  );
}
