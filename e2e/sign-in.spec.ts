import { expect, test } from './fixtures';

test.describe('no passwords', () => {
	for (const path of ['/signup', '/forgot-password', '/reset-password', '/verify-email', '/verified']) {
		test(`${path} is gone`, async ({ page }) => {
			await page.goto(path);
			await expect(page.getByText(/not found/i).first()).toBeVisible();
		});
	}

	test('the sign-in screen asks for an email only', async ({ page }) => {
		await page.goto('/login');
		await expect(page.getByLabel('Email')).toBeVisible();
		await expect(page.locator('input[type="password"]')).toHaveCount(0);
		await expect(page.getByText(/password/i)).toHaveCount(0);
	});
});
