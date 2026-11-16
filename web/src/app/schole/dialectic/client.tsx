"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const two = (n: number) => String(n).padStart(2, "0");

/** Hidden fields with a moment in the person's own time zone: its day and time, for their schedule. */
export function LocalWhen({ iso }: { iso: string }) {
  const [v, setV] = useState({ day: "", starts: "" });
  useEffect(() => {
    const d = new Date(iso);
    setV({ day: `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`, starts: `${two(d.getHours())}:${two(d.getMinutes())}` });
  }, [iso]);
  return <><input type="hidden" name="day" value={v.day} /><input type="hidden" name="starts" value={v.starts} /></>;
}

/** A hidden field with the person's offset from UTC, so a time typed in a form is read in their zone. */
export function TzField() {
  const [tz, setTz] = useState("");
  useEffect(() => setTz(String(new Date().getTimezoneOffset())), []);
  return <input type="hidden" name="tz" value={tz} />;
}

/** A moment shown in the person's own time zone ("Thu 7:00 PM"), or with its date ("Thu, Nov 20, 7:00 PM"). */
export function LocalTime({ iso, date = false }: { iso: string; date?: boolean }) {
  const [s, setS] = useState("");
  useEffect(() => {
    const d = new Date(iso);
    setS(d.toLocaleString(undefined, date ? { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" } : { hour: "numeric", minute: "2-digit" }));
  }, [iso, date]);
  return <time dateTime={iso} suppressHydrationWarning>{s}</time>;
}

/** The date block beside a debate in a list: the weekday over the time, in the person's zone. */
export function DateBlock({ iso }: { iso: string }) {
  const [v, setV] = useState({ day: "", time: "" });
  useEffect(() => {
    const d = new Date(iso);
    setV({ day: d.toLocaleString(undefined, { weekday: "short" }).toUpperCase(), time: d.toLocaleString(undefined, { hour: "numeric", minute: d.getMinutes() ? "2-digit" : undefined }) });
  }, [iso]);
  return (
    <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg border leading-tight">
      <span className="text-xs font-semibold">{v.day}</span>
      <span className="text-muted-foreground text-xs">{v.time}</span>
    </span>
  );
}

/** Keeps a live page fresh: asks the server again every few seconds while the tab is open. */
export function Refresh({ seconds = 5 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return null;
}
