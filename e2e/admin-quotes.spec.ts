import { E2E, apiAs, expect, signIn, test } from './fixtures';

const rows = (page: import('@playwright/test').Page) => page.getByRole('table', { name: 'Quotes' }).locator('tbody tr');

/** QOT-84: admin quotes. */
test.describe('admin quotes', () => {
	test('lists every public quote with the counts, and filters by search, type and state', async ({ page }) => {
		await signIn(page, 'admin');
		const all = await (await page.request.get(`${E2E.api}/v1/admin/quotes?limit=15`)).json();
		await page.goto('/admin/quotes');
		await expect(page).toHaveTitle(/^Quotes/);
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
		await expect(
			page.getByText(
				`${all.counts.public.toLocaleString('en-US')} public quotes. ${all.counts.eligible.toLocaleString('en-US')} are eligible for the next release.`
			)
		).toBeVisible();
		await expect(rows(page)).toHaveCount(Math.min(15, all.list.length));

		await page.getByLabel('Search quotes').fill('Kernighan');
		const kernighan = await (await page.request.get(`${E2E.api}/v1/admin/quotes?q=Kernighan`)).json();
		await expect(rows(page)).toHaveCount(kernighan.list.length);
		for (const r of await rows(page).all()) await expect(r).toContainText('Kernighan');
		await page.getByLabel('Search quotes').fill('');

		await page.getByLabel('Type').selectOption('original');
		await expect(page).toHaveURL(/type=original/);
		const originals = await (await page.request.get(`${E2E.api}/v1/admin/quotes?type=original&limit=15`)).json();
		await expect(rows(page)).toHaveCount(Math.min(15, originals.list.length));
		for (const r of await rows(page).all()) await expect(r).toContainText('original');

		await page.getByLabel('Type').selectOption('');
		await page.getByLabel('State').selectOption('CURATED');
		const curated = await (await page.request.get(`${E2E.api}/v1/admin/quotes?state=CURATED&limit=15`)).json();
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

	test('a row opens the quote’s drawer beside the table; its id still opens the public page', async ({ page }) => {
		await signIn(page, 'admin');
		const all = await (await page.request.get(`${E2E.api}/v1/admin/quotes?limit=15`)).json();
		const [a, b] = all.list;
		await page.goto('/admin/quotes');
		await page.getByRole('row', { name: `Open ${a.id}` }).click();
		await expect(page).toHaveURL(new RegExp(`peek=${a.id}`));
		const drawer = page.getByRole('dialog', { name: `Quote ${a.id}` });
		await expect(drawer).toContainText(a.text);
		await expect(drawer).toContainText(`1 of ${all.list.length} on this page`);
		await expect(drawer.getByRole('heading', { name: 'History' })).toBeVisible();
		await expect(page.getByRole('row', { name: `Open ${a.id}` })).toHaveAttribute('aria-current', 'true');
		// The table stays usable beside it.
		await expect(page.getByRole('row', { name: `Open ${b.id}` })).toBeVisible();

		await page.keyboard.press('j');
		await expect(page.getByRole('dialog', { name: `Quote ${b.id}` })).toContainText(b.text);
		await drawer.page().keyboard.press('Escape');
		await expect(page.getByRole('dialog', { name: /^Quote / })).toHaveCount(0);
		await expect(page).not.toHaveURL(/peek=/);

		await page.getByRole('link', { name: a.id, exact: true }).click();
		await expect(page).toHaveURL(new RegExp(`/q/${a.id.replace(/^q_/, '')}$`));
	});

	test('the drawer’s main action opens the queue the quote waits in, or its open report', async ({ page }) => {
		await signIn(page, 'admin');
		// q_6h2w8r waits for evidence in the verification queue.
		await page.goto('/admin/quotes?peek=q_6h2w8r');
		const drawer = page.getByRole('dialog', { name: 'Quote q_6h2w8r' });
		await expect(drawer.getByRole('link', { name: /Open in verification queue/ })).toHaveAttribute(
			'href',
			'/admin/verification?id=q_6h2w8r'
		);

		const moderator = await apiAs('moderator');
		const res = await moderator.post('/v1/quotes/q_9b5n2k/reports', {
			data: { reason: 'attribution', details: `Torvalds wrote it on a list in 2000 ${Date.now()}.` }
		});
		expect(res.ok(), await res.text()).toBe(true);
		await moderator.dispose();
		await page.goto('/admin/quotes?peek=q_9b5n2k');
		const reported = page.getByRole('dialog', { name: 'Quote q_9b5n2k' });
		await expect(reported).toContainText(/open reports? · attribution/);
		await reported.getByRole('link', { name: /Review report/ }).click();
		await expect(page).toHaveURL(/\/admin\/reports\?id=r_/);
		await expect(page.getByRole('region', { name: /^Report r_/ })).toContainText('q_9b5n2k');
	});
});
