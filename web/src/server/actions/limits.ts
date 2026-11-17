// How long a logged change stays open, kept apart from run.ts so registry entries can name these in their
// descriptions without importing run.ts while index.ts is still loading (a cycle that broke the build).
export const UNDO_DAYS = 30;
/** How long a held change waits for the person's tap. After that it cannot be approved; the model asks again. */
export const HOLD_DAYS = 7;
