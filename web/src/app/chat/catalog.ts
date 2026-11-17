import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";

/**
 * What the chat may show: pieces of Reflect's own apps, and nothing else. Reflect builds every spec from
 * the app's records (spec.ts); json-render renders only these components, each prop checked by its schema.
 */
export const catalog = defineCatalog(schema, {
  components: {
    Stack: { props: z.object({}), description: "Pieces shown one under another" },
    Shelf: { props: z.object({ id: z.string(), name: z.string(), books: z.array(z.string()), subjects: z.array(z.string()) }), description: "One of the person's shelves, from Scholē" },
    LibraryBook: { props: z.object({ title: z.string(), by: z.string(), shelf: z.string(), onShelves: z.boolean(), entry: z.string() }), description: "A book from the open library, with Add to shelves (entry is the catalog entry as JSON)" },
    Claim: { props: z.object({ text: z.string(), stance: z.string(), holders: z.string() }), description: "A claim the person keeps, with their stance" },
    FoundItem: { props: z.object({ medium: z.string(), title: z.string(), by: z.string().nullable(), image: z.string().nullable(), source: z.string(), kept: z.boolean(), item: z.string() }), description: "A lecture, debate, film, music or game found in a catalog, which the person adds to their shelves with one tap (item is the find as JSON)" },
    ProposeClaim: { props: z.object({ text: z.string(), stance: z.string(), holders: z.string(), subject: z.string().nullable(), claim: z.string() }), description: "A claim to keep, which the person accepts with one tap (claim is the proposal as JSON)" },
    BrowseLink: { props: z.object({ href: z.string().regex(/^\/schole\/browse(\?[^\s]*)?$/), label: z.string() }), description: "A link to the same list of books on Scholē's Browse page" },
    Quote: { props: z.object({ text: z.string(), cite: z.string(), href: z.string().regex(/^\/(?!\/)[^\s]*$/) }), description: "Words from a book the person reads in Reflect, cited to its author, book and chapter, opening the reader at them" },
    CalendarEvent: { props: z.object({ title: z.string(), day: z.string(), when: z.string(), tile: z.string(), href: z.string().regex(/^\/calendar\?day=\d{4}-\d{2}-\d{2}$/) }), description: "An event added to the person's calendar, opening the calendar at its day" },
    UndoChange: { props: z.object({ change: z.string().uuid(), text: z.string() }), description: "A change the chat just made in the person's own records, with Undo (change is the change log's id)" },
    HomeCard: { props: z.object({ title: z.string(), tile: z.string(), lines: z.array(z.string()), until: z.string() }), description: "A card placed on the person's Home screen for a time, opening Home" },
    Note: { props: z.object({ text: z.string() }), description: "A short line from Reflect, such as nothing found" },
  },
  // No json-render actions: a card's one tap calls Reflect's server action itself (registry.tsx).
  actions: {},
});
