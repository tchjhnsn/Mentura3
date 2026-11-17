/** When a message was sent, short: the time today, else the day. */
export function when(at: string, now = new Date()): string {
  const d = new Date(at);
  const today = d.toDateString() === now.toDateString();
  return today ? d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
