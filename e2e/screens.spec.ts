import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { requestDeviceCode, signIn, test, type USERS } from './fixtures';

/**
 * The screenshots each screen ticket attaches to Linear, at 1440 and 760px:
 * `SCREENS=QOT-69 yarn test:e2e e2e/screens.spec.ts`. Off in the normal run.
 * Saved to e2e/.screenshots/screens/<ticket>-<name>-<width>.png.
 */
type Shot = {
	name: string;
	/** The page, or a function that prepares one (a device code) and returns it. */
	path: string | (() => Promise<string>);
	as?: keyof typeof USERS;
	/** A button to press before the shot (a dialog). */
	press?: string;
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
				await page.goto(typeof shot.path === 'string' ? shot.path : await shot.path());
				await page.getByRole('banner').waitFor();
				await page.waitForLoadState('networkidle');
				await page.evaluate(() => document.fonts.ready);
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
