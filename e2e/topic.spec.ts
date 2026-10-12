import { E2E, expect, test } from './fixtures';

/** QOT-75: the topic page (and the /topics index it shares a route with). */
test.describe('topic page', () => {
	test('strip with the topic on, header, command, curated / all tabs, from the API', async ({ page }) => {
		const topic = await (await page.request.get(`${E2E.api}/v1/topics/debugging`)).json();
		await page.goto('/topics/debugging');
		await expect(page).toHaveTitle(/Debugging/);
		const strip = page.getByRole('navigation', { name: 'All topics' });
		await expect(strip.getByRole('link')).toHaveCount(15);
		await expect(strip.getByRole('link', { name: 'debugging' })).toHaveAttribute('aria-current', 'page');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Debugging.');
		await expect(page.getByText(`${topic.counts.quotes} quotes, ${topic.counts.curated} curated.`)).toBeVisible();
		await expect(page.locator('code', { hasText: 'qotm --topic debugging' })).toBeVisible();
		const tabs = page.getByRole('tablist', { name: 'Quotes by state' });
		await expect(tabs.getByRole('tab', { name: `curated ${topic.counts.curated}` })).toHaveAttribute(
			'aria-selected',
			'true'
		);
		await expect(page.getByRole('article')).toHaveCount(Math.min(10, topic.counts.curated));
		await tabs.getByRole('tab', { name: `all ${topic.counts.quotes}` }).click();
		await expect(page).toHaveURL(/\/topics\/debugging\?tab=all$/);
		await expect(page.getByRole('article')).toHaveCount(Math.min(10, topic.counts.quotes));
		await strip.getByRole('link', { name: 'unix' }).click();
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Unix.');
	});

	test('a topic with nothing curated says so', async ({ page }) => {
		const all = await (await page.request.get(`${E2E.api}/v1/topics`)).json();
		const bare = all.list.find((t: { counts: { curated: number } }) => t.counts.curated === 0);
		test.skip(!bare, 'every seeded topic has a curated quote');
		await page.goto(`/topics/${bare.slug}`);
		await expect(page.getByText(`Nothing on ${bare.name} is curated yet.`)).toBeVisible();
	});

	test('/topics lists the taxonomy; an unknown topic is a 404', async ({ page }) => {
		await page.goto('/topics');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Topics.');
		await expect(page.getByRole('article')).toHaveCount(15);
		await page.getByRole('link', { name: 'Simplicity', exact: true }).click();
		await expect(page).toHaveURL(/\/topics\/simplicity$/);
		await page.goto('/topics/astrology');
		await expect(page.getByText('No topic by that name.')).toBeVisible();
	});

	test('stacks at 760 without sideways scroll', async ({ page }) => {
		await page.setViewportSize({ width: 760, height: 900 });
		await page.goto('/topics/debugging');
		await expect(page.getByRole('article').first()).toBeVisible();
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(760);
	});
});
