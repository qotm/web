import { E2E, expect, loginDevice, signIn, signUp, sql, test } from './fixtures';

/** Settings (QOT-82): profile, switches, terminals and deleting the account. */
test.describe('settings', () => {
	test('asks for sign-in', async ({ page }) => {
		await page.goto('/settings');
		await expect(page).toHaveURL(/\/login/);
	});

	test('shows the profile, the switches and the terminals', async ({ page }) => {
		await signIn(page, 'member');
		await page.goto('/settings');
		await expect(page).toHaveTitle(/^Settings/);
		await expect(page.getByRole('heading', { level: 1, name: 'Settings.' })).toBeVisible();
		const email = page.getByRole('textbox', { name: 'Email' });
		await expect(email).toHaveValue('test.user@example.com');
		await expect(email).toHaveAttribute('readonly', '');
		await expect(page.getByRole('switch', { name: 'Show my favorites on my profile' })).toBeVisible();
		await expect(page.getByText('qotm logout')).toBeVisible();
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
	});

	test('saves the profile and the switches', async ({ page }) => {
		await signIn(page, 'member');
		await page.goto('/settings');
		const bio = `Collects quotes about naming things ${Date.now() % 1000}.`;
		await page.getByLabel('Bio').fill(bio);
		const favorites = page.getByRole('switch', { name: 'Show my favorites on my profile' });
		const before = await favorites.isChecked();
		await favorites.click();
		await page.getByRole('button', { name: 'Save changes' }).click();
		await expect(page.getByText('Saved.')).toBeVisible();
		await page.reload();
		await expect(page.getByLabel('Bio')).toHaveValue(bio);
		await expect(favorites).toBeChecked({ checked: !before });
		// Put it back for the other specs.
		await favorites.click();
		await page.getByRole('button', { name: 'Save changes' }).click();
		await expect(page.getByText('Saved.').first()).toBeVisible();
	});

	test('rejects a bad or taken username, and Cancel resets', async ({ page }) => {
		await signIn(page, 'member');
		await page.goto('/settings');
		const handle = page.getByLabel('Username');
		const original = await handle.inputValue();
		await handle.fill('@x');
		await page.getByRole('button', { name: 'Save changes' }).click();
		await expect(page.getByText('3–30 lowercase letters, digits or _')).toBeVisible();
		const admin = sql(`SELECT handle FROM "user" WHERE email = 'test.admin@example.com'`);
		await handle.fill(`@${admin}`);
		await page.getByRole('button', { name: 'Save changes' }).click();
		await expect(page.getByText('That username is taken.')).toBeVisible();
		await page.getByRole('button', { name: 'Cancel' }).click();
		await expect(handle).toHaveValue(original);
	});

	test('changes the username and keeps the old link working', async ({ page }) => {
		await signIn(page, 'member');
		await page.goto('/settings');
		const handle = page.getByLabel('Username');
		const original = (await handle.inputValue()).replace(/^@/, '');
		const next = `${original.slice(0, 20)}_e2e`;
		await handle.fill(`@${next}`);
		await page.getByRole('button', { name: 'Save changes' }).click();
		await expect(page.getByText('Saved. Your old links still work.')).toBeVisible();
		await page.goto(`/@${original}`);
		await expect(page).toHaveURL(new RegExp(`/@${next}$`));
		await page.goto('/settings');
		await page.getByLabel('Username').fill(`@${original}`);
		await page.getByRole('button', { name: 'Save changes' }).click();
		await expect(page.getByText('Saved. Your old links still work.')).toBeVisible();
	});

	test('revokes a terminal, and the table updates', async ({ page }) => {
		const label = `e2e-laptop-${Date.now() % 100000}`;
		await loginDevice('member', label);
		await signIn(page, 'member');
		await page.goto('/settings');
		const table = page.getByRole('table', { name: 'Terminals' });
		await expect(table.getByRole('cell', { name: label, exact: true })).toBeVisible();
		await expect(table.getByRole('cell', { name: 'v2026.08.3' }).first()).toBeVisible();
		await page.getByRole('button', { name: `Revoke ${label}` }).click();
		await expect(page.getByText(`${label} revoked.`)).toBeVisible();
		await expect(table.getByRole('cell', { name: label, exact: true })).toHaveCount(0);
	});

	test('deletes the account after confirming, and signs out', async ({ page }) => {
		const email = `e2e.leaver.${Date.now()}@example.com`;
		await signUp(page, email);
		await page.goto('/settings');
		const handle = (await page.getByLabel('Username').inputValue()).replace(/^@/, '');
		await page.getByRole('region', { name: 'Delete account' }).getByRole('button', { name: 'Delete account' }).click();
		const dialog = page.getByRole('alertdialog', { name: 'Delete your account?' });
		const confirm = dialog.getByRole('button', { name: 'Delete account' });
		await expect(confirm).toBeDisabled();
		await dialog.getByLabel(`Type @${handle} to confirm`).fill('@someone-else');
		await expect(confirm).toBeDisabled();
		await dialog.getByLabel(`Type @${handle} to confirm`).fill(`@${handle}`);
		await confirm.click();
		await expect(page).toHaveURL(`${E2E.web}/`);
		await expect(page.getByText('Your account was deleted.')).toBeVisible();
		await expect(page.getByRole('link', { name: 'Sign in' }).first()).toBeVisible();
		expect(sql(`SELECT count(*) FROM "user" WHERE email = '${email}'`)).toBe('0');
	});

	test('stacks at 760', async ({ page }) => {
		await page.setViewportSize({ width: 760, height: 1000 });
		await signIn(page, 'member');
		await page.goto('/settings');
		await expect(page.getByRole('heading', { level: 1, name: 'Settings.' })).toBeVisible();
		const scroll = await page.evaluate(() => document.documentElement.scrollWidth);
		expect(scroll).toBeLessThanOrEqual(760);
	});
});
