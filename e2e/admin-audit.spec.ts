import { E2E, apiAs, expect, signIn, test } from './fixtures';

const rows = (page: import('@playwright/test').Page) =>
	page.getByRole('table', { name: 'Audit log' }).locator('tbody tr');

/** QOT-92: the audit log. */
test.describe('admin audit log', () => {
	test('lists entries newest first, and searches and filters by action', async ({ page }) => {
		await signIn(page, 'admin');
		const log = await (await page.request.get(`${E2E.api}/v1/admin/audit?limit=15`)).json();
		const actions = await (await page.request.get(`${E2E.api}/v1/admin/audit/actions`)).json();
		await page.goto('/admin/audit');
		await expect(page).toHaveTitle(/^Audit log/);
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
		await expect(rows(page)).toHaveCount(log.list.length);
		await expect(rows(page).first()).toContainText(log.list[0].label);
		await expect(page.getByLabel('Action', { exact: true }).locator('option')).toHaveCount(actions.list.length + 1);

		const role = actions.list.find((a: { action: string }) => a.action === 'user.role_changed');
		await page.getByLabel('Action', { exact: true }).selectOption('user.role_changed');
		const changed = await (await page.request.get(`${E2E.api}/v1/admin/audit?action=user.role_changed`)).json();
		if (changed.list.length) {
			await expect(rows(page)).toHaveCount(changed.list.length);
			for (const r of await rows(page).all()) await expect(r).toContainText(role.label);
		} else await expect(page.getByText('Nothing matches.')).toBeVisible();
		await page.getByLabel('Action', { exact: true }).selectOption('');

		await page.getByLabel('Search actor, action or target').fill('no entry says this zzz');
		await expect(page.getByText('Nothing matches.')).toBeVisible();
	});

	test('a decision made elsewhere shows up, with its note', async ({ page }) => {
		const note = `Checked the 1974 paper ${Date.now()}.`;
		const admin = await apiAs('admin');
		expect(
			(await admin.patch('/v1/admin/quotes/q_5k0q2j', { data: { context: 'From the go-to paper.', note } })).ok()
		).toBe(true);
		await admin.dispose();
		await signIn(page, 'admin');
		await page.goto('/admin/audit');
		await page.getByLabel('Search actor, action or target').fill(note);
		await expect(rows(page)).toHaveCount(1);
		await expect(rows(page).first()).toContainText('q_5k0q2j');
		await expect(rows(page).first()).toContainText('@');
		await expect(rows(page).first().getByRole('link', { name: 'q_5k0q2j' })).toHaveAttribute('href', '/q/5k0q2j');
	});

	test('only admins may open it', async ({ page }) => {
		await signIn(page, 'verifier');
		await page.goto('/admin/audit');
		await expect(page.getByText('Not authorized')).toBeVisible();
	});

	test('stacks at 760', async ({ page }) => {
		await page.setViewportSize({ width: 760, height: 1000 });
		await signIn(page, 'admin');
		await page.goto('/admin/audit');
		await expect(rows(page).first()).toBeVisible();
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(760);
	});
});
