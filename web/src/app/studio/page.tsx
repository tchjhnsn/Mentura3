// mentura.xyz/studio: the console opens on the last team the person used, else their personal team.
import { toLandingTeam } from "./redirect";

export const dynamic = "force-dynamic";

export default async function StudioDoor({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return toLandingTeam("", await searchParams);
}
