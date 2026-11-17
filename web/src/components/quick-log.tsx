"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type LogChoice = { id: string; label: string; /** The amounts to pick from, such as minutes or hours; none logs at once. */ amounts?: { value: number; label: string }[] };

/**
 * Logging in two taps (doc "Tile designs"): a sheet of choice chips, then one row of amounts, then Keep. No labelled
 * inputs. The tile's server action keeps it.
 */
export function QuickLog({ title, choices, action, trigger, variant = "default" }: { title: string; choices: LogChoice[]; action: (kind: string, amount: number | null) => Promise<void>; trigger: ReactNode; variant?: "default" | "outline" }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState(choices[0]!.id);
  const [amount, setAmount] = useState<number | null>(null);
  const [pending, start] = useTransition();
  const choice = choices.find((c) => c.id === kind)!;
  const pickKind = (id: string) => { setKind(id); setAmount(null); };
  const keep = () => start(async () => { await action(kind, amount); setOpen(false); setAmount(null); });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant={variant}>{trigger}</Button></DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="grid gap-5">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="What">
            {choices.map((c) => (
              <button key={c.id} type="button" role="radio" aria-checked={kind === c.id} onClick={() => pickKind(c.id)}
                className={cn("rounded-full border px-3.5 py-1.5 text-sm transition", kind === c.id ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent")}>{c.label}</button>
            ))}
          </div>
          {choice.amounts?.length ? (
            <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="How much">
              {choice.amounts.map((a) => (
                <button key={a.value} type="button" role="radio" aria-checked={amount === a.value} onClick={() => setAmount(a.value)}
                  className={cn("rounded-lg border py-2.5 text-sm font-medium transition", amount === a.value ? "border-primary bg-primary/10" : "hover:bg-accent")}>{a.label}</button>
              ))}
            </div>
          ) : null}
          <Button onClick={keep} disabled={pending || (!!choice.amounts?.length && amount === null)} size="lg">{pending ? "Keeping" : "Keep"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
