import { E2E, expect, signIn, test } from './fixtures';

/** QOT-69: the site header and footer around every public and account page. */
test.describe('site shell', () => {
	test('signed out: the install command and Sign in, and the footer columns', async ({ page }) => {
		await page.goto('/');
		const header = page.getByRole('banner');
		await expect(header.getByRole('link', { name: 'qotm home' })).toHaveAttribute('href', '/');
		await expect(header.getByRole('button', { name: 'Copy npm i -g qotm' })).toBeVisible();
		await header.getByRole('link', { name: 'Sign in' }).click();
		await expect(page).toHaveURL(/\/login/);
		await page.goto('/');
		const footer = page.getByRole('contentinfo');
		for (const title of ['Read', 'Contribute', 'CLI'])
			await expect(footer.getByText(title, { exact: true })).toBeVisible();
		await expect(footer.getByRole('link', { name: 'github', exact: true })).toHaveAttribute(
			'href',
			'https://github.com/qotm'
		);
		await expect(footer).toContainText('MIT · github.com/qotm');
		await expect(footer.getByRole('link', { name: 'github.com/qotm' })).toHaveAttribute(
			'href',
			'https://github.com/qotm'
		);
		await expect(footer.getByRole('link', { name: 'privacy' })).toHaveAttribute('href', '/privacy');
	});

	test('marks the current section in the nav', async ({ page }) => {
		const nav = page.getByRole('navigation', { name: 'Primary' });
		for (const [path, label] of [
			['/discover', 'discover'],
			['/latest', 'latest'],
			['/curated', 'curated'],
			['/topics', 'topics'],
			['/topics/debugging', 'topics']
		]) {
			await page.goto(path);
			await expect(nav.getByRole('link', { name: label })).toHaveAttribute('aria-current', 'page');
			await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
		}
		await page.goto('/');
		await expect(nav.locator('[aria-current="page"]')).toHaveCount(0);
	});

	test('runs at 960, or 1180 on the feeds', async ({ page }) => {
		const width = () =>
			page.locator('main > div').evaluate((el) => (el as HTMLElement).getBoundingClientRect().width - 64);
		await page.goto('/');
		await expect.poll(width).toBe(960);
		await page.goto('/discover');
		await expect.poll(width).toBe(1180);
	});

	test('signed in: search, Submit and the account menu with counts', async ({ page }) => {
		await signIn(page, 'member');
		await page.goto('/');
		const header = page.getByRole('banner');
		await expect(header.getByRole('link', { name: 'Submit' })).toHaveAttribute('href', '/submit');
		const search = header.getByRole('searchbox');
		await search.fill('simplicity');
		await search.press('Enter');
		await expect(page).toHaveURL(/\/search\?q=simplicity/);
		await header.getByRole('button', { name: 'Account' }).click();
		const menu = page.getByRole('menu');
		await expect(menu.getByText(/^@\w+ · member$/)).toBeVisible();
		await expect(menu.getByRole('menuitem', { name: /My quotes\s*\d+/ })).toBeVisible();
		await expect(menu.getByRole('menuitem', { name: /Favorites\s*\d+/ })).toBeVisible();
		await expect(menu.getByRole('menuitem', { name: 'Admin' })).toHaveCount(0);
		await menu.getByRole('menuitem', { name: 'Sign out' }).click();
		await expect(header.getByRole('link', { name: 'Sign in' })).toBeVisible();
	});

	test('staff see Admin in the account menu', async ({ page }) => {
		await signIn(page, 'admin');
		await page.goto('/');
		await page.getByRole('button', { name: 'Account' }).click();
		await expect(page.getByRole('menu').getByText(/· admin$/)).toBeVisible();
		await page.getByRole('menuitem', { name: 'Admin' }).click();
		await expect(page).toHaveURL(/\/admin/);
	});

	test('at 760px the nav folds into a menu', async ({ page }) => {
		await page.setViewportSize({ width: 760, height: 900 });
		await page.goto('/latest');
		await expect(page.getByRole('navigation', { name: 'Primary' })).toBeHidden();
		await expect(page.getByRole('button', { name: 'Copy npm i -g qotm' })).toBeHidden();
		await page.getByRole('button', { name: 'Menu' }).click();
		await page.getByRole('menuitem', { name: 'curated' }).click();
		await expect(page).toHaveURL(`${E2E.web}/curated`);
		// No sideways scroll at the breakpoint.
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(760);
		await page.setViewportSize({ width: 761, height: 900 });
		await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Menu' })).toBeHidden();
	});
});
