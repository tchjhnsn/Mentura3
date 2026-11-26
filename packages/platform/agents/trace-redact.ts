// The one place a host replaces text before it is written into a trace or copied into an export.
// The default keeps the text. No new dependency: assign a function.

export type TraceRedactor = (text: string) => string;

let redactor: TraceRedactor = (text) => text;

export const redactTrace = (text: string): string => redactor(text);

export function setTraceRedactor(fn: TraceRedactor): void {
  redactor = fn;
}
