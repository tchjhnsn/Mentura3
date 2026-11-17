import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { connectorsFor } from "@reflect/core/connectors";
import { Group } from "@/components/list-rows";
import { ConnectorRow } from "@/components/connector-rows";
import { connections } from "@/server/connections-store";

/**
 * The Connections group at the foot of a tile (design guide "Connections interface", Page 3): only the connectors that
 * feed this tile, or this part of it, connected ones first, then a row to every connection in Settings.
 */
export async function TileConnections({ userId, app, kind }: { userId: string; app: string; kind?: string | null }) {
  const list = connectorsFor(app, kind);
  if (!list.length) return null;
  const of = new Map((await connections(userId)).map((s) => [s.id, s]));
  const rank = (id: string) => ({ connected: 0, "not-connected": 1, unavailable: 2 })[of.get(id)?.state ?? "unavailable"];
  return (
    <Group title="Connections" id="connections">
      {[...list].sort((a, b) => rank(a.id) - rank(b.id)).map((c) => <ConnectorRow key={c.id} c={c} s={of.get(c.id)} />)}
      <li>
        <Link href="/settings/connections" className="text-muted-foreground hover:bg-accent flex min-h-11 items-center gap-4 px-4 py-2 text-sm transition">
          <span className="flex-1">All connections</span>
          <ChevronRightIcon aria-hidden="true" className="size-4" />
        </Link>
      </li>
    </Group>
  );
}
