import { GlobeIcon } from "lucide-react";
import { serviceById } from "@reflect/core/profile";
import { cn } from "@/lib/utils";

// A stand-in for profile-socials' ServiceIcon (same path and signature); their version replaces this on merge.
/** A linked account's icon: a globe for a website, else the service's two-letter monogram. */
export function ServiceIcon({ service, className }: { service: string; className?: string }) {
  if (service === "website" || service === "mastodon") return <GlobeIcon className={cn("size-4", className)} aria-hidden="true" />;
  const label = serviceById(service)?.label ?? "Link";
  return <span aria-hidden="true" className={cn("inline-grid size-4 place-items-center text-[0.6rem] font-semibold leading-none", className)}>{label.slice(0, 2)}</span>;
}
