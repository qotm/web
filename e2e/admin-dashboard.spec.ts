import { E2E, expect, signIn, test } from './fixtures';

/** QOT-83: the admin dashboard, on the API's figures. */
test.describe('admin dashboard', () => {
	test('shows the queues, the oldest items, the release and the 30-day figures', async ({ page }) => {
		await signIn(page, 'admin');
		const stats = await (await page.request.get(`${E2E.api}/v1/admin/stats`)).json();
		const oldest = await (await page.request.get(`${E2E.api}/v1/admin/queues/oldest`)).json();
		const releases = await (await page.request.get(`${E2E.api}/v1/admin/releases?limit=1`)).json();
		await page.goto('/admin');
		await expect(page).toHaveTitle(/^Dashboard/);
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
		const main = page.getByRole('main');
		await expect(main.getByRole('heading', { level: 1, name: 'Dashboard.' })).toBeVisible();

		await expect(
			main.getByRole('link', { name: `Verification queue: ${stats.queues.verification.count}` })
		).toBeVisible();
		await expect(main.getByRole('link', { name: `Open reports: ${stats.queues.reports.count}` })).toContainText(
			`${stats.queues.reports.onCurated} on a curated quote`
		);
		await expect(
			main.getByRole('link', { name: `Originality holds: ${stats.queues.submissions.count}` })
		).toBeVisible();

		const table = main.getByRole('table', { name: 'Oldest in the queues' });
		if (oldest.list.length)
			await expect(table.getByRole('cell', { name: oldest.list[0].id, exact: true })).toBeVisible();
		else await expect(table).toContainText('Every queue is empty');

		if (releases.current) {
			const v = releases.current.version.replace(/^v?/, 'v');
			await expect(main.getByRole('region', { name: `Dataset ${v}` })).toContainText(
				releases.current.eligible.toLocaleString('en-US')
			);
		} else await expect(main.getByText('No release in progress.')).toBeVisible();

		await expect(main.getByRole('heading', { name: 'Corpus quality · last 30 days' })).toBeVisible();
		await expect(main.getByText('Curated this period')).toBeVisible();
		await expect(main.getByRole('heading', { name: 'Community and CLI' })).toBeVisible();
		await expect(main.getByText('Registrations', { exact: true })).toBeVisible();
	});

	test('a queue card and an oldest row open their queue', async ({ page }) => {
		await signIn(page, 'admin');
		await page.goto('/admin');
		await page
			.getByRole('main')
			.getByRole('link', { name: /^Curation queue:/ })
			.click();
		await expect(page).toHaveURL(/\/admin\/curation$/);
		await page.goBack();
		const row = page
			.getByRole('table', { name: 'Oldest in the queues' })
			.getByRole('row', { name: /^Open the/ })
			.first();
		if (await row.count()) {
			const name = (await row.getAttribute('aria-label')) ?? '';
			await row.click();
			const queue = /Open the (\w+) queue/.exec(name)![1];
			await expect(page).toHaveURL(new RegExp(`/admin/${queue}$`));
		}
	});

	test('a moderator lands on their first page instead', async ({ page }) => {
		await signIn(page, 'moderator');
		await page.goto('/admin');
		await expect(page).toHaveURL(/\/admin\/submissions$/);
	});

	test('stacks at 760', async ({ page }) => {
		await page.setViewportSize({ width: 760, height: 1000 });
		await signIn(page, 'admin');
		await page.goto('/admin');
		await expect(page.getByRole('heading', { name: 'Community and CLI' })).toBeVisible();
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(760);
	});
});
