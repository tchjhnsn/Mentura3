// Whether this process is the hosted console. No framework import: the Next server can load this file.

export function hostedWorkspaceRequired(env: NodeJS.ProcessEnv = process.env): boolean {
  try { return new URL(env.MENTURA_PUBLIC_ORIGIN ?? "").protocol === "https:"; }
  catch { return false; }
}
