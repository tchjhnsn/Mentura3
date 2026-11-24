// Where a connector's sign-in returns when it started in the business console (V24): a cookie set just before the
// sign-in names the console page, and /api/connectors/callback sends the person back there instead of the marketplace.
// Only a path inside the console is ever kept, so the cookie cannot send anyone off the site.

export const CONNECT_BACK_COOKIE = "reflect_connect_back";

/** The path when it is a page of the business console, else null. */
export function consoleBack(path: string | undefined | null): string | null {
  if (!path || !path.startsWith("/studio/v/") || path.includes("//") || path.includes("\\") || /[\s?#]/.test(path)) return null;
  return path;
}
