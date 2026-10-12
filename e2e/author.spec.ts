import { E2E, expect, test } from './fixtures';

/** QOT-74: the author page. */
test.describe('author page', () => {
	test('header, tabs with counts, the quotes and the terminal command, from the API', async ({ page }) => {
		const author = await (await page.request.get(`${E2E.api}/v1/authors/dijkstra`)).json();
		await page.goto('/authors/dijkstra');
		await expect(page).toHaveTitle(/Edsger W\. Dijkstra/);
		await expect(page.getByRole('heading', { level: 1 })).toHaveText(author.name);
		await expect(page.getByText(author.line)).toBeVisible();
		for (const t of author.topics)
			await expect(page.locator('header').getByRole('link', { name: t.name })).toBeVisible();
		const tabs = page.getByRole('tablist', { name: 'Quotes by state' });
		await expect(tabs.getByRole('tab', { name: `all ${author.tabs.all}` })).toHaveAttribute('aria-selected', 'true');
		await expect(page.getByRole('article')).toHaveCount(Math.min(10, author.tabs.all));
		await expect(page.locator('code', { hasText: 'qotm --author dijkstra' })).toBeVisible();

		await tabs.getByRole('tab', { name: `curated ${author.tabs.curated}` }).click();
		await expect(page).toHaveURL(/\/authors\/dijkstra\?tab=curated$/);
		await expect(page.getByRole('article')).toHaveCount(Math.min(10, author.tabs.curated));
		await tabs.getByRole('tab', { name: `in review ${author.tabs.review}` }).click();
		await expect(page).toHaveURL(/tab=review$/);
		if (author.tabs.review === 0)
			await expect(page.getByText('Nothing of theirs is being checked right now.')).toBeVisible();
		else await expect(page.getByRole('article')).toHaveCount(Math.min(10, author.tabs.review));
	});

	test('an unknown author is a 404 with a way to search', async ({ page }) => {
		await page.goto('/authors/nobody-at-all');
		await expect(page.getByText('No author here.')).toBeVisible();
		await expect(page.getByRole('link', { name: 'Search authors' })).toHaveAttribute('href', '/search?type=authors');
	});

	test('stacks at 760 without sideways scroll', async ({ page }) => {
		await page.setViewportSize({ width: 760, height: 900 });
		await page.goto('/authors/dijkstra');
		await expect(page.getByRole('article').first()).toBeVisible();
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(760);
	});
});
