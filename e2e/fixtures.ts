import { execSync } from 'node:child_process';
import { test as base, expect, request, type Page } from '@playwright/test';
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

/** An API client signed in as `who` (its own cookies), for setting up state another role creates. */
export async function apiAs(who: keyof typeof USERS) {
	const ctx = await request.newContext({ baseURL: E2E.api, extraHTTPHeaders: { Origin: E2E.web } });
	const res = await ctx.post('/auth/sign-in/email', { data: USERS[who] });
	expect(res.ok(), await res.text()).toBe(true);
	return ctx;
}

/** Runs SQL against the test database (the API's test stack). */
export function sql(statement: string): string {
	return execSync(`docker exec qotm-test-database psql -U root -d main -Atc "${statement.replace(/"/g, '\\"')}"`)
		.toString()
		.trim();
}

/** What `qotm login` does first: asks the API for a device code (as the CLI: no cookies, no Origin). */
export async function requestDeviceCode(): Promise<{ user_code: string; device_code: string }> {
	const cli = await request.newContext();
	const res = await cli.post(`${E2E.api}/auth/device/code`, { data: { client_id: 'qotm-cli' } });
	expect(res.ok(), await res.text()).toBe(true);
	const body = await res.json();
	await cli.dispose();
	return body;
}

/** Opens the link the email would carry: the API signs in and redirects to `callbackURL`. */
export async function followMagicLink(page: Page, email: string, callbackURL: string) {
	const token = magicLinkToken(email);
	await page.goto(`${E2E.api}/auth/magic-link/verify?token=${token}&callbackURL=${encodeURIComponent(callbackURL)}`);
}

export const test = base;
export { expect, E2E };

/** A full `qotm login` for `who`: device code, approval, token, then the terminal registers as `label`. */
export async function loginDevice(who: keyof typeof USERS, label: string) {
	const code = await requestDeviceCode();
	const user = await apiAs(who);
	await user.get(`/auth/device?user_code=${code.user_code}`);
	expect((await user.post('/auth/device/approve', { data: { userCode: code.user_code } })).ok()).toBe(true);
	await user.dispose();
	sql(`UPDATE device_code SET last_polled_at = now() - interval '1 minute' WHERE device_code = '${code.device_code}'`);
	const cli = await request.newContext({ baseURL: E2E.api });
	const token = await cli.post('/auth/device/token', {
		data: {
			grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
			device_code: code.device_code,
			client_id: 'qotm-cli'
		}
	});
	expect(token.ok(), await token.text()).toBe(true);
	const { access_token } = await token.json();
	const reg = await cli.post('/v1/me/devices', {
		headers: { Authorization: `Bearer ${access_token}`, 'X-Qotm-Dataset': 'v2026.08.3' },
		data: { label }
	});
	expect(reg.ok(), await reg.text()).toBe(true);
	await cli.dispose();
}

/** Signs `page` in as a brand-new member through a magic link (the account is created on first sign-in). */
export async function signUp(page: Page, email: string) {
	const res = await page.request.post(`${E2E.api}/auth/sign-in/magic-link`, {
		data: { email, callbackURL: E2E.web },
		headers: { Origin: E2E.web }
	});
	expect(res.ok(), await res.text()).toBe(true);
	const verify = await page.request.get(`${E2E.api}/auth/magic-link/verify?token=${magicLinkToken(email)}`, {
		maxRedirects: 0
	});
	expect(verify.status()).toBeLessThan(400);
}
