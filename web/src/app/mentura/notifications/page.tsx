"use client";

// M4 Notifications, after Contra's notifications (data.ts REFS.notifications). On a wide screen Notifications in the
// sidebar opens the same list as a panel beside it (C14, frame.tsx); this page is where a phone, or a link, lands.
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Num } from "@/components/studio/bits";
import { NOTES } from "@/components/mentura/data";
import { NotificationList } from "@/components/mentura/notifications";
import { Head } from "@/components/mentura/parts";

export default function Notifications() {
  const requests = NOTES.filter((n) => n.href.includes("tab=requests")).length;
  return (
    <div className="px-4 py-5 md:px-8">
      <Head n="M4" title="Notifications" job="Replies, follows, requests and invitations, split into social and work.">
        <Button size="sm" asChild><Link href="/mentura/messages?tab=requests">Review {requests} request{requests === 1 ? "" : "s"}</Link></Button>
      </Head>
      <div className="relative mx-auto max-w-2xl">
        <Num n="M4.1" className="absolute -top-3 right-0" />
        <NotificationList />
      </div>
    </div>
  );
}
