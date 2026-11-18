import { GlobeIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// A small mark for a linked service (Socials, the profile's socials row). lucide has no brand marks, and logos are
// their owners', so each service is a short monogram in a rounded tile; a website is a globe.
const MARK: Record<string, string> = {
  linkedin: "in", x: "X", instagram: "IG", github: "GH", youtube: "YT", tiktok: "TT", bluesky: "Bs", threads: "Th", facebook: "f", substack: "S", mastodon: "M",
};

export function ServiceIcon({ service, className }: { service: string; className?: string }) {
  const mark = MARK[service];
  return (
    <span aria-hidden="true" className={cn("bg-muted text-foreground grid size-8 shrink-0 place-items-center rounded-lg text-xs font-semibold", className)}>
      {mark ?? <GlobeIcon className="size-4" />}
    </span>
  );
}
