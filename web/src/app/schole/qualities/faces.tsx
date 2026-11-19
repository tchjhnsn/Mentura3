import type { Exemplar } from "@reflect/core/formation";

const initials = (name: string) => name.split(/\s+/).filter((w) => /^[A-Z]/.test(w)).map((w) => w[0]).slice(0, 2).join("");

/** Small faces for the people a quality was seen in: their initials until Scholē has their portraits here. */
export function Faces({ people, size = "sm" }: { people: readonly Exemplar[]; size?: "sm" | "lg" }) {
  return (
    <span aria-hidden className="flex -space-x-1.5">
      {people.map((e) => <span key={e.id} className={size === "lg" ? "bg-muted flex size-10 items-center justify-center rounded-full border text-xs font-semibold" : "bg-muted text-foreground flex size-6 items-center justify-center rounded-full border text-[10px] font-semibold"}>{initials(e.name)}</span>)}
    </span>
  );
}
