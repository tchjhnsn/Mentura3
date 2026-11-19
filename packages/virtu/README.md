# Reflect's copy of Virtu

The engine and the panel of the Virtu editor (tchjhnsn/design-system-theory, `docs/design/EDITOR.md`), copied unchanged from Virtu at commit `49f3fbb`, and the Virtu system a personal site's design is made in. The web app imports them as `@reflect/virtu/<module>`.

## Where things are

| Path | Holds |
|---|---|
| `src/` | Virtu's files, unchanged: `editor.ts` (what the theme panel shows, applying edits, check), `editor-ui.ts` (the panel, mounted in the browser), `build.ts` (`previewCss`), `check.ts` and what they import. `load.ts` reads a system from disk and is used only by `snapshot.ts` and the tests. Do not edit them here: change Virtu and copy them again |
| `site/` | The personal site's system: `virtu.json` (color and type governed, the other domains excluded with why, three contrast relations), `tokens.resolver.json`, `tokens/palette.tokens.json` (the swatches) and `tokens/site.tokens.json` (the roles and type every site starts from) |
| `site/site.loaded.json` | The system as Virtu loads it, so the web app runs the engine without reading files. `node packages/virtu/snapshot.ts` rewrites it; `site.test.ts` fails while it is stale |

## Updating from Virtu

```
for f in editor.ts editor-ui.ts build.ts check.ts tokens.ts relations.ts rules.ts permutations.ts carriers.ts shadcn.ts oklch.ts json.ts model.ts load.ts; do cp ../design-system-theory/src/$f packages/virtu/src/$f; done
node packages/virtu/snapshot.ts
```

Then change the commit above.
