// Mentura (mock data). Mentura is where founders and investors meet and talk in public about what they make and do
// (Torian, 2026-11-21), built after Contra. The profile and account are shared across apps (Reflect, Mentura); each app
// presents them in its own context: in Reflect the profile is private, in Mentura it is public for founding work.

export type Role = "Founder" | "Investor" | "Operator" | "Builder";
export type Person = {
  handle: string; name: string; role: Role; line: string; city: string; hue: number;
  followers: number; following: number; tags: string[]; venture?: string; fund?: string; open?: string;
};

export const ME = "torian";

export const PEOPLE: Person[] = [
  { handle: "torian", name: "Torian Johnson", role: "Founder", line: "Building ventures in public. Haptic Plays, Pattern Language and Mentura.", city: "Austin, TX", hue: 24, followers: 312, following: 188, tags: ["Wearables", "Sports tech", "Venture building"], venture: "haptic-plays", open: "Looking for a hardware co-founder" },
  { handle: "maya", name: "Maya Ortiz", role: "Investor", line: "Partner at Lone Star Seed. First checks in founders, not decks.", city: "Austin, TX", hue: 200, followers: 4210, following: 610, tags: ["Pre-seed", "Hardware", "Sports"], fund: "Lone Star Seed", open: "Taking first meetings in December" },
  { handle: "dev", name: "Dev Patel", role: "Builder", line: "Firmware and embedded engineer. I make small things buzz.", city: "Austin, TX", hue: 140, followers: 890, following: 240, tags: ["Embedded", "Haptics", "Rust"], open: "Open to a co-founder role" },
  { handle: "ana", name: "Ana Reyes", role: "Founder", line: "Making architecture software for small firms. Ex-Gensler.", city: "Houston, TX", hue: 300, followers: 1530, following: 402, tags: ["Architecture", "SaaS", "Design"], venture: "pattern-language" },
  { handle: "james", name: "James Okafor", role: "Investor", line: "Angel. Former coach. I back sports and education founders.", city: "Dallas, TX", hue: 60, followers: 2280, following: 330, tags: ["Angel", "Sports", "Education"], fund: "Angel" },
  { handle: "lena", name: "Lena Brooks", role: "Operator", line: "Two exits as COO. Now helping first-time founders hire well.", city: "Austin, TX", hue: 330, followers: 3120, following: 520, tags: ["Hiring", "Operations", "Advisor"] },
  { handle: "sam", name: "Sam Lee", role: "Founder", line: "Building a payroll tool for youth sports leagues.", city: "San Antonio, TX", hue: 260, followers: 640, following: 290, tags: ["Fintech", "Sports"], venture: "league-pay" },
  { handle: "priya", name: "Priya Shah", role: "Investor", line: "Principal at Third Coast Ventures. Seed and Series A.", city: "Austin, TX", hue: 100, followers: 5400, following: 800, tags: ["Seed", "B2B", "Climate"], fund: "Third Coast Ventures" },
];
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

export type Note = { id: string; kind: "Social" | "Work"; who: string; text: string; when: string; href: string; unread: boolean };
export const NOTES: Note[] = [
  { id: "n1", kind: "Social", who: "james", text: "replied to your post", when: "45m", href: "/mentura/post/p1", unread: true },
  { id: "n2", kind: "Work", who: "priya", text: "asked to message you", when: "1h", href: "/mentura/messages?tab=requests", unread: true },
  { id: "n3", kind: "Social", who: "maya", text: "followed you", when: "3h", href: "/mentura/p/maya", unread: false },
  { id: "n4", kind: "Work", who: "lena", text: "saved you a seat at Founder dinner", when: "1d", href: "/mentura/events/e1", unread: false },
];

/** Every screen and part, numbered (the screen inventory; Virtu's callout numbers). */
export type Screen = { id: string; title: string; path: string; job: string; ref: string };
export const CONTRA = {
  home: "https://mobbin.com/screens/c37fa3fa-b7bd-44da-acb1-645a4b2ae6e8",
  dashboard: "https://mobbin.com/screens/edffa2dc-27dd-410c-ace9-32d13acfee9d",
  discovered: "https://mobbin.com/screens/bfd6c005-5950-4d26-98fb-743831ca5c07",
  profile: "https://mobbin.com/flows/1315dd21-f7bd-4aac-becd-d26d1f0543e2",
  feed: "https://mobbin.com/flows/d23412e3-f2a5-4030-9be1-8dc006e0d3aa",
  about: "https://mobbin.com/flows/e9cc9509-2b3f-415e-b182-6e6d0959e0ba",
  messages: "https://mobbin.com/flows/8abc2da8-bd40-421b-a349-87591c659077",
  jobs: "https://mobbin.com/screens/cb0a4d61-97a9-4fb9-81f2-0594ab033fef",
} as const;

export const SCREENS: Screen[] = [
  { id: "M0", title: "Screen map", path: "/mentura/map", job: "Every Mentura screen and part number in one list.", ref: "" },
  { id: "M1", title: "Home", path: "/mentura", job: "Post what you made or are doing; read what founders and investors you follow are making.", ref: CONTRA.home },
  { id: "M2", title: "Dashboard", path: "/mentura/dashboard", job: "Your week in Mentura: what your chief of staff says to do, views, meetings and ventures.", ref: CONTRA.dashboard },
  { id: "M3", title: "Chief of staff", path: "/mentura/agent", job: "Ask your agent anything about your network, ventures and meetings.", ref: CONTRA.dashboard },
  { id: "M4", title: "Notifications", path: "/mentura/notifications", job: "Replies, follows, requests and invitations, split into social and work.", ref: CONTRA.home },
  { id: "M5", title: "Messages", path: "/mentura/messages", job: "Conversations and message requests with founders and investors.", ref: CONTRA.messages },
  { id: "M6", title: "My profile", path: "/mentura/profile", job: "Your public founder profile: what you make, do, your ventures and posts.", ref: CONTRA.profile },
  { id: "M7", title: "Someone's profile", path: "/mentura/p/[handle]", job: "See what a person makes and does; follow or message them.", ref: CONTRA.about },
  { id: "M8", title: "Get discovered", path: "/mentura/discovered", job: "How findable you are, and the next things that make you more so.", ref: CONTRA.discovered },
  { id: "M9", title: "Discover", path: "/mentura/discover", job: "Find founders, investors, builders and ventures by what they make and need.", ref: CONTRA.jobs },
  { id: "M10", title: "Events", path: "/mentura/events", job: "Founder dinners, demo days and meetups near you, and the ones you host.", ref: CONTRA.home },
  { id: "M11", title: "Event", path: "/mentura/events/[id]", job: "What the event is, who is going, and your seat.", ref: CONTRA.home },
  { id: "M12", title: "Post", path: "/mentura/post/[id]", job: "One post with its replies.", ref: CONTRA.feed },
  { id: "M13", title: "Venture page", path: "/mentura/ventures/[slug]", job: "A venture's public page: what it is, its phase, team, raise and updates.", ref: CONTRA.profile },
  { id: "M14", title: "Meetings", path: "/mentura/meetings", job: "Meetings with the people you met here, with notes and the call.", ref: CONTRA.dashboard },
  { id: "M15", title: "How you appear", path: "/mentura/profile/edit", job: "Choose what of your shared profile Mentura shows, and in which words.", ref: CONTRA.about },
];

export const PARTS: { id: string; name: string; where: string }[] = [
  { id: "C1", name: "Sidebar", where: "Every screen" },
  { id: "C2", name: "Workspace switcher", where: "Sidebar: founder or investor workspace" },
  { id: "C3", name: "Create", where: "Sidebar: post, event, venture, meeting" },
  { id: "C4", name: "Post", where: "M1, M6, M7, M12, M13" },
  { id: "C5", name: "Composer", where: "M1, M12" },
  { id: "C6", name: "Face with name", where: "Everywhere a person shows" },
  { id: "C7", name: "Follow button", where: "M1, M7, M9" },
  { id: "C8", name: "Complete profile", where: "Bottom right of every screen" },
  { id: "C9", name: "Event row", where: "M1, M10" },
  { id: "C10", name: "Venture card", where: "M6, M7, M9" },
  { id: "C11", name: "Number tag", where: "Every screen and part" },
  { id: "C12", name: "Topic tabs", where: "M1" },
  { id: "C13", name: "Right rail", where: "M1, M2" },
];
