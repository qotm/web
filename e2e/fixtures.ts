import { test as base, expect, type Page } from '@playwright/test';
import { E2E } from '../playwright.config';

/** Accounts seeded by the backend's `test:db:seed:e2e`. */
export const USERS = {
	member: { email: 'test.user@example.com', password: 'secret' },
	admin: { email: 'test.admin@example.com', password: 'secret' }
} as const;

/**
 * Signs `page`'s context in with a password (on in the test environment
 * only). The API sets its session cookie for `localhost`, which the web app
 * on another port sends with its credentialed requests.
 */
export async function signIn(page: Page, who: keyof typeof USERS) {
	const res = await page.request.post(`${E2E.api}/auth/sign-in/email`, {
		data: USERS[who],
		headers: { Origin: E2E.web }
	});
	expect(res.ok(), await res.text()).toBe(true);
}

export const test = base;
export { expect, E2E };
