import { E2E, expect, signIn, test } from './fixtures';

test.describe('foundation', () => {
	test('the app loads and asks the API for the session', async ({ page }) => {
		const session = page.waitForResponse((res) => res.url().startsWith(`${E2E.api}/auth/get-session`));
		await page.goto('/');
		expect((await session).status()).toBe(200);
		await expect(page).toHaveTitle(/qotm/);
	});

	test('a signed-in browser carries the session to the API', async ({ page }) => {
		await signIn(page, 'member');
		const res = await page.request.get(`${E2E.api}/v1/me`);
		expect(res.status()).toBe(200);
		expect((await res.json()).handle).toBe('test_user');
	});

	test('the generated types match a live response', async ({ request }) => {
		const res = await request.get(`${E2E.api}/v1/topics`);
		expect(res.status()).toBe(200);
		expect((await res.json()).list.length).toBe(15);
	});
});

test.describe('icons', () => {
	test('every icon and the manifest the page links to loads', async ({ page }) => {
		await page.goto('/');
		const hrefs = await page
			.locator('link[rel~="icon"], link[rel="apple-touch-icon"], link[rel="manifest"]')
			.evaluateAll((els) => els.map((el) => (el as HTMLLinkElement).href));
		expect(hrefs.length).toBeGreaterThanOrEqual(6);
		for (const href of hrefs) {
			const res = await page.request.get(href);
			expect(res.status(), href).toBe(200);
			expect(res.headers()['content-type'], href).not.toContain('text/html');
		}
		const manifest = await (await page.request.get('/site.webmanifest')).json();
		for (const icon of manifest.icons) expect((await page.request.get(icon.src)).status()).toBe(200);
	});
});
