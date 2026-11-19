"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { pickAction } from "../../actions";

/** Add to your interests, from a thing's page; the page then shows how the person holds it. */
export function PickButton({ refId }: { refId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [added, setAdded] = useState(false);
  return (
    <Button disabled={pending || added} onClick={() => { setAdded(true); start(async () => { await pickAction(refId, true); router.refresh(); }); }}>
      {added ? "Added" : "Add to your interests"}
    </Button>
  );
}
