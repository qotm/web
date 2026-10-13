import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { signIn, test } from './fixtures';
import { SHOTS } from './shots';

/**
 * The screenshots each screen ticket attaches to Linear, at 1440 and 760px:
 * `SCREENS=QOT-69 yarn test:e2e e2e/screens.spec.ts`. Off in the normal run.
 * Saved to e2e/.screenshots/screens/<ticket>-<name>-<width>.png.
 */
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
