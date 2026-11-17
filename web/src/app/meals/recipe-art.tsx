import { UtensilsIcon } from "lucide-react";
import type { Region } from "@reflect/core/recipes";
import { cn } from "@/lib/utils";

// Food has no photographs yet: each recipe shows a tint of its region with a plate mark in their place.
const TINT: Record<Region, string> = {
  south: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  creole: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  "tex-mex": "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  midwest: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  everyday: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
};

export function RecipeArt({ region, className }: { region: Region; className?: string }) {
  return (
    <span aria-hidden="true" className={cn("grid shrink-0 place-items-center rounded-xl", TINT[region], className)}>
      <UtensilsIcon className="size-1/3 max-h-10 max-w-10" />
    </span>
  );
}
