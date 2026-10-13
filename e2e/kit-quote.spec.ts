import { VISUAL, expectMatchesKit } from './kit';
import { expect, test } from './fixtures';

const TEXT = [...VISUAL, 'line-height', 'margin-top', 'padding-bottom', 'padding-right'] as const;

/** QOT-65: QuoteBlock, QuoteCard, Attribution and ActionBar against qotm_kit. */
test.describe('kit: quotes', () => {
	test('QuoteBlock matches the kit at md and sm', async ({ page }) => {
		await expectMatchesKit(
			page,
			'QuoteBlock',
			[
				['.qk-quote--md blockquote', 'css::scope > figure:first-of-type blockquote'],
				['.qk-quote--md figcaption', 'css::scope > figure:first-of-type figcaption'],
				['.qk-quote--sm blockquote', 'css::scope > figure:last-of-type blockquote']
			],
			TEXT
		);
	});

	test('Attribution matches the kit: canonical, original, private and on ink', async ({ page }) => {
		await expectMatchesKit(
			page,
			'Attribution',
			[
				['.qk-pv > .qk-attr:nth-child(1)', 'css::scope > div:nth-child(1)'],
				['.qk-pv > .qk-attr:nth-child(1) .qk-attr__dash', 'css::scope > div:nth-child(1) [aria-hidden]'],
				['.qk-pv > .qk-attr:nth-child(1) > div > a', 'css::scope > div:nth-child(1) > div:first-child > a'],
				[
					'.qk-pv > .qk-attr:nth-child(1) .qk-attr__sub',
					'css::scope > div:nth-child(1) > div:first-child > span:last-child'
				],
				['.qk-attr__credit', 'css::scope > div:nth-child(1) > div:last-child'],
				['.qk-attr__credit a', 'css::scope > div:nth-child(1) > div:last-child a'],
				['.qk-pv > .qk-attr:nth-child(2) > a', 'css::scope > div:nth-child(2) > a'],
				['.qk-attr--dark', 'css::scope > div:nth-child(4) > div'],
				['.qk-attr--dark .qk-attr__dash', 'css::scope > div:nth-child(4) [aria-hidden]'],
				['.qk-attr--dark .qk-attr__credit', 'css::scope > div:nth-child(4) > div > div:last-child']
			],
			TEXT
		);
		await expect(page.getByText('Declared original by')).toContainText('@ada');
		await expect(page.getByRole('link', { name: 'Edsger W. Dijkstra' })).toHaveAttribute('href', '/authors/dijkstra');
		await expect(page.getByRole('link', { name: '@ada' })).toHaveAttribute('href', '/@ada');
		await expect(page.getByText('private, only you can see this')).toBeVisible();
	});

	test('ActionBar matches the kit: md with words, sm, pressed and idle', async ({ page }) => {
		await expectMatchesKit(
			page,
			'ActionBar',
			[
				['.qk-actions--md', 'css::scope > div:first-child'],
				['.qk-actions--md .qk-act--like', 'css::scope > div:first-child > button:nth-child(1)'],
				['.qk-actions--md .qk-act--favorite', 'css::scope > div:first-child > button:nth-child(2)'],
				[
					'.qk-actions--md .qk-act--favorite .qk-act__glyph',
					'css::scope > div:first-child > button:nth-child(2) > span:first-child'
				],
				['.qk-actions--md .qk-act--report', 'css::scope > div:first-child > button:nth-child(5)'],
				['.qk-actions--sm .qk-act--like', 'css::scope > div:last-child > button:nth-child(1)'],
				['.qk-actions--sm .qk-act--favorite', 'css::scope > div:last-child > button:nth-child(2)'],
				['.qk-actions--sm .qk-act--share', 'css::scope > div:last-child > button:nth-child(3)']
			],
			// ♡ ☆ fall back to a system font in the kit's preview (no glyph font), so
			// the buttons' widths differ by the glyph; everything else must match.
			TEXT.filter((p) => p !== 'width')
		);
	});

	test('ActionBar toggles are aria-pressed buttons, with keyboard and focus ring', async ({ page }) => {
		await page.goto('/_kit?only=ActionBar');
		const bar = page.getByRole('group', { name: 'Quote actions' }).first();
		const like = bar.getByRole('button', { name: 'like 412' });
		await expect(like).toHaveAttribute('aria-pressed', 'false');
		await expect(bar.getByRole('button', { name: 'favorite 188' })).toHaveAttribute('aria-pressed', 'true');
		await expect(bar.getByRole('button', { name: 'share' })).not.toHaveAttribute('aria-pressed');
		const bounds = await bar.boundingBox();
		const report = await bar.getByRole('button', { name: 'report' }).boundingBox();
		expect(Math.round(report!.x + report!.width)).toBe(Math.round(bounds!.x + bounds!.width));
		await like.focus();
		await expect.poll(() => like.evaluate((el) => getComputedStyle(el).outlineColor)).toBe('rgb(184, 92, 62)');
		await page.keyboard.press('Space');
		const liked = bar.getByRole('button', { name: 'like 413' });
		await expect(liked).toHaveAttribute('aria-pressed', 'true');
		await expect(liked).toContainText('liked');
		await page.keyboard.press('Enter');
		await expect(bar.getByRole('button', { name: 'like 412' })).toHaveAttribute('aria-pressed', 'false');
	});

	test('QuoteCard matches the kit: feed, original and compact', async ({ page }) => {
		await expectMatchesKit(
			page,
			'QuoteCard',
			[
				['.qk-qcard--feed:nth-child(1)', 'css::scope > article:nth-of-type(1)'],
				['.qk-qcard--feed:nth-child(1) .qk-qcard__top', 'css::scope > article:nth-of-type(1) > div:first-child'],
				[
					'.qk-qcard--feed:nth-child(1) .qk-qcard__id',
					'css::scope > article:nth-of-type(1) > div:first-child > span:last-child'
				],
				['.qk-qcard--feed:nth-child(1) .qk-qcard__text', 'css::scope > article:nth-of-type(1) > a'],
				['.qk-qcard--feed:nth-child(1) .qk-qcard__foot', 'css::scope > article:nth-of-type(1) > div:last-child'],
				['.qk-qcard--feed:nth-child(1) .qk-topic', 'css::scope > article:nth-of-type(1) > div:last-child a'],
				['.qk-qcard--compact', 'css::scope > article:nth-of-type(3)'],
				['.qk-qcard--compact .qk-qcard__text', 'css::scope > article:nth-of-type(3) > a'],
				['.qk-qcard--compact .qk-qcard__foot', 'css::scope > article:nth-of-type(3) > div:last-child']
			],
			TEXT
		);
		// The actions carry ♡ ☆, wider in the kit's fallback font: no width.
		await expectMatchesKit(
			page,
			'QuoteCard',
			[
				['.qk-qcard--feed:nth-child(1) .qk-actions', 'css::scope > article:nth-of-type(1) [role="group"]'],
				[
					'.qk-qcard--feed:nth-child(2) .qk-act--recommend',
					'css::scope > article:nth-of-type(2) [aria-label^="recommend"]'
				]
			],
			TEXT.filter((p) => p !== 'width')
		);
		const card = page.getByRole('article').first();
		await expect(card.getByRole('link', { name: /Simplicity is prerequisite/ })).toHaveAttribute('href', '/q/8f2k1c');
		await expect(card.getByRole('button', { name: /^recommend/ })).toHaveCount(0);
		await expect(page.getByRole('article').nth(1).getByRole('button', { name: 'recommend 14' })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		await expect(page.getByRole('article').nth(2).getByText('submitted by')).toHaveCount(0);
	});
});
