// The old /studio/library addresses: the library now opens inside a team (/studio/<team>/library/...).
import { toLandingTeam } from "../../redirect";

export const dynamic = "force-dynamic";

export default async function OldLibrary({ params, searchParams }: { params: Promise<{ rest?: string[] }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { rest = [] } = await params;
  return toLandingTeam(["library", ...rest].join("/"), await searchParams);
}
