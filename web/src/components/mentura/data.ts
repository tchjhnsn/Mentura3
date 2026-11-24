// Mentura (mock data). Mentura is where founders and investors meet and talk in public about what they make and do
// (Torian, 2026-11-21), built after Contra. The profile and account are shared across apps (Reflect, Mentura); each app
// presents them in its own context: in Reflect the profile is private, in Mentura it is public for founding work.

export type Role = "Founder" | "Investor" | "Operator" | "Builder";
export type Person = {
  handle: string; name: string; /** Attributes on the one account, not separate workspaces: a person can be a founder and an investor at once. */ roles: Role[]; line: string; city: string; hue: number;
  followers: number; following: number; tags: string[]; venture?: string; fund?: string; open?: string;
};

export const ME = "torian";

export const PEOPLE: Person[] = [
  { handle: "torian", name: "Torian Johnson", roles: ["Founder"], line: "Building businesses in public. Haptic Plays, Pattern Language and Mentura.", city: "Austin, TX", hue: 24, followers: 312, following: 188, tags: ["Wearables", "Sports tech", "Business building"], venture: "haptic-plays", open: "Looking for a hardware co-founder" },
  { handle: "maya", name: "Maya Ortiz", roles: ["Investor"], line: "Partner at Lone Star Seed. First checks in founders, not decks.", city: "Austin, TX", hue: 200, followers: 4210, following: 610, tags: ["Pre-seed", "Hardware", "Sports"], fund: "Lone Star Seed", open: "Taking first meetings in December" },
  { handle: "dev", name: "Dev Patel", roles: ["Builder"], line: "Firmware and embedded engineer. I make small things buzz.", city: "Austin, TX", hue: 140, followers: 890, following: 240, tags: ["Embedded", "Haptics", "Rust"], open: "Open to a co-founder role" },
  { handle: "ana", name: "Ana Reyes", roles: ["Founder"], line: "Making architecture software for small firms. Ex-Gensler.", city: "Houston, TX", hue: 300, followers: 1530, following: 402, tags: ["Architecture", "SaaS", "Design"], venture: "pattern-language" },
  { handle: "james", name: "James Okafor", roles: ["Investor"], line: "Angel. Former coach. I back sports and education founders.", city: "Dallas, TX", hue: 60, followers: 2280, following: 330, tags: ["Angel", "Sports", "Education"], fund: "Angel" },
  { handle: "lena", name: "Lena Brooks", roles: ["Operator", "Investor"], line: "Two exits as COO. Now helping first-time founders hire well.", city: "Austin, TX", hue: 330, followers: 3120, following: 520, tags: ["Hiring", "Operations", "Advisor"] },
  { handle: "sam", name: "Sam Lee", roles: ["Founder"], line: "Building a payroll tool for youth sports leagues.", city: "San Antonio, TX", hue: 260, followers: 640, following: 290, tags: ["Fintech", "Sports"], venture: "league-pay" },
  { handle: "priya", name: "Priya Shah", roles: ["Investor"], line: "Principal at Third Coast Businesses. Seed and Series A.", city: "Austin, TX", hue: 100, followers: 5400, following: 800, tags: ["Seed", "B2B", "Climate"], fund: "Third Coast Businesses" },
];
/** How a person's roles read in a line: "Founder", "Operator and investor". */
export const roleLine = (p: Person): string => p.roles.map((r, i) => (i ? r.toLowerCase() : r)).join(" and ") + (p.fund ? ` at ${p.fund}` : "");
export const isA = (p: Person, r: Role): boolean => p.roles.includes(r);
export const personOf = (h: string): Person => PEOPLE.find((p) => p.handle === h) ?? PEOPLE[0]!;

export type PostKind = "Made" | "Doing" | "Asking" | "Milestone" | "Note";
export type Post = {
  id: string; by: string; when: string; kind: PostKind; text: string; tags: string[];
  venture?: string; media?: { title: string; hue: number }; likes: number; replies: number; reposts: number;
  thread?: { by: string; when: string; text: string; likes: number }[];
};

export const POSTS: Post[] = [
  { id: "p1", by: "torian", when: "2h", kind: "Made", text: "First vest that buzzes a play call. Coach taps the tablet, the quarterback feels it on his left shoulder in under 80 ms. Practice test at Lincoln High on Tuesday.", tags: ["haptics", "sportstech"], venture: "haptic-plays", media: { title: "Vest prototype v2", hue: 24 }, likes: 48, replies: 9, reposts: 4,
    thread: [{ by: "dev", when: "1h", text: "80 ms is great. What motor are you using? Happy to look at the firmware.", likes: 6 }, { by: "james", when: "45m", text: "I coached for nine years. Crowd noise lost us two playoff games. I want to see Tuesday.", likes: 11 }] },
  { id: "p2", by: "maya", when: "4h", kind: "Note", text: "What I look for in a pre-seed founder: they have already made something small that works, and they can tell me who it hurt to not have it.", tags: ["fundraising"], likes: 210, replies: 31, reposts: 40 },
  { id: "p3", by: "ana", when: "6h", kind: "Milestone", text: "Pattern Language moved from Discovery to Validation. Five architects told us picking patterns costs them a day a week.", tags: ["architecture", "naive"], venture: "pattern-language", likes: 73, replies: 12, reposts: 6 },
  { id: "p4", by: "dev", when: "8h", kind: "Asking", text: "Looking for a founder who needs firmware help on a wearable. Nights and weekends to start, equity is fine.", tags: ["cofounder", "embedded"], likes: 22, replies: 7, reposts: 3 },
  { id: "p5", by: "lena", when: "1d", kind: "Doing", text: "Hosting a small dinner for first-time founders in Austin on Dec 4. Twelve seats. Bring one hard hiring question.", tags: ["events", "hiring"], likes: 95, replies: 18, reposts: 12 },
  { id: "p6", by: "sam", when: "1d", kind: "Made", text: "League Pay paid its first 40 referees this weekend. No checks, no cash boxes.", tags: ["fintech", "sports"], venture: "league-pay", media: { title: "Payout screen", hue: 260 }, likes: 61, replies: 8, reposts: 5 },
];
export const postOf = (id: string): Post => POSTS.find((p) => p.id === id) ?? POSTS[0]!;

export const TOPICS = ["sportstech", "hardware", "fundraising", "cofounder", "naive", "austin"];

export type Event = { id: string; title: string; when: string; day: string; place: string; host: string; going: string[]; seats?: number; kind: string; about: string };
export const EVENTS: Event[] = [
  { id: "e1", title: "Founder dinner: hiring your first five", when: "Thu, Dec 4 · 7:00 PM", day: "DEC 4", place: "Odd Duck, South Lamar", host: "lena", going: ["torian", "sam", "ana"], seats: 12, kind: "Dinner", about: "Twelve first-time founders, one table, one hard hiring question each." },
  { id: "e2", title: "Austin hardware night", when: "Tue, Dec 9 · 6:30 PM", day: "DEC 9", place: "Capital Factory, 16th floor", host: "dev", going: ["dev", "torian", "maya"], kind: "Meetup", about: "Bring what you are building. Five minute demos, then open tables." },
  { id: "e3", title: "Sports tech demo day", when: "Sat, Dec 13 · 10:00 AM", day: "DEC 13", place: "Q2 Stadium club level", host: "james", going: ["james", "sam", "torian", "priya"], kind: "Demo day", about: "Eight sports founders, ten minutes each, investors in the room." },
  { id: "e4", title: "Office hours with Third Coast", when: "Wed, Dec 17 · 2:00 PM", day: "DEC 17", place: "Online", host: "priya", going: ["priya"], seats: 6, kind: "Office hours", about: "Twenty minute slots for seed founders. Bring your numbers." },
];
export const eventOf = (id: string): Event => EVENTS.find((e) => e.id === id) ?? EVENTS[0]!;

export type PublicVenture = { slug: string; name: string; line: string; phase: string; team: string[]; raising?: string; hue: number; updates: string[] };
export const VENTURES: PublicVenture[] = [
  { slug: "haptic-plays", name: "Haptic Plays", line: "Coaches call a play, players feel it on a wearable.", phase: "Validation", team: ["torian"], raising: "Pre-seed, $500K", hue: 24, updates: ["p1"] },
  { slug: "pattern-language", name: "Pattern Language", line: "Architecture patterns, picked in minutes instead of days.", phase: "Validation", team: ["ana", "torian"], hue: 300, updates: ["p3"] },
  { slug: "league-pay", name: "League Pay", line: "Payroll for youth sports leagues.", phase: "Beachhead", team: ["sam"], raising: "Seed, $1.5M", hue: 260, updates: ["p6"] },
];
export const ventureOf = (s: string): PublicVenture => VENTURES.find((v) => v.slug === s) ?? VENTURES[0]!;

export type Convo = { id: string; with: string; unread: number; messages: { from: string; text: string; when: string }[] };
export const CONVOS: Convo[] = [
  { id: "c1", with: "maya", unread: 1, messages: [{ from: "maya", text: "Saw the vest post. Can you show me Tuesday's practice video when you have it?", when: "10:12 AM" }] },
  { id: "c2", with: "dev", unread: 0, messages: [{ from: "torian", text: "Would you look at the motor driver? 80 ms is fine but I think it can be 40.", when: "Yesterday" }, { from: "dev", text: "Send me the board files. I can look Saturday.", when: "Yesterday" }] },
  { id: "c3", with: "lena", unread: 0, messages: [{ from: "lena", text: "Saved you a seat at the dinner on the 4th.", when: "Mon" }] },
];
export const REQUESTS: Convo[] = [
  { id: "r1", with: "priya", unread: 1, messages: [{ from: "priya", text: "Hi Torian, Third Coast is looking at sports hardware. Open to a call?", when: "9:40 AM" }] },
];

/** Where Message goes: the conversation with that person when there is one, else a new one. */
export const messageHref = (h: string): string => {
  const req = REQUESTS.find((x) => x.with === h);
  if (req) return `/mentura/messages?tab=requests&c=${req.id}`;
  const c = CONVOS.find((x) => x.with === h);
  return c ? `/mentura/messages?c=${c.id}` : `/mentura/messages?to=${h}`;
};

export type Note = { id: string; kind: "Social" | "Work"; who: string; text: string; when: string; href: string; unread: boolean };
export const NOTES: Note[] = [
  { id: "n1", kind: "Social", who: "james", text: "replied to your post", when: "45m", href: "/mentura/post/p1", unread: true },
  { id: "n2", kind: "Work", who: "priya", text: "asked to message you", when: "1h", href: "/mentura/messages?tab=requests", unread: true },
  { id: "n3", kind: "Social", who: "maya", text: "followed you", when: "3h", href: "/mentura/p/maya", unread: false },
  { id: "n4", kind: "Work", who: "lena", text: "saved you a seat at Founder dinner", when: "1d", href: "/mentura/events/e1", unread: false },
];

/** Every screen and part, numbered (the screen inventory; Virtu's callout numbers). */
export type Ref = { name: string; url: string };
export type Screen = { id: string; title: string; path: string; job: string; ref: Ref | null };
/**
 * The Mobbin screens and flows each Mentura screen is built after, checked one by one on Mobbin (2026-11-21).
 * Contra has no events, so events follow Luma; meetings follow ClickUp's call screen (Torian's Mentura collection).
 */
const MOBBIN = "https://mobbin.com";
export const REFS = {
  home: { name: "Contra, Home", url: `${MOBBIN}/screens/385fd336-a28e-483b-92e3-2be5464cdf93` }, // Contra home: composer, suggested topics, feed, right rail
  dashboard: { name: "Contra, Dashboard", url: `${MOBBIN}/flows/2d36dad8-21a5-4d97-92c9-b0c28a48d62d` }, // Contra Dashboard: action items with an ask box
  ai: { name: "Contra, Chatting with AI", url: `${MOBBIN}/flows/433e7621-abb0-4702-a6d7-babd1b560546` }, // Contra Chatting with AI: "What should we work on?", threads
  aiHistory: { name: "Contra, Chat history", url: `${MOBBIN}/flows/d23412e3-f2a5-4030-9be1-8dc006e0d3aa` }, // Contra Chat history: the threads list
  notifications: { name: "Contra, Notifications", url: `${MOBBIN}/flows/2b4afb41-7acf-42fa-9eb3-6509c85cbef1` }, // Contra Notifications: panel with All, Social, Work
  messages: { name: "Contra, Messages", url: `${MOBBIN}/flows/098cc603-1f45-493b-91d6-2a430ac44437` }, // Contra Messages: list, conversation, details panel
  myProfile: { name: "Contra, Profile", url: `${MOBBIN}/flows/1315dd21-f7bd-4aac-becd-d26d1f0543e2` }, // Contra Profile: hero, Message, Work, Posts, About
  profile: { name: "Contra, Profile seen by others", url: `${MOBBIN}/flows/8abc2da8-bd40-421b-a349-87591c659077` }, // Contra Profile seen by others: Overview, Work, About
  discovered: { name: "Contra, Get discovered", url: `${MOBBIN}/flows/853d4a2c-1846-4b1b-9a8d-d821e630ccf4` }, // Contra Get discovered: score, profile completion
  discover: { name: "Contra, Discover", url: `${MOBBIN}/flows/8826fef1-456f-40f4-9970-34a3219cb74d` }, // Contra Discover: search, Projects and People
  post: { name: "Contra, Post detail", url: `${MOBBIN}/flows/16d37120-e782-4a77-a0c4-04074d2e1043` }, // Contra Post detail with replies
  company: { name: "Contra, Company profile", url: `${MOBBIN}/flows/00587f60-9901-40ad-a82f-37fc229970eb` }, // Contra Company profile
  editProfile: { name: "Contra, Adding profile details", url: `${MOBBIN}/flows/db7b787e-128a-4769-aa64-8ddd143858b9` }, // Contra Adding profile details
  events: { name: "Luma, City events", url: `${MOBBIN}/screens/ff217eba-443e-4ed5-b4d8-fae280bbfe6f` }, // Luma city events
  event: { name: "Luma, Event page", url: `${MOBBIN}/screens/fc3826ca-0719-4e8f-a59e-c7c0c798641a` }, // Luma event page with registration
  meeting: { name: "ClickUp, SyncUp call", url: `${MOBBIN}/screens/f5c5cb4d-4c29-4caa-82d6-a33ef84d1ada` }, // ClickUp SyncUp call beside the channel
} as const;

export const SCREENS: Screen[] = [
  { id: "M0", title: "Screen map", path: "/mentura/map", job: "Every Mentura screen and part number in one list.", ref: null },
  { id: "M1", title: "Home", path: "/mentura", job: "Post what you made or are doing; read what founders and investors you follow are making.", ref: REFS.home },
  { id: "M2", title: "Dashboard", path: "/mentura/dashboard", job: "Your week in Mentura: what the AI says to do today, views, meetings and businesses.", ref: REFS.dashboard },
  { id: "M3", title: "AI chat", path: "/mentura/ai", job: "Chat with the AI model about anything: your profile, people, businesses, events and meetings.", ref: REFS.ai },
  { id: "M4", title: "Notifications", path: "/mentura/notifications", job: "Replies, follows, requests and invitations, split into social and work.", ref: REFS.notifications },
  { id: "M5", title: "Messages", path: "/mentura/messages", job: "Conversations and message requests with founders and investors.", ref: REFS.messages },
  { id: "M6", title: "My profile", path: "/mentura/profile", job: "Your public founder profile: what you make, do, your businesses and posts.", ref: REFS.myProfile },
  { id: "M7", title: "Someone's profile", path: "/mentura/p/[handle]", job: "See what a person makes and does; follow or message them.", ref: REFS.profile },
  { id: "M8", title: "Get discovered", path: "/mentura/discovered", job: "How findable you are, and the next things that make you more so.", ref: REFS.discovered },
  { id: "M9", title: "Discover", path: "/mentura/discover", job: "Find founders, investors, builders and businesses by what they make and need.", ref: REFS.discover },
  { id: "M10", title: "Events", path: "/mentura/events", job: "Founder dinners, demo days and meetups near you, and the ones you host.", ref: REFS.events },
  { id: "M11", title: "Event", path: "/mentura/events/[id]", job: "What the event is, who is going, and your seat.", ref: REFS.event },
  { id: "M12", title: "Post", path: "/mentura/post/[id]", job: "One post with its replies.", ref: REFS.post },
  { id: "M13", title: "Business page", path: "/mentura/ventures/[slug]", job: "A business's public page: what it is, its phase, team, raise and updates.", ref: REFS.company },
  { id: "M14", title: "Meetings", path: "/mentura/meetings", job: "Meetings with the people you met here, with notes and the call.", ref: REFS.meeting },
  { id: "M15", title: "How you appear", path: "/mentura/profile/edit", job: "Choose what of your shared profile Mentura shows, and in which words.", ref: REFS.editProfile },
];

export const PARTS: { id: string; name: string; where: string }[] = [
  { id: "C1", name: "Sidebar", where: "Every screen" },
  { id: "C2", name: "Space switcher", where: "Sidebar: Reflect console, Village and polis, Mentura" },
  { id: "C3", name: "Create", where: "Sidebar: post, event, business, meeting" },
  { id: "C4", name: "Post", where: "M1, M6, M7, M12, M13" },
  { id: "C5", name: "Composer", where: "M1, M12" },
  { id: "C6", name: "Face with name", where: "Everywhere a person shows" },
  { id: "C7", name: "Follow button", where: "M1, M7, M9" },
  { id: "C8", name: "Complete profile", where: "Bottom right of every screen" },
  { id: "C9", name: "Event row", where: "M1, M10" },
  { id: "C10", name: "Business card", where: "M6, M7, M9" },
  { id: "C11", name: "Number tag", where: "Every screen and part" },
  { id: "C12", name: "Topic tabs", where: "M1" },
  { id: "C13", name: "Right rail", where: "M1, M2" },
  { id: "C14", name: "Notifications panel", where: "Sidebar: opens beside it from Notifications" },
  { id: "C15", name: "Thread list", where: "M3: past chats with the AI" },
];
