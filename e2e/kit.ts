import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Compares our kit components with qotm_kit's own render of the same
 * preview (e2e/kit/), property by property, and saves both side by side
 * in e2e/.screenshots/kit/ for review.
 */
const KIT = path.resolve(import.meta.dirname, 'kit');
const read = (file: string) => readFileSync(path.join(KIT, file), 'utf8');
export const SHOTS = path.resolve(import.meta.dirname, '.screenshots');

/** Renders qotm_kit's preview of `name` with the kit's own bundle. */
export async function renderKitPreview(page: Page, name: string) {
	const preview = read(`previews/${name}.html`);
	const app = /<script>([\s\S]*?)<\/script>/.exec(preview)?.[1];
	if (!app) throw new Error(`No preview script for ${name}`);
	await page.setContent(
		`<!doctype html><html lang="en"><head><meta charset="utf-8">
		<style>${read('tokens.css')}</style><style>${read('qotm-kit.css')}</style>
		<script>${read('react.production.min.js')}</script>
		<script>${read('react-dom.production.min.js')}</script>
		<script>${read('qotm-kit.js')}</script>
		</head><body><div id="root"></div><script>${app}</script></body></html>`,
		{ waitUntil: 'networkidle' }
	);
	await page.evaluate(() => document.fonts.ready);
}

/** Our gallery section for `name` (`/_kit?only=Name`). */
export async function renderOurs(page: Page, name: string) {
	await page.goto(`/_kit?only=${name}`);
	await page.locator(`[data-kit="${name}"]`).waitFor();
	await page.evaluate(() => document.fonts.ready);
	return page.locator(`[data-kit="${name}"]`);
}

/** The visual properties that make a component look like the kit's. */
export const VISUAL = [
	'color',
	'background-color',
	'border-top-color',
	'border-top-width',
	'border-bottom-color',
	'border-bottom-width',
	'border-top-left-radius',
	'font-family',
	'font-size',
	'font-weight',
	'letter-spacing',
	'padding-top',
	'padding-left',
	'width',
	'height'
] as const;

export async function stylesOf(locator: Locator, props: readonly string[] = VISUAL) {
	return locator.evaluate((el, names) => {
		const style = getComputedStyle(el);
		const rect = el.getBoundingClientRect();
		// A border colour only matters where there is a border.
		const noBorder = (side: string) => style.getPropertyValue(`border-${side}-width`) === '0px';
		return Object.fromEntries(
			names.map((name) => {
				if (name === 'width') return [name, Math.round(rect.width)];
				if (name === 'height') return [name, Math.round(rect.height)];
				if (name === 'border-top-color' && noBorder('top')) return [name, 'no border'];
				if (name === 'border-bottom-color' && noBorder('bottom')) return [name, 'no border'];
				const value = style.getPropertyValue(name);
				// The first family is the design's; the fallbacks differ by host.
				return [name, name === 'font-family' ? value.split(',')[0].replace(/["']/g, '').trim() : value];
			})
		);
	}, props);
}

/**
 * For each [kit selector, ours] pair, our element's computed
 * `props` must equal the kit's. Widths and heights may differ by a pixel
 * (font hinting); text widths are left out unless asked for.
 */
export async function expectMatchesKit(
	page: Page,
	name: string,
	/** Ours: a `data-probe` name, or a CSS selector inside our section (`css:…`). */
	pairs: [kit: string, ours: string][],
	props: readonly string[] = VISUAL.filter((p) => p !== 'width')
) {
	await renderKitPreview(page, name);
	const kit: Record<string, Record<string, string | number>> = {};
	for (const [selector, probe] of pairs) {
		const el = page.locator(selector).first();
		await expect(el, `kit ${selector}`).toBeAttached();
		kit[probe] = await stylesOf(el, props);
	}
	mkdirSync(path.join(SHOTS, 'kit'), { recursive: true });
	await page.locator('#root').screenshot({ path: path.join(SHOTS, 'kit', `${name}-kit.png`) });

	const section = await renderOurs(page, name);
	await section.screenshot({ path: path.join(SHOTS, 'kit', `${name}-web.png`) });
	for (const [, probe] of pairs) {
		const target = probe.startsWith('css:') ? probe.slice(4) : `[data-probe="${probe}"]`;
		const ours = await stylesOf(section.locator(target).first(), props);
		for (const prop of props) {
			const want = kit[probe][prop];
			const got = ours[prop];
			if (typeof want === 'number' && typeof got === 'number') {
				expect(Math.abs(got - want), `${name} ${probe} ${prop}: ${got} vs kit ${want}`).toBeLessThanOrEqual(1);
			} else {
				expect(got, `${name} ${probe} ${prop}`).toBe(want);
			}
		}
	}
}
