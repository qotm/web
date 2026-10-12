import { E2E, expect, signIn, test } from './fixtures';

const rows = (page: import('@playwright/test').Page) => page.getByRole('table', { name: 'Quotes' }).locator('tbody tr');

/** QOT-84: admin quotes. */
test.describe('admin quotes', () => {
	test('lists every public quote with the counts, and filters by search, type and state', async ({ page }) => {
		await signIn(page, 'admin');
		const all = await (await page.request.get(`${E2E.api}/v1/admin/quotes?limit=25`)).json();
		await page.goto('/admin/quotes');
		await expect(page).toHaveTitle(/^Quotes/);
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
		await expect(
			page.getByText(
				`${all.counts.public.toLocaleString('en-US')} public quotes. ${all.counts.eligible.toLocaleString('en-US')} are eligible for the next release.`
			)
		).toBeVisible();
		await expect(rows(page)).toHaveCount(Math.min(25, all.list.length));

		await page.getByLabel('Search quotes').fill('Kernighan');
		const kernighan = await (await page.request.get(`${E2E.api}/v1/admin/quotes?q=Kernighan`)).json();
		await expect(rows(page)).toHaveCount(kernighan.list.length);
		for (const r of await rows(page).all()) await expect(r).toContainText('Kernighan');
		await page.getByLabel('Search quotes').fill('');

		await page.getByLabel('Type').selectOption('original');
		await expect(page).toHaveURL(/type=original/);
		const originals = await (await page.request.get(`${E2E.api}/v1/admin/quotes?type=original&limit=25`)).json();
		await expect(rows(page)).toHaveCount(Math.min(25, originals.list.length));
		for (const r of await rows(page).all()) await expect(r).toContainText('original');

		await page.getByLabel('Type').selectOption('');
		await page.getByLabel('State').selectOption('CURATED');
		const curated = await (await page.request.get(`${E2E.api}/v1/admin/quotes?state=CURATED&limit=25`)).json();
		await expect(rows(page)).toHaveCount(curated.list.length);
		await expect(rows(page).first()).toContainText('curated');

		await page.getByLabel('Search quotes').fill('no quote says this zzz');
		await expect(page.getByText('No quotes match.')).toBeVisible();
	});

	test('selects rows and copies their ids', async ({ page, context }) => {
		await context.grantPermissions(['clipboard-read', 'clipboard-write']);
		await signIn(page, 'admin');
		await page.goto('/admin/quotes');
		await rows(page).nth(0).getByRole('checkbox').check();
		await rows(page).nth(1).getByRole('checkbox').check();
		await expect(page.getByText('2 selected')).toBeVisible();
		await page.getByRole('button', { name: 'Copy ids' }).click();
		await expect(page.getByText('Copied 2 ids.')).toBeVisible();
		expect((await page.evaluate(() => navigator.clipboard.readText())).split('\n')).toHaveLength(2);
		await page.getByRole('button', { name: 'Clear' }).click();
		await expect(page.getByText('2 selected')).toHaveCount(0);
	});

	test('exports the filtered list, and offers the CSV when it is ready', async ({ page }) => {
		await signIn(page, 'admin');
		await page.goto('/admin/quotes?state=CURATED');
		const queued = page.waitForRequest((r) => r.url().endsWith('/v1/admin/quotes/export'));
		await page.getByRole('button', { name: 'Export CSV' }).click();
		expect((await queued).postDataJSON()).toEqual({ state: 'CURATED' });
		// The test stack runs no worker: the export waits.
		await expect(page.getByText('Export queued.')).toBeVisible();

		// As the worker would leave it.
		await page.route(/\/v1\/admin\/exports\/[^/]+$/, (route) =>
			route.fulfill({
				json: { id: 'x', state: 'ready', rows: 9, bytes: 2048, error: null, requestedAt: new Date().toISOString() }
			})
		);
		await expect(page.getByText('Your export is ready.')).toBeVisible({ timeout: 10_000 });
		await expect(page.getByText('9 quotes · 2.0 KB.')).toBeVisible();
		await expect(page.getByRole('link', { name: 'Download CSV' })).toHaveAttribute(
			'href',
			new RegExp(`^${E2E.api}/v1/admin/exports/.+/download$`)
		);
	});

	test('only admins may open it', async ({ page }) => {
		await signIn(page, 'moderator');
		await page.goto('/admin/quotes');
		await expect(page.getByText('Not authorized')).toBeVisible();
	});

	test('stacks at 760', async ({ page }) => {
		await page.setViewportSize({ width: 760, height: 1000 });
		await signIn(page, 'admin');
		await page.goto('/admin/quotes');
		await expect(rows(page).first()).toBeVisible();
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(760);
	});
});
