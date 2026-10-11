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
