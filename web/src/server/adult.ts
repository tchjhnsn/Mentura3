// Reflect is for adults (California SB 243 and New York's AI companion law cover minors). Sign-up asks the
// person to confirm they are 18 or older; the server refuses a sign-up without it, so the rule holds for any
// client, not only the sign-in page. The confirmation is not stored: the account table has no column for it,
// and an account can only exist once it was given.

export const ADULT_REQUIRED = "Reflect is for people 18 or older. Confirm you are 18 or older to create an account.";

/** True when a sign-up body carries the person's confirmation that they are 18 or older. */
export function confirmsAdult(body: unknown): boolean {
  return typeof body === "object" && body !== null && "adult" in body && body.adult === true;
}
