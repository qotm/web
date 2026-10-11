import { expectMatchesKit } from './kit';
import { expect, test } from './fixtures';

/** QOT-61: surfaces and feedback against qotm_kit. */
const BOX = [
	'color',
	'background-color',
	'border-top-color',
	'border-top-width',
	'border-top-left-radius',
	'padding-top',
	'padding-left',
	'font-size'
];

test.describe('kit: surfaces', () => {
	test('Card: raised, wash and dark, with their labels', async ({ page }) => {
		await expectMatchesKit(
			page,
			'Card',
			[
				['.qk-card--raised', 'raised'],
				['.qk-card--wash', 'wash'],
				['.qk-card--dark', 'dark'],
				['.qk-card--raised .qk-card__label', 'css:[data-probe="raised"] h4'],
				['.qk-card--wash .qk-card__label', 'css:[data-probe="wash"] h4'],
				['.qk-card--dark .qk-card__label', 'css:[data-probe="dark"] h4']
			],
			[...BOX, 'font-family', 'letter-spacing', 'text-transform', 'height']
		);
	});

	test('Tile: light and dark, with caption', async ({ page }) => {
		await expectMatchesKit(
			page,
			'Tile',
			[
				['.qk-tile:not(.qk-tile--dark)', 'css:[data-probe="light"] > div:first-child'],
				['.qk-tile--dark', 'css:[data-probe="dark"] > div:first-child'],
				['.qk-tile__caption', 'css:[data-probe="light"] > div:last-child']
			],
			['background-color', 'border-top-color', 'border-top-left-radius', 'padding-top', 'font-family', 'font-size']
		);
	});

	test('Dialog: panel, head, close, description and footer on the scrim', async ({ page }) => {
		await expectMatchesKit(
			page,
			'Dialog',
			[
				['.qk-scrim', 'css:div > div:first-child'],
				['.qk-dialog', 'css:[role="dialog"]'],
				['.qk-dialog__head h3', 'css:[role="dialog"] h3'],
				['.qk-dialog__x', 'css:[aria-label="Close"]'],
				['.qk-dialog__desc', 'css:[role="dialog"] p'],
				['.qk-dialog__foot', 'css:[role="dialog"] > div:last-child']
			],
			[...BOX, 'font-family', 'box-shadow']
		);
	});

	test('Menu: panel, heading, items, hints and rule', async ({ page }) => {
		await expectMatchesKit(
			page,
			'Menu',
			[
				['.qk-menu__panel', 'css:[role="menu"]'],
				['.qk-menu__heading', 'css:[role="menu"] > div:first-child'],
				['.qk-menu__item', 'css:[role="menuitem"]'],
				['.qk-menu__hint', 'css:[role="menuitem"] span:last-child >> nth=1'],
				['.qk-menu__rule', 'css:[role="separator"]']
			],
			[...BOX, 'font-family', 'box-shadow', 'width', 'height']
		);
	});

	test('Toast: ink bar, glyph, action and dismiss', async ({ page }) => {
		await expectMatchesKit(
			page,
			'Toast',
			[
				['.qk-toast', 'css:[role="status"]'],
				['.qk-toast__glyph', 'css:[role="status"] > span:first-child'],
				['.qk-toast__action', 'css:[role="status"] button:not([aria-label])'],
				['.qk-toast__x', 'css:[aria-label="Dismiss"]']
			],
			[...BOX, 'font-family', 'height']
		);
	});

	test('Notice: info, attention, wash and dark', async ({ page }) => {
		await expectMatchesKit(
			page,
			'Notice',
			[
				['.qk-notice--info', 'css:[role="note"] >> nth=0'],
				['.qk-notice--attention', 'css:[role="note"] >> nth=1'],
				['.qk-notice--wash', 'css:[role="note"] >> nth=2'],
				['.qk-notice--dark', 'css:[role="note"] >> nth=3'],
				['.qk-notice--info .qk-notice__glyph', 'css:[role="note"] > span >> nth=0'],
				['.qk-notice--dark .qk-notice__body div', 'css:[role="note"] >> nth=3 >> css=div div']
			],
			[...BOX, 'font-family', 'box-shadow', 'height']
		);
	});

	test('EmptyState: dashed frame, command, heading and sentence', async ({ page }) => {
		await expectMatchesKit(
			page,
			'EmptyState',
			[
				['.qk-empty', 'css:div'],
				['.qk-empty__cmd', 'css:code'],
				['.qk-empty h3', 'css:h3'],
				['.qk-empty p', 'css:p']
			],
			[...BOX, 'font-family', 'text-align']
		);
		await expect(page.locator('[data-kit="EmptyState"] > div')).toHaveCSS('border-top-style', 'dashed');
	});

	test('Skeleton: static hairline bars', async ({ page }) => {
		await expectMatchesKit(
			page,
			'Skeleton',
			[
				['.qk-skel', 'css:[aria-hidden="true"]'],
				['.qk-skel-lines .qk-skel:last-child', 'css:[aria-busy] > div:last-child']
			],
			['background-color', 'border-top-left-radius', 'opacity', 'height', 'width']
		);
	});
});

test.describe('surfaces in use', () => {
	test('the menu opens, moves by arrow keys and closes on Escape', async ({ page }) => {
		await page.goto('/_kit?only=Menu');
		const toggle = page.getByRole('button', { name: 'Account' });
		await toggle.click(); // starts open (defaultOpen): this closes it
		await expect(page.getByRole('menu')).toHaveCount(0);
		await toggle.focus();
		await page.keyboard.press('ArrowDown');
		await expect(page.getByRole('menuitem', { name: 'Profile' })).toBeFocused();
		await page.keyboard.press('ArrowDown');
		await expect(page.getByRole('menuitem', { name: /My quotes/ })).toBeFocused();
		await page.keyboard.press('End');
		await expect(page.getByRole('menuitem', { name: 'Sign out' })).toBeFocused();
		await page.keyboard.press('Escape');
		await expect(page.getByRole('menu')).toHaveCount(0);
		await expect(toggle).toBeFocused();
	});
});
