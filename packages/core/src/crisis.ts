// The chat's crisis protocol (California SB 243, New York's AI companion law): when the person's message
// shows signs of suicide or self-harm, Reflect does not coach. It says it is an AI that cannot help in a
// crisis and points to the 988 Suicide and Crisis Lifeline. The list errs toward firing: a false alarm costs
// one short, kind reply; a miss costs far more. Pure, so every phrase can be checked.

/** Phrases that signal suicide or self-harm, matched on whole words in lowercase text with plain apostrophes. */
const SIGNALS: readonly RegExp[] = [
  /\bsuicid(e|es|al|ality)\b/,
  /\bkill(ing)? my ?self\b/,
  /\bkms\b/,
  /\b(end|ending|take|taking) (my|my own) li(fe|ves)\b/,
  /\bend it all\b/,
  /\b(want|wanna|wanted|going|gonna|ready|planning|plan) to die\b/,
  /\bwish (i was|i were|i'd|i had) (dead|never born)\b/,
  /\b(i'd|i would|we'd|everyone would be|everybody would be|they'd be|they would be) better off (dead|without me)\b/,
  /\bbetter off dead\b/,
  /\b(don't|do not|dont) want to (be alive|live|exist|wake up)( anymore)?\b/,
  /\bno (reason|point) (to|in) (live|living|going on)\b/,
  /\bcan't go on\b/,
  /\bself[- ]?harm(ing)?\b/,
  /\b(cut|cutting|hurt|hurting|harm|harming|burn|burning|starve|starving) my ?self\b/,
  /\bhang(ing)? my ?self\b/,
  /\b(overdose|overdosing|od) on\b/,
  /\b(jump|jumping) (off|from) (a|the) (bridge|building|roof)\b/,
  /\b(shoot|shooting) my ?self\b/,
];

/** The text, lowercased, with curly apostrophes made plain and runs of space made one. */
const normal = (text: string) => text.toLowerCase().replace(/[‘’ʼ`]/g, "'").replace(/\s+/g, " ");

/** True when the text shows a sign of suicide or self-harm. */
export function crisisSignal(text: string): boolean {
  const t = normal(text);
  return SIGNALS.some((r) => r.test(t));
}

export const LIFELINE = {
  name: "988 Suicide and Crisis Lifeline",
  call: "tel:988",
  text: "sms:988",
  chat: "https://988lifeline.org/chat/",
} as const;

/** What the chat says, in place of an answer, when a message shows a crisis signal. */
export const CRISIS_REPLY =
  "I'm really sorry you're carrying this. I'm Reflect, an AI, and I can't help in a crisis, but people at the 988 Suicide and Crisis Lifeline can, any time, for free: call or text 988 in the US, or chat at 988lifeline.org. If you are in danger right now, call 911.";

/** The line for the system prompt, so the model keeps the same protocol when signs come up later. */
export const CRISIS_PROTOCOL =
  "If the person says anything that suggests suicide, self-harm or a crisis, stop coaching and call no tools. Say kindly that you are an AI and cannot help in a crisis, and point them to the 988 Suicide and Crisis Lifeline: call or text 988 in the US, or chat at 988lifeline.org, and 911 if they are in danger now.";
