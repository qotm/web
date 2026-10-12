import type { Page } from '@playwright/test';
import { E2E, expect, followMagicLink, signIn, test } from './fixtures';

const robots = (page: Page) => page.locator('meta[name="robots"]');

const COMMUNITY = [
	['/', 'A thought between commands.'],
	['/discover', 'Discover.'],
	['/latest', 'Latest.'],
	['/curated', 'Curated.'],
	['/q/8f2k1c', 'Quote by Edsger W. Dijkstra'],
	['/authors/dijkstra', 'Edsger W. Dijkstra'],
	['/topics', 'Topics.'],
	['/topics/debugging', 'Debugging.'],
	['/search?q=complexity', 'Search.'],
	['/@ada', 'Ada Mensah'],
	['/@ada/contributions', 'Ada Mensah']
] as const;

const ACCOUNT = ['/favorites', '/my-quotes', '/settings', '/submit'] as const;

test.describe('public-first routing', () => {
	for (const [path, heading] of COMMUNITY) {
		test(`a signed-out visitor reaches ${path}, indexable`, async ({ page }) => {
			await page.goto(path);
			await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
			expect(new URL(page.url()).pathname).not.toBe('/login');
			await expect(robots(page)).toHaveCount(0);
		});
	}

	for (const path of ACCOUNT) {
		test(`${path} sends a visitor to /login and back`, async ({ page }) => {
			await page.goto(path);
			await expect(page).toHaveURL(`/login?redirect=${encodeURIComponent(path)}`);
			await expect(robots(page)).toHaveAttribute('content', /noindex/);

			await page.getByLabel('Email').fill('test.user@example.com');
			await page.getByRole('button', { name: 'Email me a sign-in link' }).click();
			await expect(page.getByText('Check your email.')).toBeVisible();
			await followMagicLink(page, 'test.user@example.com', `${E2E.web}${path}`);
			await expect(page).toHaveURL(path);
			await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
			await expect(robots(page)).toHaveAttribute('content', /noindex/);
		});
	}

	test('the console is for staff: login when signed out, 403 for a member', async ({ page }) => {
		await page.goto('/admin');
		await expect(page).toHaveURL('/login?redirect=%2Fadmin');

		await signIn(page, 'member');
		await page.goto('/admin');
		await expect(page.getByText(/not authorized/i).first()).toBeVisible();
		await expect(robots(page)).toHaveAttribute('content', /noindex/);
	});

	test('an admin reaches the console, unindexed', async ({ page }) => {
		await signIn(page, 'admin');
		await page.goto('/admin');
		await expect(page).toHaveURL('/admin');
		await expect(robots(page)).toHaveAttribute('content', /noindex/);
	});

	for (const path of ['/nothing-here', '/authors', '/@']) {
		test(`${path} is a 404, unindexed`, async ({ page }) => {
			await page.goto(path);
			await expect(page.getByText(/not found/i).first()).toBeVisible();
			await expect(robots(page)).toHaveAttribute('content', /noindex/);
		});
	}
});

test('robots.txt keeps crawlers out of the account pages and the console', async ({ request }) => {
	const text = await (await request.get('/robots.txt')).text();
	for (const path of ['/admin', '/favorites', '/my-quotes', '/settings', '/submit', '/login', '/device']) {
		expect(text).toContain(`Disallow: ${path}\n`);
	}
	expect(text).not.toMatch(/Disallow: \/\n/);
});
