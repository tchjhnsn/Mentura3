"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

/** Continue with Google, linking a Google account to the signed-in one (Better Auth's linkSocial). */
export function GoogleLink() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <li>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          const r = await authClient.linkSocial({ provider: "google", callbackURL: "/settings/account/sign-in?linked=1" }).catch(() => null);
          if (!r || r.error) {
            setError(r?.error?.message ?? "Could not reach Google.");
            setBusy(false);
          }
        }}
        className="text-primary hover:bg-accent flex min-h-14 w-full items-center gap-4 px-4 py-3 text-left transition disabled:opacity-60"
      >
        <span className="grid min-w-0 flex-1">
          <span className="text-base">Continue with Google</span>
          {error ? <span className="text-destructive text-sm">{error}</span> : <span className="text-muted-foreground text-sm">Sign in with your Google account too</span>}
        </span>
      </button>
    </li>
  );
}
