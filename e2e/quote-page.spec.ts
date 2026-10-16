import { E2E, expect, signIn, sql, test } from './fixtures';

const actions = (page: import('@playwright/test').Page) => page.getByRole('group', { name: 'Quote actions' }).first();

/** QOT-73: the quote page and its share and report dialogs. */
test.describe('quote page', () => {
	test('canonical: badges, the quote, provenance, the terminal command, share card, more from the author, related', async ({
		page
	}) => {
		const q = await (await page.request.get(`${E2E.api}/v1/quotes/q_8f2k1c`)).json();
		await page.goto('/q/8f2k1c');
		await expect(page).toHaveTitle(/Simplicity is prerequisite for reliability/);
		await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText('authors/dijkstra/q_8f2k1c');
		await expect(page.locator('[data-status="VERIFIED"]').first()).toBeVisible();
		await expect(page.locator('blockquote')).toHaveText('“Simplicity is prerequisite for reliability.”');
		await expect(page.locator('figcaption')).toContainText('Edsger W. Dijkstra · EWD 498, 1975');
		await expect(actions(page).getByRole('button', { name: /^recommend/ })).toHaveCount(0);
		await expect(actions(page).getByRole('button', { name: `like ${q.counts.likes}` })).toBeVisible();
		await expect(page.getByRole('region', { name: 'Provenance' })).toContainText('@mireille');
		await expect(page.locator('code', { hasText: 'qotm --author dijkstra' })).toBeVisible();
		const author = await (await page.request.get(`${E2E.api}/v1/authors/dijkstra`)).json();
		await expect(
			page.getByRole('link', { name: `${author.tabs.all} quotes, ${author.tabs.curated} curated` })
		).toHaveAttribute('href', '/authors/dijkstra');
		await expect(page.getByText(/^Also on /)).toBeVisible();
		const related = await (await page.request.get(`${E2E.api}/v1/quotes/q_8f2k1c/related`)).json();
		await expect(page.getByRole('article')).toHaveCount(Math.min(4, related.list.length));
		expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe(`${E2E.web}/q/8f2k1c`);
	});

	test('original: the declared-original notice, the road to the CLI, recommend', async ({ page }) => {
		await signIn(page, 'member');
		await page.goto('/q/4r8y1p');
		await expect(page.locator('[data-status="ORIGINAL"]').first()).toBeVisible();
		await expect(page.locator('[data-status="COMMUNITY"]')).toBeVisible();
		await expect(page.getByText('Declared original by @ada.')).toBeVisible();
		await expect(page.getByRole('list', { name: 'Lifecycle' }).getByRole('listitem')).toHaveCount(8);
		const recommend = actions(page).getByRole('button', { name: /^recommend/ });
		const was = await recommend.getAttribute('aria-pressed');
		await recommend.click();
		const now = was === 'true' ? 'false' : 'true';
		await expect(recommend).toHaveAttribute('aria-pressed', now);
		await expect(page.getByText('You recommended this.')).toHaveCount(now === 'true' ? 1 : 0);
		await page.reload();
		await expect(actions(page).getByRole('button', { name: /^recommend/ })).toHaveAttribute('aria-pressed', now);
		// Leave it as it was.
		await actions(page)
			.getByRole('button', { name: /^recommend/ })
			.click();
		await expect(actions(page).getByRole('button', { name: /^recommend/ })).toHaveAttribute('aria-pressed', was!);
	});

	test('like and favorite update at once and stick', async ({ page }) => {
		await signIn(page, 'member');
		await page.goto('/q/1t7c4e');
		const fav = actions(page).getByRole('button', { name: /^favorite/ });
		const before = Number((await fav.getAttribute('aria-label'))!.split(' ')[1]);
		const on = (await fav.getAttribute('aria-pressed')) === 'true';
		await fav.click();
		await expect(fav).toHaveAttribute('aria-label', `favorite ${before + (on ? -1 : 1)}`);
		await page.reload();
		await expect(actions(page).getByRole('button', { name: /^favorite/ })).toHaveAttribute('aria-pressed', String(!on));
		await actions(page)
			.getByRole('button', { name: /^favorite/ })
			.click();
	});

	test('share: quote and terminal cards, the permanent link, copy and download', async ({ page, context }) => {
		await context.grantPermissions(['clipboard-read', 'clipboard-write']);
		await page.goto('/q/8f2k1c');
		await page.getByRole('button', { name: 'Share this quote' }).click();
		const dialog = page.getByRole('dialog', { name: 'Share this quote' });
		await expect(dialog.getByLabel('Link')).toHaveValue(`${E2E.web}/q/8f2k1c`);
		await expect(dialog.getByRole('img', { name: /Simplicity/ })).toBeVisible();
		await dialog.getByRole('tab', { name: 'terminal card' }).click();
		await expect(dialog.getByRole('tab', { name: 'terminal card' })).toHaveAttribute('aria-selected', 'true');
		// The link carries the card picked, so it unfurls as that card.
		await expect(dialog.getByLabel('Link')).toHaveValue(`${E2E.web}/q/8f2k1c?card=terminal`);
		await dialog.getByRole('button', { name: 'Copy link' }).click();
		expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(`${E2E.web}/q/8f2k1c?card=terminal`);
		// The API's placeholder (no-store) until the worker has rendered the
		// card, then the render itself (the test stack runs no worker).
		let asked = 0;
		await page.route('**/v1/quotes/q_8f2k1c/share-image?variant=terminal', (route) =>
			++asked === 1
				? route.fulfill({
						status: 200,
						contentType: 'image/png',
						headers: { 'Cache-Control': 'no-store', 'Retry-After': '5', 'Access-Control-Allow-Origin': '*' },
						body: 'placeholder'
					})
				: route.fulfill({
						status: 200,
						contentType: 'image/png',
						headers: { 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' },
						body: 'rendered'
					})
		);
		const download = page.waitForEvent('download', { timeout: 15_000 });
		await dialog.getByRole('button', { name: 'Download image' }).click();
		await expect(dialog.getByRole('button', { name: 'Preparing image…' })).toBeVisible();
		const file = await download;
		expect(file.suggestedFilename()).toBe('qotm-q_8f2k1c-terminal.png');
		const { readFileSync } = await import('node:fs');
		expect(readFileSync((await file.path())!, 'utf8')).toBe('rendered');
		expect(asked).toBe(2);
		await page.keyboard.press('Escape');
		await expect(dialog).toHaveCount(0);
	});

	test('report: signed out goes to sign-in and back to the form; a report is sent once', async ({ page }) => {
		await page.goto('/q/9b5n2k');
		await page.getByRole('button', { name: /report a problem/ }).click();
		await expect(page).toHaveURL(/\/login\?redirect=%2Fq%2F9b5n2k%23report/);
		await signIn(page, 'member');
		sql(`delete from reports where reporter_id = (select id from "user" where email = 'test.user@example.com')`);
		await page.goto('/q/9b5n2k#report');
		const dialog = page.getByRole('dialog', { name: 'Report this quote' });
		await expect(dialog.getByRole('radio', { name: /Attribution/ })).toBeChecked();
		await dialog.getByRole('radio', { name: /Duplicate/ }).check();
		await dialog.getByLabel('Details').fill('Same as q_8f2k1c.');
		await dialog.getByRole('button', { name: 'Send report' }).click();
		await expect(page.getByText(/Report sent/)).toBeVisible();
		await expect(dialog).toHaveCount(0);
		expect(sql(`select reason, details from reports order by created_at desc limit 1`)).toBe(
			'DUPLICATE|Same as q_8f2k1c.'
		);
		await page.getByRole('button', { name: /report a problem/ }).click();
		await page.getByRole('dialog').getByRole('button', { name: 'Send report' }).click();
		await expect(page.getByText(/already have an open report/)).toBeVisible();
	});

	test('a withdrawn quote keeps its record under a notice, without actions', async ({ page }) => {
		const was = sql(`select status from quotes where public_id = 'q_9b5n2k'`);
		sql(`update quotes set status = 'WITHDRAWN' where public_id = 'q_9b5n2k'`);
		try {
			await page.goto('/q/9b5n2k');
			await expect(page.getByText('This quote was withdrawn.')).toBeVisible();
			await expect(page.locator('blockquote')).toContainText('Talk is cheap.');
			await expect(page.getByRole('group', { name: 'Quote actions' })).toHaveCount(0);
			await expect(page.getByRole('region', { name: 'Provenance' })).toBeVisible();
			expect(await page.locator('meta[name="robots"]').getAttribute('content')).toContain('noindex');
		} finally {
			sql(`update quotes set status = '${was}' where public_id = 'q_9b5n2k'`);
		}
	});

	test('an unknown quote is a 404 page; at 760 the columns stack', async ({ page }) => {
		await page.goto('/q/zzzzzz');
		await expect(page.getByText('No quote here.')).toBeVisible();
		await expect(page.getByRole('link', { name: 'Discover quotes' })).toHaveAttribute('href', '/discover');
		await page.setViewportSize({ width: 760, height: 900 });
		await page.goto('/q/8f2k1c');
		const provenance = await page.getByRole('region', { name: 'Provenance' }).boundingBox();
		const command = await page.locator('code', { hasText: 'qotm --author dijkstra' }).boundingBox();
		expect(command!.y).toBeGreaterThan(provenance!.y + provenance!.height - 1);
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(760);
	});
});
