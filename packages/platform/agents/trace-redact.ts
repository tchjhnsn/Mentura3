// The one place a host replaces text before it is written into a trace or copied into an export.
// The default keeps the text. No new dependency: assign a function.
//
// Content keys are the private CONTENT test in Naive's span() (packages/naive/src/core/instrumentation.ts).
// That regex is not exported, so this is the one copy Mentura uses.

export type TraceRedactor = (text: string) => string;
/** "content" redacts Naive's content keys. "all" redacts every span attribute, and those keys too. */
export type TraceRedactMode = "content" | "all";

const CONTENT_KEY = /^(gen_ai\.(input|output)\.messages|gen_ai\.system_instructions|gen_ai\.tool\.call\.(arguments|result)|naive\.(input|output))$/;

let redactor: TraceRedactor = (text) => text;
let mode: TraceRedactMode = "content";

export const isContentAttribute = (key: string): boolean => CONTENT_KEY.test(key);

export const redactTrace = (text: string): string => redactor(text);

export function setTraceRedactor(fn: TraceRedactor, next: TraceRedactMode = "content"): void {
  redactor = fn;
  mode = next;
}

/** The value to export for one span attribute. Non-content keys pass through unless the mode is "all". */
export function redactAttribute(key: string, value: unknown): unknown {
  if (value === undefined || value === null) return value;
  if (mode !== "all" && !isContentAttribute(key)) return value;
  return redactor(typeof value === "string" ? value : JSON.stringify(value));
}
