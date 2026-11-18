import { cn } from "@/lib/utils";

/** A connector's mark: its initial on a color picked from its id, since Reflect ships no other companies' logos. */
export function Mark({ id, name, size = "size-10 text-base" }: { id: string; name: string; size?: string }) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return (
    <span aria-hidden className={cn("grid shrink-0 place-items-center rounded-xl font-semibold text-white", size)} style={{ background: `oklch(0.55 0.12 ${h})` }}>
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
