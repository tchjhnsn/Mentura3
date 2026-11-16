/**
 * Text a model writes about a thing (Torian, 2026-11-16 19:20Z: "we may need to add AI descriptions because what is
 * currently there is horrible"; book summaries "even the books that we don't have on our platform"). The model writes
 * only from the sources given, which are shown with the text, and the text is always labelled as written by AI.
 * Prompts and the reading of answers live here. Pure: no I/O.
 */

export type Source = { label: string; url: string; text: string };
export type AiKind = "description" | "summary";

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}…` : s);
const sourceBlock = (sources: readonly Source[], n: number) =>
  sources.map((s, i) => `SOURCE ${i + 1} (${s.label}, ${s.url}):\n${clip(s.text.replace(/\s+\n/g, "\n").trim(), n)}`).join("\n\n");

/** A short description of a recording or a book: what it is and what it covers, from the sources only. */
export function descriptionPrompt(t: { title: string; by?: string | null; kind: string }, sources: readonly Source[]): string {
  return [
    `Write a description of this ${t.kind} for a listener deciding whether to watch or hear it.`,
    `Title: ${t.title}${t.by ? `\nBy or from: ${t.by}` : ""}`,
    "",
    "Rules:",
    "- Two to four plain sentences, at most 90 words. Say what it is, who takes part, and what it argues or covers.",
    "- Use only facts stated in the sources below. Do not add dates, names, numbers or outcomes they do not give.",
    "- No praise, no hype, no adjectives like \"fascinating\" or \"must-watch\". No quotation marks around invented speech.",
    "- If the sources are not about this thing, answer exactly NONE.",
    "",
    sourceBlock(sources, 6000),
  ].join("\n");
}

/** A summary of a book, about fifteen minutes to read: its key ideas under headings, from the sources only. */
export function summaryPrompt(t: { title: string; by?: string | null }, sources: readonly Source[]): string {
  return [
    `Write a summary of the book "${t.title}"${t.by ? ` by ${t.by}` : ""} that takes about fifteen minutes to read (1,800 to 2,400 words).`,
    "",
    "Form (Markdown):",
    "- Open with one short paragraph saying what the book is and what question it answers (no heading or label before it).",
    "- Then five to nine key ideas, each under a heading line starting with \"## \" that states the idea as a short sentence, followed by two to four paragraphs explaining it in plain words. Do not number the headings.",
    "- End with a heading \"## In short\" and one paragraph. No horizontal rules.",
    "",
    "Rules:",
    "- Use only what the sources below say about the book. Do not invent arguments, events, quotations, chapters or page numbers.",
    "- Paraphrase; quote no more than a few words at a time.",
    "- Neutral and clear: explain the author's ideas as the author holds them, without praise or verdicts.",
    "- If the sources do not describe the book's contents well enough for a summary, answer exactly NONE.",
    "",
    sourceBlock(sources, 24000),
  ].join("\n");
}

/** The model's answer made ready to keep, or null when it declined (NONE), said nothing, or ran far too short. */
export function readAiText(text: string | null | undefined, kind: AiKind): string | null {
  const t = (text ?? "").replace(/^```(?:markdown)?\s*|\s*```$/g, "").trim();
  if (!t || /^NONE\.?$/i.test(t)) return null;
  const words = t.split(/\s+/).length;
  if (kind === "description" && (words < 12 || words > 160)) return null;
  if (kind === "summary" && words < 600) return null;
  return t.slice(0, 40000);
}

/** A summary's Markdown as blocks to render: headings and paragraphs, nothing else. */
export function summaryBlocks(md: string): { heading: boolean; text: string }[] {
  const clean = (t: string) => t.replace(/\*\*|(?<![\w*])\*(?=\S)|(?<=\S)\*(?![\w*])|`/g, "").replace(/\s+/g, " ").trim();
  return md.split(/\n{2,}|\n(?=#)/).map((b) => b.trim()).filter((b) => b && !/^([-*_]\s*){3,}$/.test(b)).flatMap((b) => {
    const [first = "", ...rest] = b.split("\n");
    if (!/^#{1,3}\s/.test(first)) return [{ heading: false, text: clean(b) }];
    const out = [{ heading: true, text: clean(first.replace(/^#{1,3}\s+/, "").replace(/^\d+[.)]\s+/, "")) }];
    const body = clean(rest.join(" "));
    return body ? [...out, { heading: false, text: body }] : out;
  });
}

/** Minutes to read at about 200 words a minute. */
export const readingMinutes = (md: string): number => Math.max(1, Math.round(md.split(/\s+/).length / 200));
