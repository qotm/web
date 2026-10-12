import { E2E, expect, test } from './fixtures';

/** QOT-71: the landing page. */
test.describe('landing', () => {
	test('the hero, how it works, curated this week, provenance and contribute, from the API', async ({ page }) => {
		const curated = await (await page.request.get(`${E2E.api}/v1/quotes?feed=curated&limit=2`)).json();
		const featured = curated.list[0];
		await page.goto('/');
		await expect(page).toHaveTitle('qotm — a thought between commands');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('A thought between commands.');
		await expect(page.getByRole('button', { name: 'Copy npm i -g qotm' }).first()).toBeVisible();
		await expect(page.getByRole('link', { name: /browse the quotes/ })).toHaveAttribute('href', '/discover');
		// The terminal prints the featured curated quote.
		await expect(page.getByText(featured.text, { exact: true }).first()).toBeVisible();
		await expect(page.getByText(`opening q/${featured.id.slice(2)} in your browser`)).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Terminal first. Community behind it.' })).toBeVisible();
		await expect(page.getByRole('article')).toHaveCount(curated.list.length);
		await expect(page.getByRole('region', { name: 'Provenance' })).toContainText(featured.id);
		await expect(page.getByRole('link', { name: /See a full quote record/ })).toHaveAttribute(
			'href',
			`/q/${featured.id.slice(2)}`
		);
		await expect(page.getByRole('list', { name: 'Lifecycle' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Submit a quote', exact: true })).toHaveAttribute('href', '/submit');
		await expect(page.getByRole('link', { name: 'Create an account' })).toHaveAttribute('href', '/login');
	});

	test('nothing curated yet says so; a failed feed retries', async ({ page }) => {
		await page.route('**/v1/quotes?feed=curated*', (route) => route.fulfill({ json: { list: [], nextCursor: null } }));
		await page.goto('/');
		await expect(page.getByText('Nothing curated yet.')).toBeVisible();
		await page.unroute('**/v1/quotes?feed=curated*');
		let fail = true;
		await page.route('**/v1/quotes?feed=curated*', (route) =>
			fail ? route.fulfill({ status: 500, body: '{}' }) : route.continue()
		);
		await page.reload();
		await expect(page.getByText('The quotes did not load.')).toBeVisible();
		fail = false;
		await page.getByRole('button', { name: 'Try again' }).click();
		await expect(page.getByRole('article').first()).toBeVisible();
	});

	test('stacks at 760 without sideways scroll', async ({ page }) => {
		await page.setViewportSize({ width: 760, height: 900 });
		await page.goto('/');
		const h1 = await page.getByRole('heading', { level: 1 }).boundingBox();
		const terminal = await page.getByText('saved to favorites').boundingBox();
		expect(terminal!.y).toBeGreaterThan(h1!.y + h1!.height);
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(760);
	});
});
