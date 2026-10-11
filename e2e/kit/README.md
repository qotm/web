# qotm_kit reference

The design system's own build (qotm_kit, artifact 4MLqv3U59CQp4YfsjsBufn,
version 1791715211-d5c9), used only by the component tests: `reference.ts`
renders a component's `previews/<Name>.html` with the kit's bundle so a test
can compare our component's computed styles with the kit's, and save both
side by side for review.

- `qotm-kit.js`, `qotm-kit.css`: `components/bundle.js` and `bundle.css`
- `tokens.css`: the kit's tokens as CSS
- `react*.production.min.js`: React 18.3.1, as the kit ships it
- `previews/`: each component's preview page

Refresh these when the kit changes.
