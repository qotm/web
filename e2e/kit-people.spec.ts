import { VISUAL, expectMatchesKit, renderKitPreview, renderOurs } from './kit';
import { expect, test } from './fixtures';

const TEXT = [...VISUAL, 'line-height', 'text-transform', 'margin-top', 'padding-bottom', 'padding-right'] as const;

/** QOT-67: ShareCard, AuthorHeader, ProfileHeader and ContributionRow against qotm_kit. */
test.describe('kit: people and sharing', () => {
	test('ShareCard matches the kit, quote and terminal, at the same scale and fit', async ({ page }) => {
		const quote = 'css:[role="img"]:nth-child(1)';
		const term = 'css:[role="img"]:nth-child(2)';
		await expectMatchesKit(
			page,
			'ShareCard',
			[
				['.qk-share-wrap:nth-child(1)', quote],
				['.qk-share--quote', `${quote} > div`],
				['.qk-share--quote .qk-share__quote', `${quote} [data-share="quote"]`],
				['.qk-share--quote .qk-share__by', `${quote} [data-share="by"]`],
				['.qk-share__foot', `${quote} [data-share="foot"]`],
				['.qk-share--terminal', `${term} > div`],
				['.qk-share__bar', `${term} > div > div:first-child`],
				['.qk-share--terminal .qk-share__by', `${term} [data-share="by"]`],
				['.qk-share__cmd', `${term} [data-share="cmd"]`]
			],
			[...TEXT, 'transform']
		);
		// The terminal quote's size is the worker's fit (next test), so its
		// size and height differ from the unfitted preview; the rest matches.
		await expectMatchesKit(
			page,
			'ShareCard',
			[['.qk-share--terminal .qk-share__quote', `${term} [data-share="quote"]`]],
			TEXT.filter((p) => !['font-size', 'height', 'line-height'].includes(p))
		);
		// The quote card's clay edge (16px at full size).
		const card = page.locator('[role="img"]').first().locator('> div');
		await expect(card).toHaveCSS('border-left-width', '16px');
		await expect(card).toHaveCSS('border-left-color', 'rgb(184, 92, 62)');
		await expect(page.getByRole('img', { name: /Programs must be written/ })).toBeVisible();
	});

	test('ShareCard picks the size the worker would, on the kit’s own render', async ({ page }) => {
		// The kit's preview never fits; the worker (apps/worker share-images,
		// render.js) does. Run the worker's fit on the kit's cards and compare.
		await renderKitPreview(page, 'ShareCard');
		const worker = await page.evaluate(() =>
			[...document.querySelectorAll<HTMLElement>('.qk-share')].map((card) => {
				const s = card.getBoundingClientRect().width / 1200;
				const y = (v: number) => (v - card.getBoundingClientRect().top) / s;
				const q = card.querySelector<HTMLElement>('.qk-share__quote')!;
				const bottom = (sel: string) =>
					Math.max(...[...card.querySelectorAll(sel)].map((el) => y(el.getBoundingClientRect().bottom)));
				const terminal = card.classList.contains('qk-share--terminal');
				const fits = () =>
					terminal
						? bottom('.qk-share__cmd') <= 630 - 24
						: bottom('.qk-share__by') <= y(card.querySelector('.qk-share__foot')!.getBoundingClientRect().top) - 24;
				let size = parseFloat(getComputedStyle(q).fontSize);
				while (!fits() && size > 24) {
					size -= 2;
					q.style.fontSize = `${size}px`;
				}
				return size;
			})
		);
		const ours = await renderOurs(page, 'ShareCard');
		const sizes = await ours
			.locator('[data-share="quote"]')
			.evaluateAll((els) => els.map((el) => parseFloat(getComputedStyle(el).fontSize)));
		expect(sizes).toEqual(worker);
	});

	test('ShareCard steps a long quote down until it fits, as the worker does', async ({ page }) => {
		await page.goto('/_kit?only=ShareCardFit');
		await expect(page.getByRole('img', { name: /There are two ways/ })).toHaveCount(2);
		const [quote, terminal] = await page.getByRole('img', { name: /There are two ways/ }).all();
		const px = (el: typeof quote, sel: string) =>
			el
				.locator(sel)
				.first()
				.evaluate((n) => parseFloat(getComputedStyle(n).fontSize));
		// 220 characters start at 42px; both cards need less.
		await expect.poll(() => px(quote, '[data-share="quote"]')).toBeLessThan(42);
		await expect.poll(() => px(terminal, '[data-share="quote"]')).toBeLessThan(42);
		const box = async (el: typeof quote, sel: string) => (await el.locator(sel).last().boundingBox())!;
		const by = await box(quote, '[data-share="by"]');
		const foot = await box(quote, '[data-share="foot"]');
		expect(by.y + by.height).toBeLessThanOrEqual(foot.y);
		const cmd = await box(terminal, '[data-share="cmd"]');
		const frame = (await terminal.boundingBox())!;
		expect(cmd.y + cmd.height).toBeLessThanOrEqual(frame.y + frame.height);
	});

	test('AuthorHeader matches the kit', async ({ page }) => {
		await expectMatchesKit(
			page,
			'AuthorHeader',
			[
				['.qk-phead', 'css:header'],
				['.qk-phead .qk-eyebrow', 'css:header p:first-child'],
				['.qk-phead__name', 'css:header h1'],
				['.qk-phead__line', 'css:header h1 + p'],
				['.qk-phead__topics', 'css:header h1 + p + div'],
				['.qk-stats', 'css:header dl'],
				['.qk-stats dt', 'css:header dt'],
				['.qk-stats dd', 'css:header dd']
			],
			TEXT
		);
	});

	test('ProfileHeader matches the kit: avatar, role badge, joined, bio, stats', async ({ page }) => {
		await expectMatchesKit(
			page,
			'ProfileHeader',
			[
				['.qk-phead', 'css:header'],
				['.qk-phead__main--row', 'css:header > div:first-child'],
				['.qk-avatar', 'css:header [role="img"]'],
				['.qk-phead__name--sm', 'css:header h1'],
				['.qk-phead__line', 'css:header h1 + p'],
				['.qk-phead__handle', 'css:header h1 + p > span:first-child'],
				['.qk-phead__bio', 'css:header h1 + p + p'],
				['.qk-phead__side', 'css:header > div:last-child']
			],
			TEXT
		);
		const header = page.locator('header');
		await expect(header).toContainText('@ada');
		await expect(header).toContainText('· joined Aug 2026');
		await expect(header.locator('[data-status="VERIFIER"]')).toHaveText('verifier');
	});

	test('ContributionRow matches the kit and links to the quote', async ({ page }) => {
		await expectMatchesKit(
			page,
			'ContributionRow',
			[
				['.qk-contrib:nth-child(1)', 'css:a:nth-child(1)'],
				['.qk-contrib:nth-child(1) .qk-contrib__text', 'css:a:nth-child(1) > span > span:first-child'],
				['.qk-contrib:nth-child(1) .qk-contrib__meta', 'css:a:nth-child(1) > span > span:last-child'],
				['.qk-contrib:nth-child(2) .qk-contrib__text', 'css:a:nth-child(2) > span > span:first-child']
			],
			[...TEXT, 'text-overflow', 'white-space']
		);
		const first = page.getByRole('link').first();
		await expect(first).toHaveAttribute('href', '/q/8f2k1c');
		await expect(first).toContainText('— Edsger W. Dijkstra · Aug 04 · shipped in v2026.08.3');
		await expect(page.getByRole('link').nth(2)).toContainText('declared original · Sep 02');
		await first.focus();
		await expect.poll(() => first.evaluate((el) => getComputedStyle(el).outlineColor)).toBe('rgb(184, 92, 62)');
	});
});
