import { E2E, expect, signIn, test } from './fixtures';
import type { Page } from '@playwright/test';

const api = async (page: Page, path: string) => (await page.request.get(`${E2E.api}${path}`)).json();
const cards = (page: Page) => page.getByRole('article');

/** QOT-72: the feeds (/discover, /latest, /curated). */
test.describe('feeds', () => {
	test('discover: heading, tabs, ten cards then more, topics, type and the dark note', async ({ page }) => {
		await page.goto('/discover');
		await expect(page).toHaveTitle(/Discover/);
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Discover.');
		await expect(page.getByRole('tablist', { name: 'Feeds' }).getByRole('tab', { name: 'discover' })).toHaveAttribute(
			'aria-selected',
			'true'
		);
		await expect(cards(page)).toHaveCount(10);
		await expect(page.getByRole('navigation', { name: 'Topics' }).getByRole('link')).toHaveCount(15);
		await expect(page.getByLabel('Type')).toHaveValue('');
		await expect(page.getByText('Curated quotes reach every install on the next qotm sync.')).toBeVisible();
		const all = await api(page, '/v1/quotes?feed=discover&limit=50');
		// Other specs publish quotes too: load pages until the feed ends.
		const more = page.getByRole('button', { name: 'load more' });
		while ((await cards(page).count()) < all.list.length) {
			const shown = await cards(page).count();
			await more.click();
			await expect(cards(page)).not.toHaveCount(shown);
		}
		await expect(cards(page)).toHaveCount(all.list.length);
		await expect(page.getByRole('button', { name: 'load more' })).toHaveCount(0);
		// The API's order, page after page.
		const ids = await cards(page).evaluateAll((els) => els.map((el) => el.querySelector('span.ml-auto')?.textContent));
		expect(ids).toEqual(all.list.map((q: { id: string }) => q.id));
	});

	test('latest: newest first, and published isn’t shipped', async ({ page }) => {
		await page.goto('/latest');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Latest.');
		const first = (await api(page, '/v1/quotes?feed=latest&limit=1')).list[0];
		await expect(cards(page).first()).toContainText(first.text);
		await expect(page.getByText('Published isn’t shipped.')).toBeVisible();
	});

	test('curated: the current release and qotm sync', async ({ page }) => {
		const release = await api(page, '/v1/releases/current');
		await page.goto('/curated');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Curated.');
		await expect(page.getByText(`${release.version} · ${release.quotes} quotes`)).toBeVisible();
		await expect(page.locator('code', { hasText: 'qotm sync' })).toBeVisible();
		await expect(cards(page)).toHaveCount(release.quotes);
	});

	test('the topic filter lives in the URL and toggles', async ({ page }) => {
		await page.goto('/discover');
		const topics = page.getByRole('navigation', { name: 'Topics' });
		await topics.getByRole('link', { name: 'debugging' }).click();
		await expect(page).toHaveURL(/\/discover\?topic=debugging$/);
		await expect(topics.getByRole('link', { name: 'debugging' })).toHaveAttribute('aria-current', 'page');
		const expected = await api(page, '/v1/quotes?feed=discover&topic=debugging&limit=50');
		await expect(cards(page)).toHaveCount(Math.min(10, expected.list.length));
		for (const card of await cards(page).all())
			await expect(card.getByRole('link', { name: 'debugging', exact: true })).toBeVisible();
		// Another feed keeps the filter; picking the topic again clears it.
		await page.getByRole('tab', { name: 'latest' }).click();
		await expect(page).toHaveURL(/\/latest\?topic=debugging$/);
		await topics.getByRole('link', { name: 'debugging' }).click();
		await expect(page).toHaveURL(/\/latest$/);
	});

	test('the type select filters to declared originals, and an empty result says so', async ({ page }) => {
		await page.goto('/latest');
		await page.getByLabel('Type').selectOption('original');
		await expect(page).toHaveURL(/type=original/);
		const originals = await api(page, '/v1/quotes?feed=latest&type=original&limit=10');
		await expect(cards(page)).toHaveCount(originals.list.length);
		for (const card of await cards(page).all()) await expect(card.locator('[data-status="ORIGINAL"]')).toBeVisible();
		await page.goto('/curated?type=original');
		await expect(page.getByText('No quotes match these filters.')).toBeVisible();
		await page.getByRole('button', { name: 'Clear filters' }).click();
		await expect(page).toHaveURL(/\/curated$/);
		await expect(cards(page).first()).toBeVisible();
	});

	test('signed out, liking goes to sign-in and back', async ({ page }) => {
		await page.goto('/latest');
		await cards(page).first().getByRole('button', { name: /^like/ }).click();
		await expect(page).toHaveURL(/\/login\?redirect=%2Flatest/);
	});

	test('signed in, a like and a favorite save, and undo', async ({ page }) => {
		await signIn(page, 'member');
		await page.goto('/latest');
		const card = cards(page).first();
		const like = card.getByRole('button', { name: /^like/ });
		const before = Number((await like.getAttribute('aria-label'))!.split(' ')[1]);
		await like.click();
		await expect(like).toHaveAttribute('aria-pressed', 'true');
		await expect(like).toHaveAttribute('aria-label', `like ${before + 1}`);
		await page.reload();
		await expect(cards(page).first().getByRole('button', { name: /^like/ })).toHaveAttribute('aria-pressed', 'true');
		await cards(page).first().getByRole('button', { name: /^like/ }).click();
		await expect(cards(page).first().getByRole('button', { name: /^like/ })).toHaveAttribute(
			'aria-label',
			`like ${before}`
		);
		await page.reload();
		await expect(cards(page).first().getByRole('button', { name: /^like/ })).toHaveAttribute('aria-pressed', 'false');
	});

	test('a refused reaction rolls back', async ({ page }) => {
		await signIn(page, 'member');
		await page.route('**/v1/quotes/*/favorite', (route) => route.fulfill({ status: 500, body: '{}' }));
		await page.goto('/latest');
		const fav = cards(page)
			.first()
			.getByRole('button', { name: /^favorite/ });
		const label = await fav.getAttribute('aria-label');
		await fav.click();
		await expect(page.getByText('That did not save. Try again.')).toBeVisible();
		await expect(fav).toHaveAttribute('aria-pressed', 'false');
		await expect(fav).toHaveAttribute('aria-label', label!);
	});

	test('share copies the quote’s link', async ({ page, context }) => {
		await context.grantPermissions(['clipboard-read', 'clipboard-write']);
		await page.goto('/curated');
		await cards(page).first().getByRole('button', { name: 'share' }).click();
		await expect(page.getByText(/Link copied: \/q\//)).toBeVisible();
		expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(new RegExp(`^${E2E.web}/q/\\w+$`));
	});

	test('a failed feed says so and retries; at 760 the side column follows', async ({ page }) => {
		let fail = true;
		await page.route('**/v1/quotes?*', (route) =>
			fail ? route.fulfill({ status: 500, body: '{}' }) : route.continue()
		);
		await page.goto('/discover');
		await expect(page.getByText('The quotes did not load.')).toBeVisible();
		fail = false;
		await page.getByRole('button', { name: 'Try again' }).click();
		await expect(cards(page).first()).toBeVisible();
		await page.setViewportSize({ width: 760, height: 900 });
		const feed = await cards(page).last().boundingBox();
		const topics = await page.getByRole('navigation', { name: 'Topics' }).boundingBox();
		expect(topics!.y).toBeGreaterThan(feed!.y);
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(760);
	});
});
