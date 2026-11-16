/** The medieval topic's works and forms (filled by its own pull request). Pure: no I/O. */
import type { TopicForm, TopicPage, Work } from "./topic-pages";

export const MEDIEVAL_WORKS: readonly Work[] = [];
/** The topic page itself, or null while it has none (the founding topic lives in `topic-pages.ts`). */
export const MEDIEVAL_TOPIC: TopicPage | null = null;
/** Forms added to an existing topic page, each id prefixed with the topic ("founding:music"); one with the same id replaces it. */
export const MEDIEVAL_FORMS: readonly TopicForm[] = [];
