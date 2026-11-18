"use client";

import { useEffect, useState } from "react";
import { CheckIcon } from "lucide-react";
import { handleProblem } from "@reflect/core/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Check = { state: "idle" | "checking" | "mine" | "free" | "invalid" | "taken"; problem?: string; suggestions?: string[] };

/** The one Handle field, checked as the person types: the rule first, then whether it is free. */
export function HandleField({ initial, current, action, error }: { initial: string; current: string | null; action: (f: FormData) => Promise<void>; error: string | null }) {
  const [value, setValue] = useState(initial);
  const [check, setCheck] = useState<Check>({ state: "idle" });

  useEffect(() => {
    const h = value.trim().toLowerCase().replace(/^@/, "");
    if (!h) return setCheck({ state: "idle" });
    const problem = handleProblem(h);
    if (problem) return setCheck({ state: "invalid", problem });
    if (h === current) return setCheck({ state: "mine" });
    setCheck({ state: "checking" });
    const ctl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/account/handle?h=${encodeURIComponent(h)}`, { signal: ctl.signal })
        .then((r) => r.json() as Promise<Check>)
        .then(setCheck)
        .catch(() => undefined);
    }, 250);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [value, current]);

  const clearing = !value.trim() && current !== null;
  const canSave = check.state === "free" || clearing;
  const line =
    check.state === "invalid" ? <span className="text-destructive">{check.problem}</span>
    : check.state === "taken" ? <span className="text-destructive">That handle is taken.</span>
    : check.state === "free" ? <span className="text-primary inline-flex items-center gap-1"><CheckIcon aria-hidden="true" className="size-4" />Free</span>
    : check.state === "mine" ? <span className="text-muted-foreground">This is your handle.</span>
    : check.state === "checking" ? <span className="text-muted-foreground">Checking</span>
    : clearing ? <span className="text-muted-foreground">Saving an empty field clears your handle.</span>
    : null;

  return (
    <form action={action} className="bg-card grid gap-3 rounded-2xl border p-4">
      <label className="grid gap-1.5">
        <span className="text-sm font-medium">Handle</span>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-base md:text-sm" aria-hidden="true">@</span>
          <Input name="handle" value={value} onChange={(e) => setValue(e.target.value)} maxLength={31} autoComplete="off" autoCapitalize="none" spellCheck={false} aria-invalid={check.state === "invalid" || check.state === "taken"} aria-describedby="handle-line" />
        </div>
      </label>
      <p id="handle-line" aria-live="polite" className="min-h-5 text-sm">{error && value === initial ? <span className="text-destructive">{error}</span> : line}</p>
      {check.state === "taken" && check.suggestions?.length ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm">Free:</span>
          {check.suggestions.map((s) => (
            <Button key={s} type="button" variant="outline" size="sm" onClick={() => setValue(s)}>@{s}</Button>
          ))}
        </div>
      ) : null}
      <Button type="submit" disabled={!canSave} className="justify-self-start">Save</Button>
    </form>
  );
}
