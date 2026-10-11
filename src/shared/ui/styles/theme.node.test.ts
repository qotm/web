// @vitest-environment node
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { compile } from '@tailwindcss/node';
import { beforeAll, describe, expect, it } from 'vitest';

/** Builds the given utilities with the app's real stylesheet. */
let build: (candidates: string[]) => string;

beforeAll(async () => {
	const base = path.resolve(import.meta.dirname);
	const css = await readFile(path.join(base, 'globals.css'), 'utf8');
	const compiler = await compile(css, { base, onDependency: () => {} });
	build = (candidates) => compiler.build(candidates);
});

describe('the qotm theme', () => {
	it.each([
		['text-display', 'font-size: 52px'],
		['text-h1', 'font-size: 32px'],
		['text-h2', 'font-size: 24px'],
		['text-h3', 'font-size: 18px'],
		['text-quote', 'font-size: 36px'],
		['text-quote-sm', 'font-size: 26px'],
		['text-quote-card', 'font-size: 20px'],
		['text-body', 'font-size: 17px'],
		['text-ui', 'font-size: 15px'],
		['text-ui-strong', 'font-weight: 500'],
		['text-mono', 'font-family: var(--font-mono)'],
		['text-meta', 'font-size: 13px'],
		['text-label', 'letter-spacing: 0.14em']
	])('has the kit text style %s', (utility, declaration) => {
		const css = build([utility]);
		expect(css).toContain(`.${utility}`);
		expect(css).toContain(declaration);
	});

	it.each([
		'bg-dark',
		'text-dark-foreground',
		'text-dark-muted',
		'text-dark-accent',
		'border-dark-rule',
		'rounded-control',
		'rounded-field',
		'rounded-card',
		'rounded-terminal',
		'shadow-terminal',
		'shadow-raised',
		'max-w-page',
		'max-w-page-wide',
		'gap-grid',
		'p-tile',
		'py-section',
		'px-page',
		'h-control',
		'w-sidebar'
	])('has %s', (utility) => {
		expect(build([utility])).toContain(`.${utility}`);
	});

	it('gives form controls the darker edge and keeps the hairline elsewhere', () => {
		const css = build(['border-input', 'border-border']);
		expect(css).toContain('--input: #938a76');
		expect(css).toContain('--border: #dad7d0');
	});

	it('has one theme: no dark variant of its own and no .dark palette', async () => {
		const css = await readFile(path.join(import.meta.dirname, 'globals.css'), 'utf8');
		expect(css).not.toMatch(/custom-variant dark|\.dark\s*\{/);
	});

	it('serves the kit glyphs from the qotm glyphs faces', () => {
		const css = build([]);
		for (const range of ['U+2192', 'U+276F', 'U+2691', 'U+2665']) {
			expect(css).toContain(range);
		}
		expect(css).toContain("'qotm glyphs'");
	});
});
