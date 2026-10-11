import { VISUAL, expectMatchesKit } from './kit';
import { expect, test } from './fixtures';

const TEXT = [...VISUAL, 'line-height', 'text-transform', 'box-shadow'] as const;

/** QOT-63: Tabs, Pagination, Breadcrumbs and SideNav against qotm_kit. */
test.describe('kit: navigation', () => {
	test('Tabs match the kit: list, active, idle and count', async ({ page }) => {
		await expectMatchesKit(
			page,
			'Tabs',
			[
				['.qk-tabs', 'feed'],
				['.qk-tab.is-active', 'css:[data-probe="feed"] [aria-selected="true"]'],
				['.qk-tab:not(.is-active)', 'css:[data-probe="feed"] [aria-selected="false"]'],
				['.qk-tab__count', 'css:[data-probe="counts"] [role="tab"] > span']
			],
			TEXT
		);
	});

	test('Tabs move focus with the arrow keys and show the focus ring', async ({ page }) => {
		await page.goto('/_kit?only=Tabs');
		const feed = page.getByRole('tablist').first();
		await feed.getByRole('tab', { name: 'discover' }).focus();
		await page.keyboard.press('ArrowRight');
		await expect(feed.getByRole('tab', { name: 'latest' })).toBeFocused();
		await page.keyboard.press('ArrowLeft');
		await page.keyboard.press('ArrowLeft');
		await expect(feed.getByRole('tab', { name: 'curated' })).toBeFocused();
		await page.keyboard.press('Home');
		await expect(feed.getByRole('tab', { name: 'discover' })).toBeFocused();
		await expect
			.poll(() => feed.getByRole('tab', { name: 'discover' }).evaluate((el) => getComputedStyle(el).outlineColor))
			.toBe('rgb(184, 92, 62)');
	});

	test('Pagination matches the kit: range, buttons and load more', async ({ page }) => {
		await expectMatchesKit(
			page,
			'Pagination',
			[
				['nav.qk-pager', 'css:nav'],
				['.qk-pager__btns button:first-child', 'css:nav button:first-child'],
				['.qk-pager__btns button:last-child', 'css:nav button:last-child'],
				['.qk-pager--more button', 'css:div > button']
			],
			[...TEXT, 'padding-bottom']
		);
		const nav = page.getByRole('navigation', { name: 'Pagination' });
		await expect(nav).toContainText('26–50 of 12,631');
		await expect(nav).toContainText('2 / 506');
	});

	test('Breadcrumbs match the kit, with the current page marked', async ({ page }) => {
		await expectMatchesKit(
			page,
			'Breadcrumbs',
			[
				['.qk-crumbs', 'css:nav'],
				['.qk-crumbs a', 'css:nav a'],
				['.qk-crumbs [aria-current]', 'css:nav [aria-current]'],
				['.qk-crumbs__sep', 'css:nav [aria-hidden]']
			],
			TEXT
		);
		const nav = page.getByRole('navigation', { name: 'Breadcrumb' });
		await expect(nav.getByRole('link', { name: 'dijkstra' })).toHaveAttribute('href', '/authors/dijkstra');
		await expect(nav.locator('[aria-current="page"]')).toHaveText('q_8f2k1c');
	});

	test('SideNav matches the kit: titles, items, active and attention counts', async ({ page }) => {
		await expectMatchesKit(
			page,
			'SideNav',
			[
				['.qk-sidenav', 'css:nav'],
				['.qk-sidenav__title', 'css:nav > div:nth-child(2) > div'],
				['.qk-sidenav__item:not(.is-active)', 'css:nav button:not([aria-current])'],
				['.qk-sidenav__item.is-active', 'css:nav [aria-current="page"]'],
				['.qk-sidenav__count:not(.is-attn)', 'css:nav span:not([data-attention]) + span:not([data-attention])'],
				['.qk-sidenav__count.is-attn', 'css:nav [data-attention]']
			],
			TEXT
		);
		await page.getByRole('button', { name: /Curation queue/ }).focus();
		await page.keyboard.press('Shift+Tab');
		await expect(page.getByRole('button', { name: /Verification queue/ })).toBeFocused();
	});
});
