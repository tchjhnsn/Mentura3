"use client";

import { useRef, useState, useTransition } from "react";
import { PlusIcon } from "lucide-react";
import { readReceiptAction } from "./actions";

// "Add a receipt" (doc "Food design guide", revision 2): one tap opens the camera or the files. The photo is made
// smaller in the browser first, so it fits what the server takes, then read; the page that follows shows what was read.
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not read that picture."))), "image/jpeg", 0.85));
}

export function ReceiptPicker() {
  const input = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <li>
      <button type="button" disabled={pending} onClick={() => input.current?.click()} className="hover:bg-accent text-primary flex min-h-14 w-full items-center gap-4 px-4 py-3 text-left transition disabled:opacity-60">
        <span className="grid size-6 shrink-0 place-items-center [&_svg]:size-5"><PlusIcon /></span>
        <span className="grid">
          <span className="text-base">{pending ? "Reading the receipt…" : "Add a receipt"}</span>
          {error ? <span role="alert" className="text-destructive text-sm">{error}</span> : null}
        </span>
      </button>
      <input ref={input} type="file" accept="image/*" capture="environment" className="sr-only" aria-label="A receipt's photo" onChange={(e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        setError(null);
        start(async () => {
          try {
            const form = new FormData();
            form.set("photo", await shrink(file), "receipt.jpg");
            const r = await readReceiptAction(form);
            if (r?.error) setError(r.error);
          } catch (err) {
            if (err && typeof err === "object" && "digest" in err && String((err as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) throw err;
            setError("Could not send that picture.");
          }
        });
      }} />
    </li>
  );
}
