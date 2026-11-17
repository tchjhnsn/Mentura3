"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { McpAllows } from "@/server/mcp-call";

/** What the identity scopes let the app do, in the person's words. The "journal" scope is shown as `allows`. */
const SAYS: Record<string, string> = {
  profile: "See your name.",
  offline_access: "Stay connected until you disconnect it in Settings, Connections.",
};

/** One tier of what the app may do, with each action's title under a disclosure. */
function Tier({ says, titles }: { says: string; titles: string[] }) {
  if (!titles.length) return null;
  return (
    <li>
      <details>
        <summary className="cursor-pointer">{says}</summary>
        <ul className="text-muted-foreground mt-1 list-disc space-y-0.5 pl-5">
          {titles.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </details>
    </li>
  );
}

export function Consent({ name, scope, allows }: { name: string | null; scope: string; allows: McpAllows }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scopes = scope.split(" ");
  const asks = Object.keys(SAYS).filter((s) => scopes.includes(s));

  const answer = async (accept: boolean) => {
    setPending(true);
    setError(null);
    const result = await authClient.oauth2.consent({ accept });
    setPending(false);
    const url = (result.data as { url?: string } | null)?.url;
    if (result.error) setError(result.error.message ?? "That didn't work. Try again.");
    else if (url) window.location.href = url;
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardDescription>Reflect</CardDescription>
          <CardTitle className="text-xl">Connect an app to Reflect?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>{name ? `An app that calls itself “${name}”` : "An app"} is asking to use Reflect for you. It will be able to:</p>
          <ul className="list-disc space-y-2 pl-5">
            {scopes.includes("journal") ? (
              <>
                <Tier says={`Read your records in Reflect (${allows.read.length} things)`} titles={allows.read} />
                <Tier says={`Change your own record when you ask it to (${allows.own.length} things). Most of these can be undone in Reflect.`} titles={allows.own} />
                <Tier says={`Ask for things that reach other people or leave Reflect (${allows.held.length}). These are not done until you tap Keep or Send in Reflect.`} titles={allows.held} />
              </>
            ) : null}
            {asks.map((s) => (
              <li key={s}>{SAYS[s]}</li>
            ))}
          </ul>
          <p className="text-muted-foreground">Nothing it suggests is kept unless you say yes to it. You can disconnect it at any time in Settings, Connections.</p>
          {error ? <p className="text-destructive" role="alert">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" disabled={pending} onClick={() => answer(false)}>Don’t allow</Button>
            <Button type="button" disabled={pending} onClick={() => answer(true)}>Allow</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
