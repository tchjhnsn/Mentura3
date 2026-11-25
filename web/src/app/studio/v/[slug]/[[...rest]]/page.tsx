// The old business addresses, /studio/v/<business>/...: a business now opens inside its team
// (/studio/<team>/<business>/...). Every business made before teams is in its person's personal team.
import { toPersonalTeam } from "../../../redirect";

export const dynamic = "force-dynamic";

export default async function OldBusiness({ params, searchParams }: { params: Promise<{ slug: string; rest?: string[] }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { slug, rest = [] } = await params;
  return toPersonalTeam([slug, ...rest].join("/"), await searchParams);
}
