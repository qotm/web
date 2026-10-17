import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { signIn, test } from './fixtures';
import { SHOTS, type Shot } from './shots';

/**
 * The mobile and responsiveness audit: every screen in SHOTS (plus a few
 * pages no ticket shot) at phone and tablet widths, with a screenshot and
 * what the page does wrong there: sideways scroll and the elements causing
 * it, tap targets under 40px, text under 12px.
 *
 *   AUDIT=1 yarn test:e2e e2e/mobile-audit.spec.ts
 *
 * Off in the normal run. Writes e2e/.screenshots/audit/<width>/<name>.png and
 * e2e/.screenshots/audit/report.json.
 */
const OUT = path.join(import.meta.dirname, '.screenshots', 'audit');
const WIDTHS = (process.env.AUDIT_WIDTHS ?? '390,360,768').split(',').map(Number);

const EXTRA: Shot[] = [
	{ name: 'home-signed-in', path: '/', as: 'member' },
	{ name: 'terms', path: '/terms' },
	{ name: 'privacy', path: '/privacy' },
	{ name: 'not-found', path: '/no/such/page' },
	{ name: 'quote-signed-out', path: '/q/8f2k1c' },
	{ name: 'menu-open', path: '/discover', as: 'member', press: 'Menu' },
	// The review queues' list screens (an item opens on its own screen on a phone), and the quote drawer.
	{ name: 'verification-list', path: '/admin/verification', as: 'admin' },
	{ name: 'curation-list', path: '/admin/curation', as: 'admin' },
	{ name: 'reports-list', path: '/admin/reports', as: 'admin' },
	{ name: 'submissions-list', path: '/admin/submissions', as: 'admin' },
	{ name: 'quote-drawer', path: '/admin/quotes?peek=q_6h2w8r', as: 'admin' }
];

type Finding = {
	width: number;
	screen: string;
	overflow: number;
	offenders: string[];
	smallTargets: string[];
	tinyText: string[];
};
const findings: Finding[] = [];

test.describe('mobile audit', () => {
	test.skip(!process.env.AUDIT, 'set AUDIT=1 to run the audit');
	// A touch screen: `pointer: coarse`, so `tap` hit areas apply.
	test.use({ hasTouch: true, isMobile: true });

	const screens = [
		...Object.entries(SHOTS).flatMap(([ticket, shots]) => shots.map((s) => ({ ...s, name: `${ticket}-${s.name}` }))),
		...EXTRA
	];
	for (const width of WIDTHS) {
		for (const shot of screens) {
			test(`${shot.name} at ${width}`, async ({ page }) => {
				mkdirSync(path.join(OUT, String(width)), { recursive: true });
				if (shot.as) await signIn(page, shot.as);
				await page.setViewportSize({ width, height: 844 });
				await page.goto(typeof shot.path === 'string' ? shot.path : await shot.path(page));
				await page.locator('main, [role="main"], #root > *').first().waitFor();
				await page.waitForLoadState('networkidle');
				await page.evaluate(() => document.fonts.ready);
				if (shot.choose) await page.getByRole('radio', { name: shot.choose }).check();
				await page.waitForTimeout(300);
				if (shot.press) {
					const button = page.getByRole('button', { name: shot.press, exact: true });
					if (await button.isVisible()) {
						await button.click();
						await page.waitForTimeout(400);
					}
				}
				const result = await page.evaluate(() => {
					const vw = document.documentElement.clientWidth;
					const label = (el: Element) => {
						const tag = el.tagName.toLowerCase();
						const name = (el.getAttribute('aria-label') ?? el.textContent ?? '')
							.trim()
							.replace(/\s+/g, ' ')
							.slice(0, 40);
						const cls = (el.getAttribute('class') ?? '').split(' ').slice(0, 3).join('.');
						return `${tag}${cls ? `.${cls}` : ''} "${name}"`;
					};
					const visible = (el: Element) => {
						const r = el.getBoundingClientRect();
						const s = getComputedStyle(el);
						return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
					};
					// Outermost elements poking out past the viewport (their children would repeat them).
					const offenders: string[] = [];
					for (const el of document.body.querySelectorAll('*')) {
						if (!visible(el)) continue;
						const r = el.getBoundingClientRect();
						if (r.right <= vw + 1 && r.left >= -1) continue;
						let scrolled = false;
						for (let p = el.parentElement; p; p = p.parentElement) {
							const o = getComputedStyle(p).overflowX;
							if (o === 'auto' || o === 'scroll' || o === 'hidden' || o === 'clip') {
								scrolled = true;
								break;
							}
						}
						if (scrolled) continue;
						const parent = el.parentElement?.getBoundingClientRect();
						if (parent && (parent.right > vw + 1 || parent.left < -1)) continue;
						offenders.push(`${label(el)} → ${Math.round(r.right - vw)}px`);
					}
					const smallTargets = [
						...document.querySelectorAll(
							'a, button, [role="button"], input, select, textarea, [role="tab"], [role="checkbox"], [role="radio"]'
						)
					]
						.filter(visible)
						.filter((el) => {
							const r = el.getBoundingClientRect();
							// Inline links in running text are exempt (WCAG 2.5.8).
							const inline = el.tagName === 'A' && getComputedStyle(el).display === 'inline';
							// A `tap` hit area (::after) counts as the target.
							const hit = getComputedStyle(el, '::after');
							const w = Math.max(r.width, hit.content !== 'none' ? parseFloat(hit.width) || 0 : 0);
							const h = Math.max(r.height, hit.content !== 'none' ? parseFloat(hit.height) || 0 : 0);
							return !inline && (h < 40 || w < 40);
						})
						.map((el) => {
							const r = el.getBoundingClientRect();
							return `${label(el)} ${Math.round(r.width)}×${Math.round(r.height)}`;
						});
					const tinyText = [...document.querySelectorAll('body *')]
						.filter((el) => visible(el) && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim()))
						.filter((el) => parseFloat(getComputedStyle(el).fontSize) < 12)
						.map((el) => `${label(el)} ${getComputedStyle(el).fontSize}`);
					return { overflow: document.documentElement.scrollWidth - vw, offenders, smallTargets, tinyText };
				});
				findings.push({ width, screen: shot.name, ...result });
				await page.screenshot({ path: path.join(OUT, String(width), `${shot.name}.png`), fullPage: true });
			});
		}
	}

	test.afterAll(() => {
		mkdirSync(OUT, { recursive: true });
		writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(findings, null, 1));
	});
});
