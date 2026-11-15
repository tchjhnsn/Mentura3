"use client";

import { useState } from "react";

/** A person's picture from a feed, left out when it does not load (feeds often point at pictures that are gone). */
export function Face({ src }: { src: string }) {
  const [gone, setGone] = useState(false);
  if (gone) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" referrerPolicy="no-referrer" className="size-6 rounded-full object-cover" onError={() => setGone(true)} />;
}
