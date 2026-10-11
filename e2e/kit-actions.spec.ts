import { expectMatchesKit } from './kit';
import { expect, test } from './fixtures';

/** QOT-59: Button, IconButton, Link and Kbd against qotm_kit. */
test.describe('kit: actions', () => {
	test('Button matches the kit at every variant and size', async ({ page }) => {
		await expectMatchesKit(page, 'Button', [
			['.qk-btn--solid.qk-btn--md:not(:disabled)', 'solid'],
			['.qk-btn--accent:not(:disabled)', 'accent'],
			['.qk-btn--outline:not(.qk-btn--mono)', 'outline'],
			['.qk-btn--quiet', 'quiet'],
			['.qk-btn--danger', 'danger'],
			['.qk-btn--sm', 'sm'],
			['.qk-btn--lg', 'lg'],
			['.qk-btn--mono', 'mono-pill'],
			['.qk-btn--solid:disabled', 'disabled'],
			['.qk-btn--accent:disabled', 'accent-disabled']
		]);
	});

	test('IconButton matches the kit', async ({ page }) => {
		await expectMatchesKit(
			page,
			'IconButton',
			[
				['.qk-iconbtn--outline:not([aria-pressed]):not(:disabled)', 'outline'],
				['.qk-iconbtn--ghost.qk-iconbtn--md', 'ghost'],
				['.qk-iconbtn[aria-pressed="true"]', 'pressed'],
				['.qk-iconbtn--sm', 'sm'],
				['.qk-iconbtn--solid', 'solid-lg'],
				['.qk-iconbtn:disabled', 'disabled']
			],
			[
				'color',
				'background-color',
				'border-top-color',
				'border-top-width',
				'border-top-left-radius',
				'font-family',
				'font-size',
				'width',
				'height'
			]
		);
	});

	test('Link matches the kit', async ({ page }) => {
		await expectMatchesKit(
			page,
			'Link',
			[
				['.qk-link:not(.qk-link--quiet)', 'default'],
				['.qk-link--quiet:not(.qk-link--mono)', 'quiet'],
				['.qk-link--mono', 'quiet-mono']
			],
			['color', 'border-bottom-color', 'border-bottom-width', 'font-family', 'font-size']
		);
	});

	test('Kbd matches the kit', async ({ page }) => {
		await expectMatchesKit(page, 'Kbd', [['.qk-kbd', 'key']]);
	});

	test('keyboard focus shows the clay ring, 2px at a 2px offset', async ({ page }) => {
		await page.goto('/_kit?only=Button');
		const focused = page.locator('[data-probe="solid"]');
		for (let i = 0; i < 5 && !(await focused.evaluate((el) => el === document.activeElement)); i++) {
			await page.keyboard.press('Tab');
		}
		await expect(focused).toBeFocused();
		// Colours ease in over 180ms; read the ring once it has settled.
		await expect
			.poll(() =>
				focused.evaluate((el) => {
					const s = getComputedStyle(el);
					return [s.outlineStyle, s.outlineWidth, s.outlineOffset, s.outlineColor];
				})
			)
			.toEqual(['solid', '2px', '2px', 'rgb(184, 92, 62)']);
		await page.keyboard.press('Tab');
		await expect(page.locator('[data-probe="accent"]')).toBeFocused();
	});

	test('disabled buttons cannot be pressed; an icon button names itself', async ({ page }) => {
		await page.goto('/_kit');
		await expect(page.locator('[data-probe="disabled"]').first()).toBeDisabled();
		await expect(page.getByRole('button', { name: 'Favorited' })).toHaveAttribute('aria-pressed', 'true');
		await expect(page.getByRole('button', { name: 'Share' })).toHaveAttribute('title', 'Share');
	});
});
