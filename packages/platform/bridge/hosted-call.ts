// The Next server's call into the hosted workspace. This file does not import the framework.
// The assertion is written to the child's stdin and is not an argument.

import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { publicMessage } from "../hosted/public-error.ts";

function childScript(): string {
  return fileURLToPath(new URL("../hosted/console-child.ts", import.meta.url));
}

function runChild(payload: string, timeoutMs: number, env: NodeJS.ProcessEnv): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = execFile(process.execPath, [childScript()], {
      maxBuffer: 32 * 1024 * 1024,
      timeout: timeoutMs + 5_000,
      env,
    }, (error, stdout) => {
      if (error) reject(error);
      else resolve(stdout);
    });
    child.stdin?.end(payload);
  });
}

/** Run one signed operation against naive_records. Throws only a message that can reach the browser. */
export async function runHostedConsole<T>(input: {
  userId: string;
  assertion: string;
  bridgePath: string;
  key: string;
  timeoutMs: number;
  env?: NodeJS.ProcessEnv;
}): Promise<T> {
  const env = input.env ?? process.env;
  let stdout = "";
  try {
    stdout = await runChild(JSON.stringify({
      userId: input.userId,
      assertion: input.assertion,
      bridgePath: input.bridgePath,
      key: input.key,
      timeoutMs: input.timeoutMs,
    }), input.timeoutMs, env);
  } catch (error) {
    throw new Error(publicMessage(error));
  }
  let parsed: { ok?: boolean; result?: T; error?: unknown };
  try {
    parsed = JSON.parse(stdout) as { ok?: boolean; result?: T; error?: unknown };
  } catch {
    throw new Error(publicMessage(""));
  }
  if (!parsed.ok) throw new Error(publicMessage(parsed.error));
  return parsed.result as T;
}
