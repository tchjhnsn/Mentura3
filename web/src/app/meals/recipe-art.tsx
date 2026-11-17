import { UtensilsIcon } from "lucide-react";
import { photoOf } from "@reflect/core/food-photos";
import { recipeOf, type Region } from "@reflect/core/recipes";
import { cn } from "@/lib/utils";

// A recipe's photo, from Wikimedia Commons under its stated licence (`@reflect/core/food-photos`, credited on the
// recipe's page). A recipe of the person's own, with no photo, shows a tint with a plate mark.
const TINT: Record<Region, string> = {
  south: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  creole: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  "tex-mex": "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  midwest: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  everyday: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
};

export function RecipeArt({ recipe, className, eager }: { recipe: string | null | undefined; className?: string; eager?: boolean }) {
  const photo = recipe ? photoOf(recipe) : undefined;
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`/food/${photo.image}`} alt="" loading={eager ? "eager" : "lazy"} className={cn("bg-muted shrink-0 rounded-xl object-cover", className)} />;
  }
  const region = (recipe && recipeOf(recipe)?.region) || "everyday";
  return (
    <span aria-hidden="true" className={cn("grid shrink-0 place-items-center rounded-xl", TINT[region], className)}>
      <UtensilsIcon className="size-1/3 max-h-10 max-w-10" />
    </span>
  );
}
