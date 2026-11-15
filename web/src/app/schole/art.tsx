import { CoverImg } from "./cover-img";
import { cn } from "@/lib/utils";

/**
 * A thing's art: its cover over a type tile, so a thing with no picture, or one that fails to load, shows its kind and
 * title set in the box, never an empty grey box (guide "Home, browse and library", point 3).
 */
export function Art({ image, kind, title, className, small = false, tiny = false }: { image: string | null; kind: string; title: string; className?: string; small?: boolean; /** Too small for a title (a row's 48 px thumbnail): the kind alone, centred. */ tiny?: boolean }) {
  if (tiny) {
    return (
      <span className={cn("bg-muted relative flex items-center justify-center overflow-hidden rounded-lg border", className)}>
        <span className="text-muted-foreground text-[8px] font-medium tracking-wide uppercase">{kind}</span>
        {image ? <CoverImg src={image} className="absolute inset-0 size-full object-cover" /> : null}
      </span>
    );
  }
  return (
    <span className={cn("bg-muted relative flex flex-col justify-end overflow-hidden rounded-lg border text-left", small ? "gap-0.5 p-1.5" : "gap-1 p-2.5", className)}>
      <span className={cn("text-muted-foreground font-medium tracking-wide uppercase", small ? "text-[8px]" : "text-[10px]")}>{kind}</span>
      <span className={cn("text-foreground/80 font-semibold leading-tight hyphens-auto", small ? "line-clamp-3 text-[10px]" : "line-clamp-4 text-xs")}>{title}</span>
      {image ? <CoverImg src={image} className="absolute inset-0 size-full object-cover" /> : null}
    </span>
  );
}
