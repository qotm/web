import { E2E, expect, signIn, test } from './fixtures';

const api = async (page: import('@playwright/test').Page, q: string, type = 'quotes') =>
	(await page.request.get(`${E2E.api}/v1/search?q=${encodeURIComponent(q)}&type=${type}`)).json();

/** QOT-76: search. */
test.describe('search', () => {
	test('quotes, with the counts for every tab, matching topics and the offline note', async ({ page }) => {
		const res = await api(page, 'complexity');
		await page.goto('/search?q=complexity');
		await expect(page).toHaveTitle(/Search: complexity/);
		await expect(page.getByRole('searchbox', { name: 'Search' })).toHaveValue('complexity');
		const tabs = page.getByRole('tablist', { name: 'Results' });
		for (const t of ['quotes', 'authors', 'topics'])
			await expect(tabs.getByRole('tab', { name: `${t} ${res.counts[t]}` })).toBeVisible();
		await expect(tabs.getByRole('tab', { name: /^quotes/ })).toHaveAttribute('aria-selected', 'true');
		await expect(page.getByRole('article')).toHaveCount(res.total);
		if (res.counts.topics)
			await expect(page.getByRole('link', { name: 'complexity', exact: true }).last()).toBeVisible();
		await expect(page.getByText('The same search works offline: qotm search "complexity"')).toBeVisible();
	});

	test('the authors and topics tabs list theirs, and an empty tab says so with its command', async ({ page }) => {
		const res = await api(page, 'dijkstra', 'authors');
		await page.goto('/search?q=dijkstra');
		await page.getByRole('tab', { name: `authors ${res.counts.authors}` }).click();
		await expect(page).toHaveURL(/\/search\?q=dijkstra&type=authors$/);
		await expect(page.getByRole('tab', { name: /^authors/ })).toHaveAttribute('aria-selected', 'true');
		// The author card (not a quote card's attribution, which the quotes tab also links).
		const card = page.locator('[data-slot="card"]').filter({ hasText: 'Author' });
		await expect(card.getByRole('link', { name: 'Edsger W. Dijkstra' })).toHaveAttribute('href', '/authors/dijkstra');
		await page.getByRole('tab', { name: /^topics/ }).click();
		await expect(page.getByText('No topics match “dijkstra”.')).toBeVisible();
		await expect(page.locator('code', { hasText: 'qotm search "dijkstra"' }).first()).toBeVisible();
	});

	test('a new search from the field keeps the tab; the header search lands here', async ({ page }) => {
		await page.goto('/search?q=dijkstra&type=authors');
		const field = page.getByRole('searchbox', { name: 'Search' });
		await field.fill('kernighan');
		await field.press('Enter');
		await expect(page).toHaveURL(/\/search\?q=kernighan&type=authors$/);
		await expect(page.getByRole('link', { name: /Kernighan/ }).first()).toBeVisible();
		await signIn(page, 'member');
		await page.goto('/discover');
		const header = page.getByRole('banner').getByRole('searchbox');
		await header.fill('zzzz');
		await header.press('Enter');
		await expect(page).toHaveURL(/\/search\?q=zzzz$/);
		await expect(page.getByText('No quotes match “zzzz”.')).toBeVisible();
	});

	test('no query asks for one; a failed search retries; 760 without sideways scroll', async ({ page }) => {
		await page.goto('/search');
		await expect(page.getByText('Search quotes, authors and topics.')).toBeVisible();
		let fail = true;
		await page.route('**/v1/search?*', (route) =>
			fail ? route.fulfill({ status: 500, body: '{}' }) : route.continue()
		);
		await page.goto('/search?q=complexity');
		await expect(page.getByText('The search did not run.')).toBeVisible();
		fail = false;
		await page.getByRole('button', { name: 'Try again' }).click();
		await expect(page.getByRole('article').first()).toBeVisible();
		await page.setViewportSize({ width: 760, height: 900 });
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(760);
	});
});
