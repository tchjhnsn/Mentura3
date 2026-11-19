// How long a logged change stays open, kept apart from run.ts so registry entries can name these in their
// descriptions without importing run.ts while index.ts is still loading (a cycle that broke the build). The numbers are
// the core's runner's (@reflect/core/registry).
export { HOLD_DAYS, UNDO_DAYS } from "@reflect/core/registry";
