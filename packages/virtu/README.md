# Reflect's copy of Virtu

The engine and the panel of the Virtu editor (tchjhnsn/design-system-theory, `docs/design/EDITOR.md`), copied unchanged from Virtu at commit `3ae8c92`, and the Virtu system a personal site's design is made in. The web app imports them as `@reflect/virtu/<module>`.

## Where things are

| Path | Holds |
|---|---|
| `src/` | Virtu's files, unchanged: `editor.ts` (what the theme panel shows, applying edits, check), `editor-ui.ts` (the panel, mounted in the browser; Reflect uses its transport and types for the Appearance sections in `web/src/components/virtu-sections.tsx` and no longer mounts the panel), `build.ts` (`previewCss`), `check.ts` and what they import. `load.ts` reads a system from disk and is used only by `snapshot.ts` and the tests. Do not edit them here: change Virtu and copy them again |
| `site/` | The personal site's system: `virtu.json` (color and type governed, the other domains excluded with why, three contrast relations), `tokens.resolver.json`, `tokens/palette.tokens.json` (the swatches) and `tokens/site.tokens.json` (the roles and type every site starts from) |
| `site/shapes/`, `site/ornaments/`, `site/seasons/` | The looks a site picks from in the editor's Look tab: Virtu's registry items with their colors moved onto the site's roles (surface to background, text to foreground, muted text to muted-foreground, accent to link). Every one passes against the site system (`site.test.ts`) |
| `site/looks.loaded.json` | Those looks as the engine reads them, each ornament with its SVG; `snapshot.ts` writes it too |
| `site/site.loaded.json` | The system as Virtu loads it, so the web app runs the engine without reading files. `node packages/virtu/snapshot.ts` rewrites it; `site.test.ts` fails while it is stale |

## Updating from Virtu

```
for f in editor.ts editor-ui.ts editor-io.ts build.ts check.ts tokens.ts relations.ts rules.ts permutations.ts carriers.ts shadcn.ts oklch.ts json.ts model.ts load.ts looks.ts shape.ts ornament.ts season.ts calendar.ts background.ts elevation.ts; do cp ../design-system-theory/src/$f packages/virtu/src/$f; done
node packages/virtu/snapshot.ts
```

Then change the commit above.
