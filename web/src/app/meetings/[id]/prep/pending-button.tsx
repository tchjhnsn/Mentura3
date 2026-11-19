"use client";

import type { ComponentProps, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

/** A submit button that says what it is doing while its form runs (drafting takes a while). */
export function PendingButton({ pending, children, ...rest }: ComponentProps<typeof Button> & { pending: ReactNode }) {
  const s = useFormStatus();
  return <Button type="submit" {...rest} disabled={s.pending || rest.disabled} aria-busy={s.pending}>{s.pending ? pending : children}</Button>;
}
