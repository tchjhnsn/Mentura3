"use client";

// "Why this?": asks the server to explain one recommendation (app/studio/v/[slug]/integrations/explain.ts) and shows
// the sentences, each traced to the factors listed on the card. Written by AI only when a model answered.
import { useState, useTransition } from "react";
import { SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Num } from "./bits";
import { explainRecommendation, type Explanation } from "@/app/studio/v/[slug]/integrations/explain";

export function WhyThis({ slug, category }: { slug: string; category: string }) {
  const [answer, setAnswer] = useState<Explanation | null>(null);
  const [pending, start] = useTransition();
  if (answer && !("error" in answer)) {
    return (
      <div className="bg-muted/50 rounded-lg p-3 text-sm" data-virtu-screen="V31">
        <Num n="V31" className="mb-1" />
        {answer.sentences.map((s, i) => <p key={i} className={i ? "mt-1" : undefined}>{s.text}</p>)}
        <p className="text-muted-foreground mt-2 text-xs">{answer.by === "model" ? "Written by AI from the reasons listed here, and nothing else." : "The reasons, as the recommender scored them."}</p>
      </div>
    );
  }
  return (
    <div>
      <Button type="button" variant="ghost" size="sm" className="-ml-2 h-7 gap-1.5 px-2" disabled={pending}
        onClick={() => start(async () => setAnswer(await explainRecommendation(slug, category).catch(() => ({ error: "Could not explain it just now." }))))}>
        <SparklesIcon className="size-3.5" />{pending ? "Explaining" : "Why this?"}
      </Button>
      {answer && "error" in answer ? <p className="text-destructive text-xs">{answer.error}</p> : null}
    </div>
  );
}
