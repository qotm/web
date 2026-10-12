import { E2E, expect, signIn, test } from './fixtures';

const sidebar = (page: import('@playwright/test').Page) => page.getByRole('navigation', { name: 'Console' });

/** QOT-70: the console's header and sidebar, and who may enter. */
test.describe('admin shell', () => {
	test('members get Forbidden, signed-out visitors the sign-in screen', async ({ page }) => {
		await page.goto('/admin');
		await expect(page).toHaveURL(/\/login\?redirect=%2Fadmin/);
		await signIn(page, 'member');
		await page.goto('/admin/verification');
		await expect(page.getByText('Not authorized')).toBeVisible();
		await expect(sidebar(page)).toHaveCount(0);
	});

	test('admins see every section, with the API’s queue sizes', async ({ page }) => {
		await signIn(page, 'admin');
		const counts = await (await page.request.get(`${E2E.api}/v1/admin/stats/counts`)).json();
		await page.goto('/admin');
		const nav = sidebar(page);
		await expect(nav.getByRole('link')).toHaveCount(12);
		for (const title of ['Content', 'Taxonomy', 'People', 'System']) await expect(nav.getByText(title)).toBeVisible();
		await expect(nav.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page');
		for (const [label, key] of [
			['Submissions', 'submissions'],
			['Verification queue', 'verification'],
			['Curation queue', 'curation'],
			['Reports', 'reports']
		] as const) {
			await expect(nav.getByRole('link', { name: label })).toContainText(String(counts[key]));
		}
		// Attention: the queues a person must answer, while anything waits.
		const verification = nav.getByRole('link', { name: /Verification queue/ }).locator('[data-attention]');
		await expect(verification).toHaveCount(counts.verification > 0 ? 1 : 0);
		await expect(nav.getByRole('link', { name: /Curation queue/ }).locator('[data-attention]')).toHaveCount(0);
	});

	test('the header: view site, the role badge and the avatar', async ({ page }) => {
		await signIn(page, 'admin');
		await page.goto('/admin');
		const header = page.getByRole('banner');
		await expect(header.locator('[data-status="ADMIN"]')).toHaveText('admin');
		await expect(header.getByRole('link', { name: 'Your profile' })).toHaveAttribute('href', '/@test_admin');
		await header.getByRole('link', { name: 'view site' }).click();
		await expect(page).toHaveURL(`${E2E.web}/`);
	});

	test('moves between pages, marking the current one', async ({ page }) => {
		await signIn(page, 'admin');
		await page.goto('/admin');
		await sidebar(page).getByRole('link', { name: 'Audit logs' }).click();
		await expect(page).toHaveURL(/\/admin\/audit$/);
		await expect(sidebar(page).getByRole('link', { name: 'Audit logs' })).toHaveAttribute('aria-current', 'page');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Audit logs.');
	});

	test('a verifier sees only the verification queue, and lands on it', async ({ page }) => {
		await signIn(page, 'verifier');
		await page.goto('/admin');
		await expect(page).toHaveURL(/\/admin\/verification$/);
		await expect(sidebar(page).getByRole('link')).toHaveCount(1);
		await expect(page.getByRole('banner').locator('[data-status="VERIFIER"]')).toBeVisible();
		await page.goto('/admin/users');
		await expect(page.getByText('Not authorized')).toBeVisible();
	});

	test('a moderator sees submissions and reports', async ({ page }) => {
		await signIn(page, 'moderator');
		await page.goto('/admin');
		await expect(page).toHaveURL(/\/admin\/submissions$/);
		await expect(sidebar(page).getByRole('link')).toHaveText([/Submissions/, /Reports/]);
	});

	test('under 760 the sidebar sits above the page, without sideways scroll', async ({ page }) => {
		await signIn(page, 'admin');
		await page.setViewportSize({ width: 760, height: 900 });
		await page.goto('/admin');
		const nav = await sidebar(page).boundingBox();
		const main = await page.getByRole('main').boundingBox();
		expect(main!.y).toBeGreaterThan(nav!.y + nav!.height - 1);
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(760);
		// The sidebar is the navigation here: no folded header menu.
		await expect(page.getByRole('button', { name: 'Menu' })).toHaveCount(0);
	});
});
