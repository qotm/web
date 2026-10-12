import { execSync } from 'node:child_process';
import { test as base, expect, type Page } from '@playwright/test';
import { E2E } from '../playwright.config';

/** Accounts seeded by the backend's `test:db:seed:e2e`. */
export const USERS = {
	member: { email: 'test.user@example.com', password: 'secret' },
	admin: { email: 'test.admin@example.com', password: 'secret' },
	verifier: { email: 'test.verifier@example.com', password: 'secret' },
	moderator: { email: 'test.moderator@example.com', password: 'secret' }
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

/**
 * The token of the newest magic link for `email`, read from the test
 * database (better-auth stores it plain, as `magic-link:<token>`). The email
 * itself goes through the API's mail queue, which tests cannot read.
 */
export function magicLinkToken(email: string): string {
	const sql = `SELECT identifier FROM verification WHERE identifier LIKE 'magic-link:%' AND value LIKE '%"${email}"%' ORDER BY created_at DESC LIMIT 1`;
	const out = execSync(`docker exec qotm-test-database psql -U root -d main -Atc "${sql.replace(/"/g, '\\"')}"`)
		.toString()
		.trim();
	if (!out) throw new Error(`No magic link for ${email}`);
	return out.replace(/^magic-link:/, '');
}

/** Opens the link the email would carry: the API signs in and redirects to `callbackURL`. */
export async function followMagicLink(page: Page, email: string, callbackURL: string) {
	const token = magicLinkToken(email);
	await page.goto(`${E2E.api}/auth/magic-link/verify?token=${token}&callbackURL=${encodeURIComponent(callbackURL)}`);
}

export const test = base;
export { expect, E2E };
