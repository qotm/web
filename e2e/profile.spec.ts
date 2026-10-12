import { E2E, expect, sql, test } from './fixtures';

const api = async (page: import('@playwright/test').Page, path: string) =>
	(await page.request.get(`${E2E.api}${path}`)).json();

/** QOT-79: the profile pages. */
test.describe('profile', () => {
	test('header with role, join date, bio and counts; their quotes', async ({ page }) => {
		const p = await api(page, '/v1/users/ada');
		await page.goto('/@ada');
		await expect(page).toHaveTitle(new RegExp(`@ada`));
		await expect(page.getByRole('heading', { level: 1 })).toHaveText(p.name);
		if (p.role !== 'member')
			await expect(page.locator('header').locator(`[data-status="${p.role.toUpperCase()}"]`)).toBeVisible();
		await expect(page.getByText(/· joined \w{3} \d{4}/)).toBeVisible();
		if (p.bio) await expect(page.getByText(p.bio)).toBeVisible();
		const tabs = page.getByRole('tablist', { name: 'Profile' });
		await expect(tabs.getByRole('tab', { name: `quotes ${p.stats.quotes}` })).toHaveAttribute('aria-selected', 'true');
		await expect(page.getByRole('article')).toHaveCount(Math.min(10, p.stats.quotes));
		for (const card of await page.getByRole('article').all())
			await expect(card.locator('[data-status="ORIGINAL"]')).toBeVisible();
	});

	test('contributions: four stats and the rows with their states, paged', async ({ page }) => {
		const stats = await api(page, '/v1/users/ada/stats');
		const list = await api(page, '/v1/users/ada/contributions?limit=10');
		await page.goto('/@ada');
		await page.getByRole('tab', { name: /^contributions/ }).click();
		await expect(page).toHaveURL(/\/@ada\/contributions$/);
		for (const [label, value] of [
			['submitted', stats.submitted],
			['verified', stats.verified],
			['curated', stats.curated],
			['corrections accepted', stats.correctionsAccepted]
		])
			await expect(page.locator('main .grid-cols-4').getByText(label, { exact: true }).locator('..')).toContainText(
				String(value)
			);
		const rows = page.locator('a[href^="/q/"]');
		await expect(rows).toHaveCount(list.list.length);
		await expect(rows.first()).toContainText(list.list[0].text);
		await expect(rows.first().locator(`[data-status="${list.list[0].status}"]`)).toBeVisible();
		if (list.lastPage > 1) {
			await page.getByRole('button', { name: /next/ }).click();
			await expect(page).toHaveURL(/page=2/);
		}
	});

	test('favorites show only when the member made them public', async ({ page }) => {
		await page.goto('/@ada');
		await expect(page.getByRole('tab', { name: 'favorites' })).toBeVisible();
		await page.goto('/@test_user');
		await expect(page.getByRole('tab', { name: 'favorites' })).toHaveCount(0);
	});

	test('an old handle lands on the current one, tab kept; an unknown one is a 404', async ({ page }) => {
		sql(`delete from handle_history where old_handle = 'ada_was'`);
		sql(
			`insert into handle_history (id, user_id, old_handle, changed_at) select 'hh_e2e', id, 'ada_was', now() from "user" where handle = 'ada'`
		);
		try {
			await page.goto('/@ada_was/contributions');
			await expect(page).toHaveURL(`${E2E.web}/@ada/contributions`);
			await expect(page.getByRole('tab', { name: /^contributions/ })).toHaveAttribute('aria-selected', 'true');
		} finally {
			sql(`delete from handle_history where old_handle = 'ada_was'`);
		}
		await page.goto('/@nobody_here');
		await expect(page.getByText('No member called @nobody_here.')).toBeVisible();
		await page.goto('/ada');
		await expect(page.getByText(/not found/i).first()).toBeVisible();
	});

	test('stacks at 760 without sideways scroll', async ({ page }) => {
		await page.setViewportSize({ width: 760, height: 900 });
		await page.goto('/@ada/contributions');
		await expect(page.locator('a[href^="/q/"]').first()).toBeVisible();
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(760);
	});
});
