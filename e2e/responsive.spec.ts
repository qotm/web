import { expect, signIn, test } from './fixtures';
import { SHOTS } from './shots';

/**
 * No screen scrolls sideways on a phone or a tablet: one screen per ticket
 * (the first in SHOTS), at 360 and 768, as a touch device. The full audit,
 * with screenshots and tap targets, is e2e/mobile-audit.spec.ts.
 */
test.describe('responsive', () => {
	test.use({ hasTouch: true, isMobile: true });

	const screens = Object.entries(SHOTS).map(([ticket, shots]) => ({
		...shots[0]!,
		name: `${ticket} ${shots[0]!.name}`
	}));
	for (const width of [360, 768]) {
		for (const shot of screens) {
			test(`${shot.name} fits ${width}px`, async ({ page }) => {
				if (shot.as) await signIn(page, shot.as);
				await page.setViewportSize({ width, height: 800 });
				await page.goto(typeof shot.path === 'string' ? shot.path : await shot.path(page));
				await page.getByRole('main').first().waitFor();
				await page.waitForLoadState('networkidle');
				const overflow = await page.evaluate(
					() => document.documentElement.scrollWidth - document.documentElement.clientWidth
				);
				expect(overflow, `${shot.name} scrolls sideways by ${overflow}px at ${width}`).toBeLessThanOrEqual(0);
			});
		}
	}
});
