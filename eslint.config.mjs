import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

/**
 * Flat ESLint config for a React 19 + TypeScript app.
 */
export default tseslint.config(
	// `dev-dist` is vite-plugin-pwa's dev output (Workbox sources). Generated and
	// gitignored — linting it only produces "rule not found" noise that makes
	// `yarn lint` fail permanently, hiding real findings. `src/shared/types/api`
	// is generated from the OpenAPI schema and formatted by its own pipeline.
	{ ignores: ['dist', 'dev-dist', 'node_modules', 'src/shared/types/api'] },
	{
		files: ['**/*.{ts,tsx}'],
		extends: [
			js.configs.recommended,
			tseslint.configs.recommended,
			reactHooks.configs.flat.recommended,
			reactRefresh.configs.vite
		],
		languageOptions: {
			ecmaVersion: 2023,
			globals: globals.browser
		},
		rules: {
			'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
			'@typescript-eslint/no-empty-object-type': 'off',

			// The shadcn primitives export their cva variants next to the component
			// (`buttonVariants`), which is what `allowConstantExport` exists for.
			// Left as a warning rather than an error: a fast-refresh hint should not
			// be able to fail CI on a file that works.
			'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

			// iOS auto-zooms a focused text control whose font-size is under 16px and
			// never restores the zoom on blur, so one tap leaves the user zoomed for
			// the session — in the installed PWA too. `text-sm` is 14px.
			//
			// The lookbehind lets `sm:text-sm` through: `text-base sm:text-sm` is the
			// correct fix (16px on mobile, the intended density from `sm` up).
			//
			// Only catches literal className strings on raw `<input>`/`<textarea>`/
			// `<select>` — that is exactly how this regresses. Prefer `SearchInput` /
			// `Input` from `@/shared/ui`, which already handle it.
			'no-restricted-syntax': [
				'error',
				{
					selector:
						"JSXOpeningElement[name.name=/^(input|textarea|select)$/] JSXAttribute[name.name='className'] Literal[value=/(?<![:-])(text-xs|text-sm)(?![a-zA-Z0-9-])/]",
					message:
						'A text input under 16px makes iOS zoom in on focus and never zoom back out. Use `text-base sm:text-sm`, or the SearchInput / Input components from @/shared/ui.'
				}
			]
		}
	},
	{
		// `router.tsx` exports the router object alongside the shell components it
		// mounts. Splitting them would mean a second file existing only to satisfy a
		// heuristic — the router is not a component and is never hot-swapped.
		files: ['**/app/router.tsx'],
		rules: { 'react-refresh/only-export-components': 'off' }
	},
	{
		// The shadcn primitives export their cva variants beside the component
		// (`buttonVariants`, `alertVariants`) — that is how the upstream components
		// are written, and it is why consumers can compose them. `allowConstantExport`
		// does not cover a `cva()` call, so without this the rule warns permanently on
		// unmodified upstream code, which is how a lint report stops being read.
		files: ['**/components/ui/**'],
		rules: { 'react-refresh/only-export-components': 'off' }
	}
);
