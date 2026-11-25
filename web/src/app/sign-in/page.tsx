import type { Metadata } from "next";
import { SignIn } from "./sign-in";

export const metadata: Metadata = { title: "Sign in to Mentura" };

/** `?mode=sign-in` opens on Sign in rather than Create your account (the invitation page's Sign in button). */
export default async function SignInPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { mode } = await searchParams;
  return <SignIn initialMode={mode === "sign-in" ? "sign-in" : "sign-up"} />;
}
