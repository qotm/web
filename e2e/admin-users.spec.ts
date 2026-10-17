import { E2E, expect, signIn, signUp, sql, test } from './fixtures';

/** QOT-90: admin users. */
test.describe('admin users', () => {
	test('lists users with their roles, and searches and filters', async ({ page }) => {
		await signIn(page, 'admin');
		const all = await (await page.request.get(`${E2E.api}/v1/admin/users?limit=15`)).json();
		await page.goto('/admin/users');
		await expect(page).toHaveTitle(/^Users/);
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
		const table = page.getByRole('table', { name: 'Users' });
		await expect(table.locator('tbody tr')).toHaveCount(all.list.length);
		await expect(table.getByRole('row', { name: 'Change @test_moderator’s role' })).toContainText('moderator');

		await page.getByLabel('Search handle or email').fill('test.verifier@');
		await expect(table.locator('tbody tr')).toHaveCount(1);
		await expect(table.locator('tbody tr')).toContainText('@test_verifier');
		await page.getByLabel('Search handle or email').fill('');

		await page.getByLabel('Role', { exact: true }).selectOption('moderator');
		const mods = await (await page.request.get(`${E2E.api}/v1/admin/users?role=moderator`)).json();
		await expect(table.locator('tbody tr')).toHaveCount(mods.list.length);
		for (const r of await table.locator('tbody tr').all()) await expect(r).toContainText('moderator');
	});

	test('changes a member’s role after confirming', async ({ page, browser }) => {
		const email = `e2e.promoted.${Date.now()}@example.com`;
		const newcomer = await browser.newPage();
		await signUp(newcomer, email);
		await newcomer.close();
		const handle = sql(`SELECT handle FROM "user" WHERE email = '${email}'`);

		await signIn(page, 'admin');
		await page.goto('/admin/users');
		await page.getByLabel('Search handle or email').fill(email);
		await page.getByRole('row', { name: `Change @${handle}’s role` }).click();
		const dialog = page.getByRole('dialog', { name: `Change @${handle}’s role` });
		await expect(dialog.getByRole('button', { name: 'Change role' })).toBeDisabled();
		await dialog.getByRole('radio', { name: /Verifier/ }).check();
		await dialog.getByRole('button', { name: 'Make verifier' }).click();
		await expect(page.getByText(`@${handle} is now a verifier.`)).toBeVisible();
		expect(sql(`SELECT role FROM "user" WHERE email = '${email}'`)).toBe('verifier');
		await expect(page.getByRole('row', { name: `Change @${handle}’s role` })).toContainText('verifier');
	});

	test('shows the API’s refusal', async ({ page }) => {
		await signIn(page, 'admin');
		await page.route(/\/v1\/admin\/users\/[^/]+\/role$/, (route) =>
			route.fulfill({ status: 409, json: { statusCode: 409, message: 'The last admin cannot be demoted' } })
		);
		await page.goto('/admin/users');
		await page.getByRole('row', { name: 'Change @test_moderator’s role' }).click();
		const dialog = page.getByRole('dialog');
		await dialog.getByRole('radio', { name: /Member/ }).check();
		await dialog.getByRole('button', { name: 'Make member' }).click();
		await expect(dialog.getByText('The last admin cannot be demoted')).toBeVisible();
	});

	test('only admins may open it', async ({ page }) => {
		await signIn(page, 'moderator');
		await page.goto('/admin/users');
		await expect(page.getByText('Not authorized')).toBeVisible();
	});

	test('stacks at 760', async ({ page }) => {
		await page.setViewportSize({ width: 760, height: 1000 });
		await signIn(page, 'admin');
		await page.goto('/admin/users');
		await expect(page.locator('tbody tr').first()).toBeVisible();
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(760);
	});
});
