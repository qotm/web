# qotm glyphs

The kit draws its icons as Unicode glyphs (README "Iconography"), and the
Fontsource latin subsets of our three typefaces lack most of them. These
subsets fill the gap, declared as the `qotm glyphs` family in `globals.css`
with a `unicode-range` each, so they load only on pages that use them:

| File                          | Glyphs      | Source (all SIL Open Font License 1.1)                                  |
| ----------------------------- | ----------- | ----------------------------------------------------------------------- |
| `qotm-glyphs-mono.woff2`      | ❯ → ↗ ✓ ⋯ ✕ | JetBrains Mono Regular 1.0.6 (`jetbrains-mono` on npm)                  |
| `qotm-glyphs-symbols-2.woff2` | ♡ ♥ ☆ ★     | Noto Sans Symbols 2 (`@fontsource/noto-sans-symbols-2`, symbols subset) |
| `qotm-glyphs-symbols.woff2`   | ⚑           | Noto Sans Symbols (`@fontsource/noto-sans-symbols`, symbols subset)     |

Rebuild with fontTools, e.g.
`pyftsubset JetBrainsMono-Regular.woff2 --unicodes=U+276F,U+2192,U+2197,U+2713,U+22EF,U+2715 --flavor=woff2`.
