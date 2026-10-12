import { E2E, expect, signIn, test } from './fixtures';

/**
 * QOT-91: dataset releases and the publish confirmation. The test stack runs
 * no worker, so a queued build or publish stays queued: these tests check
 * what the page asks for and shows, and run in order (publish, then build).
 */
test.describe('admin releases', () => {
	test('shows the release in progress, what ships, and the published releases', async ({ page }) => {
		await signIn(page, 'admin');
		const releases = await (await page.request.get(`${E2E.api}/v1/admin/releases?limit=10`)).json();
		await page.goto('/admin/releases');
		await expect(page).toHaveTitle(/^Dataset releases/);
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
		const current = releases.current;
		const summary = page.getByRole('region', { name: `Dataset ${current.version}` });
		await expect(summary).toContainText('preview built');
		await expect(summary).toContainText(current.sha256.slice(0, 6));
		await expect(page.getByText('Included', { exact: true })).toBeVisible();
		await expect(page.getByText('Never exported', { exact: true })).toBeVisible();
		const table = page.getByRole('table', { name: 'Published releases' });
		await expect(table.getByRole('row')).toHaveCount(releases.list.length + 1);
		const latest = releases.list[0];
		await expect(table.getByRole('row').nth(1)).toContainText(latest.version);
		await expect(table.getByRole('row').nth(1)).toContainText(
			`+${latest.added} ~${latest.corrected} −${latest.withdrawn}`
		);
	});

	test('publishing asks for the reviewed-preview tick, then queues the publish', async ({ page }) => {
		await signIn(page, 'admin');
		const { current } = await (await page.request.get(`${E2E.api}/v1/admin/releases?limit=1`)).json();
		await page.goto('/admin/releases');
		await page
			.getByRole('region', { name: `Dataset ${current.version}` })
			.getByRole('button', { name: 'Publish' })
			.click();
		const dialog = page.getByRole('dialog', { name: `Publish ${current.version}?` });
		await expect(dialog).toContainText('Every qotm install picks this up on its next qotm sync.');
		await expect(dialog).toContainText(`${current.eligible.toLocaleString('en-US')}eligible quotes`);
		await expect(dialog).toContainText(`schema ${current.schemaVersion}`);
		const publish = dialog.getByRole('button', { name: 'Publish release' });
		await expect(publish).toBeDisabled();
		await dialog.getByRole('button', { name: 'Cancel' }).click();
		await expect(dialog).toHaveCount(0);

		await page
			.getByRole('region', { name: `Dataset ${current.version}` })
			.getByRole('button', { name: 'Publish' })
			.click();
		await dialog.getByRole('checkbox', { name: 'I reviewed the preview build.' }).check();
		await expect(publish).toBeEnabled();
		const request = page.waitForRequest((r) => r.url().endsWith(`/v1/admin/releases/${current.version}/publish`));
		await publish.click();
		expect((await request).postDataJSON()).toEqual({ reviewed: true });
		await expect(page.getByText(`Publishing ${current.version}. Installs get it`)).toBeVisible();
		await expect(page.getByText(`Publishing ${current.version}.`, { exact: true })).toBeVisible();
	});

	test('build preview queues a build, and the page shows it running', async ({ page }) => {
		await signIn(page, 'admin');
		const { current } = await (await page.request.get(`${E2E.api}/v1/admin/releases?limit=1`)).json();
		await page.goto('/admin/releases');
		const summary = page.getByRole('region', { name: `Dataset ${current.version}` });
		await summary.getByRole('button', { name: 'Build preview' }).click();
		await expect(page.getByText(`Building a preview of ${current.version}.`)).toBeVisible();
		await expect(page.getByText('Building the preview.')).toBeVisible();
		await expect(summary.getByRole('button', { name: 'Build preview' })).toBeDisabled();
		const again = await page.request.post(`${E2E.api}/v1/admin/releases/preview`, { headers: { Origin: E2E.web } });
		expect(again.status()).toBe(409);
	});

	test('verifiers and moderators may not open it', async ({ page }) => {
		for (const who of ['verifier', 'moderator'] as const) {
			await page.context().clearCookies();
			await signIn(page, who);
			await page.goto('/admin/releases');
			await expect(page.getByText('Not authorized')).toBeVisible();
		}
	});

	test('stacks at 760', async ({ page }) => {
		await page.setViewportSize({ width: 760, height: 1000 });
		await signIn(page, 'admin');
		await page.goto('/admin/releases');
		await expect(page.getByRole('heading', { name: 'Published' })).toBeVisible();
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(760);
	});
});
