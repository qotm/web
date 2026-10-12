import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { E2E, apiAs, requestDeviceCode, signIn, test, type USERS } from './fixtures';

/**
 * The screenshots each screen ticket attaches to Linear, at 1440 and 760px:
 * `SCREENS=QOT-69 yarn test:e2e e2e/screens.spec.ts`. Off in the normal run.
 * Saved to e2e/.screenshots/screens/<ticket>-<name>-<width>.png.
 */
type Shot = {
	name: string;
	/** The page, or a function that prepares one (a device code) and returns it. */
	path: string | ((page: import('@playwright/test').Page) => Promise<string>);
	as?: keyof typeof USERS;
	/** A button to press before the shot (a dialog). */
	press?: string;
	/** A radio to choose before the shot. */
	choose?: RegExp;
};

const SHOTS: Record<string, Shot[]> = {
	'QOT-69': [
		{ name: 'signed-out', path: '/' },
		{ name: 'signed-in', path: '/discover', as: 'member' },
		{ name: 'admin-menu', path: '/topics/debugging', as: 'admin' }
	],
	'QOT-77': [
		{ name: 'login', path: '/login' },
		{
			name: 'login-for-terminal',
			path: async () =>
				`/login?redirect=${encodeURIComponent(`/device?user_code=${(await requestDeviceCode()).user_code}`)}`
		},
		{ name: 'device', path: async () => `/device?user_code=${(await requestDeviceCode()).user_code}`, as: 'member' }
	],
	'QOT-72': [
		{ name: 'discover', path: '/discover', as: 'member' },
		{ name: 'latest', path: '/latest', as: 'member' },
		{ name: 'curated', path: '/curated', as: 'member' }
	],
	'QOT-73': [
		{ name: 'canonical', path: '/q/8f2k1c', as: 'member' },
		{ name: 'original', path: '/q/4r8y1p', as: 'member' },
		{ name: 'share', path: '/q/8f2k1c', as: 'member', press: 'Share this quote' },
		{ name: 'report', path: '/q/8f2k1c', as: 'member', press: 'report' }
	],
	'QOT-71': [{ name: 'landing', path: '/' }],
	'QOT-74': [{ name: 'author', path: '/authors/dijkstra', as: 'member' }],
	'QOT-75': [
		{ name: 'topic', path: '/topics/debugging', as: 'member' },
		{ name: 'topics', path: '/topics', as: 'member' }
	],
	'QOT-76': [
		{ name: 'quotes', path: '/search?q=complexity', as: 'member' },
		{ name: 'authors', path: '/search?q=dijkstra&type=authors', as: 'member' },
		{ name: 'empty', path: '/search?q=dijkstra&type=topics', as: 'member' }
	],
	'QOT-78': [
		{ name: 'canonical', path: '/submit', as: 'member' },
		{ name: 'original', path: '/submit', as: 'member', choose: /My own original/ }
	],
	'QOT-79': [
		{ name: 'quotes', path: '/@ada', as: 'member' },
		{ name: 'contributions', path: '/@ada/contributions', as: 'member' }
	],
	'QOT-80': [
		{
			name: 'favorites',
			as: 'member',
			path: async (page) => {
				for (const id of ['q_8f2k1c', 'q_1t7c4e', 'q_0h5w3q', 'q_3m9d0a', 'q_4r8y1p', 'q_7c1m4t'])
					await page.request.post(`${E2E.api}/v1/quotes/${id}/favorite`, { headers: { Origin: E2E.web } });
				return '/favorites';
			}
		}
	],
	'QOT-81': [
		{
			name: 'my-quotes',
			as: 'member',
			path: async () => {
				const member = await apiAs('member');
				const admin = await apiAs('admin');
				const post = async (data: object) => (await member.post('/v1/submissions', { data })).json();
				await post({ type: 'private', text: 'Ship the smallest thing that teaches you something.' });
				const karlton = await post({
					type: 'canonical',
					text: 'There are only two hard things in Computer Science: cache invalidation and naming things, said twice.',
					attribution: 'Phil Karlton',
					source: 'Folklore',
					topics: ['programming']
				});
				await admin.post(`/v1/admin/quotes/${karlton.id}/verification`, {
					data: {
						decision: 'needs_evidence',
						note: 'Widely repeated, but I can’t find where Karlton said it. A first-hand account would do.'
					}
				});
				await post({
					type: 'canonical',
					text: 'Premature optimization is the root of all evil, at least most of the time.',
					attribution: 'Donald E. Knuth',
					source: 'Structured Programming with go to Statements',
					year: 1974,
					topics: ['programming']
				});
				await post({
					type: 'original',
					text: 'A red build is a fact; a green one is a hypothesis.',
					topics: ['software-engineering'],
					rights: true
				});
				await member.dispose();
				await admin.dispose();
				return '/my-quotes';
			}
		}
	],
	'QOT-70': [
		{ name: 'admin', path: '/admin', as: 'admin' },
		{ name: 'verifier', path: '/admin', as: 'verifier' }
	]
};

const OUT = path.join(import.meta.dirname, '.screenshots', 'screens');
const ticket = process.env.SCREENS ?? '';

test.describe('screens', () => {
	test.skip(!SHOTS[ticket], 'set SCREENS=<ticket> to take its screenshots');

	for (const shot of SHOTS[ticket] ?? []) {
		for (const width of [1440, 760]) {
			test(`${shot.name} at ${width}`, async ({ page }) => {
				mkdirSync(OUT, { recursive: true });
				if (shot.as) await signIn(page, shot.as);
				await page.setViewportSize({ width, height: 900 });
				await page.goto(typeof shot.path === 'string' ? shot.path : await shot.path(page));
				await page.getByRole('banner').waitFor();
				await page.waitForLoadState('networkidle');
				await page.evaluate(() => document.fonts.ready);
				if (shot.choose) await page.getByRole('radio', { name: shot.choose }).check();
				// Let colour transitions (180ms) finish before the shot.
				await page.waitForTimeout(300);
				if (shot.press) {
					await page.getByRole('button', { name: shot.press, exact: true }).click();
					await page.getByRole('dialog').waitFor();
				}
				if (shot.name === 'admin-menu') {
					const trigger = page.getByRole('button', { name: width > 760 ? 'Account' : 'Menu' });
					await trigger.click();
					await page.getByRole('menu').waitFor();
				}
				await page.screenshot({ path: path.join(OUT, `${ticket}-${shot.name}-${width}.png`), fullPage: true });
			});
		}
	}
});
