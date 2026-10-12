import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { signIn, test, type USERS } from './fixtures';

/**
 * The screenshots each screen ticket attaches to Linear, at 1440 and 760px:
 * `SCREENS=QOT-69 yarn test:e2e e2e/screens.spec.ts`. Off in the normal run.
 * Saved to e2e/.screenshots/screens/<ticket>-<name>-<width>.png.
 */
type Shot = { name: string; path: string; as?: keyof typeof USERS; full?: boolean; clip?: 'header' | 'footer' };

const SHOTS: Record<string, Shot[]> = {
	'QOT-69': [
		{ name: 'signed-out', path: '/' },
		{ name: 'signed-in', path: '/discover', as: 'member' },
		{ name: 'admin-menu', path: '/topics/debugging', as: 'admin' }
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
				await page.goto(shot.path);
				await page.getByRole('contentinfo').waitFor();
				await page.evaluate(() => document.fonts.ready);
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
