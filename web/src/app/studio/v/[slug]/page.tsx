import { Num } from "@/components/studio/bits";
import { Conversation, LeadHeader } from "@/components/studio/conversation";
import { PhaseBar } from "@/components/studio/phase-bar";
import { leadOf } from "@/components/studio/phase";

/** V1 Venture home: talk to the chief of staff or a lead about this venture, with the phase it is in on top. One
 * column, like a chat with a bot: the agent fetches the records and shows what answers the question. */
export default async function VentureHome({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ agent?: string }> }) {
  const { slug } = await params;
  const { agent } = await searchParams;
  const lead = leadOf(agent);
  return (
    <div data-virtu-screen="V1" className="mx-auto flex min-h-full max-w-3xl flex-col gap-4 px-4 pt-5 md:px-6 md:pt-8">
      <div className="relative"><Num n="V1" className="absolute -top-3 -left-1" /><LeadHeader leadId={lead.id} /></div>
      <PhaseBar slug={slug} />
      <Conversation key={`${slug}-${lead.id}`} slug={slug} leadId={lead.id} />
    </div>
  );
}
