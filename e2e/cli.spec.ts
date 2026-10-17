import { expect, test } from './fixtures';

/** /cli: the CLI's documentation (canvas "CLI docs"). */
test.describe('cli docs', () => {
	test('the page, its place in the nav and the footer, and its sections', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'cli' }).click();
		await expect(page).toHaveURL(/\/cli$/);
		await expect(page).toHaveTitle('The CLI · qotm');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('qotm in your terminal.');
		await expect(page.getByText('Software gets slower faster than hardware gets faster.')).toBeVisible();
		await expect(page.getByRole('link', { name: /on GitHub/ })).toHaveAttribute('href', 'https://github.com/qotm/cli');
		const index = page.getByRole('navigation', { name: 'On this page' }).first();
		await expect(index.getByRole('link')).toHaveCount(9);
		await expect(page.getByRole('heading', { level: 2 })).toHaveCount(9);
		await expect(page.getByRole('contentinfo').getByRole('link', { name: 'npm i -g qotm' })).toHaveAttribute(
			'href',
			'/cli'
		);
	});

	test('a line for each shell, copied as shown', async ({ page, context }) => {
		await context.grantPermissions(['clipboard-read', 'clipboard-write']);
		await page.goto('/cli');
		const shells = page.getByRole('tablist', { name: 'Shell' });
		await expect(page.getByText('# the end of ~/.zshrc')).toBeVisible();
		await shells.getByRole('tab', { name: 'fish' }).click();
		await expect(shells.getByRole('tab', { name: 'fish' })).toHaveAttribute('aria-selected', 'true');
		await expect(page.getByText('# the end of ~/.config/fish/config.fish')).toBeVisible();
		await page.getByRole('button', { name: 'Copy the fish line' }).click();
		await expect(page.getByRole('button', { name: 'Copy the fish line' })).toHaveText('copied');
		expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
			'status is-interactive; and type -q qotm; and qotm'
		);
		await page.getByRole('button', { name: 'Copy npm i -g qotm and qotm' }).click();
		expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('npm i -g qotm\nqotm');
	});

	test('the index marks the section being read', async ({ page }) => {
		await page.goto('/cli');
		const index = page.getByRole('navigation', { name: 'On this page' }).first();
		await expect(index.getByRole('link', { name: /Install/ })).toHaveAttribute('aria-current', 'location');
		await index.getByRole('link', { name: /Your account/ }).click();
		await expect(page).toHaveURL(/#account$/);
		await expect(index.getByRole('link', { name: /Your account/ })).toHaveAttribute('aria-current', 'location');
	});

	test('on a phone the index is a menu at the top of the window', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/cli');
		const desktop = page.getByRole('navigation', { name: 'On this page' }).first();
		await expect(desktop).toBeHidden();
		const menu = page.getByRole('navigation', { name: 'On this page' }).last();
		await menu.getByRole('button', { name: /On this page/ }).click();
		await menu.getByRole('link', { name: /Submitting/ }).click();
		await expect(page).toHaveURL(/#submitting$/);
		await expect(menu.getByRole('button', { name: /Submitting/ })).toBeVisible();
		await expect(menu.getByRole('link')).toHaveCount(0);
	});
});
