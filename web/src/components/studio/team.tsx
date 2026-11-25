// A team in Mentura's console (doc "Mentura console: screens, navigation and teams", 2026-11-25). Until the
// organization plugin is on (round 2), each person has one team, their own, named "<first name>'s businesses".

/** The personal team's name from the person's name; "Your businesses" when the name is unknown. */
export function teamName(person: string | null | undefined): string {
  const first = person?.trim().split(/\s+/)[0];
  return first ? `${first}'s businesses` : "Your businesses";
}

/** C46 Team avatar: the team's first letter on a tint drawn from its name. An upload replaces it later. */
export function TeamAvatar({ name, small }: { name: string; small?: boolean }) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return (
    <span aria-hidden className={`${small ? "size-5 rounded text-[10px]" : "size-8 rounded-lg text-sm"} flex shrink-0 items-center justify-center font-semibold text-white`} style={{ background: `oklch(0.55 0.12 ${h})` }}>
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
