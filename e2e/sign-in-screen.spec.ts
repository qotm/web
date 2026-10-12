import { E2E, expect, followMagicLink, requestDeviceCode, signIn, sql, test } from './fixtures';

/** QOT-77: sign in (/login) and device approval (/device). */
test.describe('sign in', () => {
	test('the SignIn card: email link, GitHub and Google, the terminal route and the notice', async ({ page }) => {
		await page.goto('/login');
		await expect(page).toHaveTitle(/Sign in/);
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sign in to qotm.');
		await expect(page.getByRole('button', { name: 'Email me a sign-in link' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Continue with GitHub' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
		await expect(page.locator('code', { hasText: 'qotm login' })).toBeVisible();
		await expect(page.getByText(/qotm never asks for your password in the terminal/)).toBeVisible();
		expect(await page.locator('meta[name="robots"]').getAttribute('content')).toContain('noindex');
	});

	test('sends the link, says where, and the link signs in and returns', async ({ page }) => {
		await page.goto('/login?redirect=%2Ffavorites');
		await page.getByLabel('Email').fill('test.user@example.com');
		await page.getByRole('button', { name: 'Email me a sign-in link' }).click();
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Check your email.');
		await expect(page.getByText('test.user@example.com')).toBeVisible();
		await followMagicLink(page, 'test.user@example.com', `${E2E.web}/favorites`);
		await expect(page).toHaveURL(`${E2E.web}/favorites`);
	});

	test('validates the email before sending', async ({ page }) => {
		await page.goto('/login');
		await page.getByLabel('Email').fill('not an email');
		await page.getByRole('button', { name: 'Email me a sign-in link' }).click();
		await expect(page.getByText('Enter a valid email')).toBeVisible();
	});

	test('a used or expired link comes back with a way forward', async ({ page }) => {
		const back = `${E2E.web}/login?redirect=${encodeURIComponent(`${E2E.web}/favorites`)}`;
		await page.goto(
			`${E2E.api}/auth/magic-link/verify?token=nope&callbackURL=${encodeURIComponent(`${E2E.web}/favorites`)}&errorCallbackURL=${encodeURIComponent(back)}`
		);
		await expect(page).toHaveURL(/\/login\?.*error=INVALID_TOKEN/);
		await expect(page.getByText('That link did not work.')).toBeVisible();
		await expect(page.getByText(/expired or was already used/)).toBeVisible();
		await expect(page.getByRole('button', { name: 'Email me a sign-in link' })).toBeVisible();
	});

	test('a signed-in member is sent on to where they were going', async ({ page }) => {
		await signIn(page, 'member');
		await page.goto('/login?redirect=%2Fsettings');
		await expect(page).toHaveURL(`${E2E.web}/settings`);
	});

	test('stacks at 760 without sideways scroll', async ({ page }) => {
		await page.setViewportSize({ width: 760, height: 900 });
		await page.goto('/login');
		const card = await page.getByRole('heading', { level: 1 }).boundingBox();
		const aside = await page.locator('code', { hasText: 'qotm login' }).boundingBox();
		expect(aside!.y).toBeGreaterThan(card!.y);
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(760);
	});
});

test.describe('device approval', () => {
	test('needs a session: signing in returns to the code, showing it beside the form', async ({ page }) => {
		const { user_code } = await requestDeviceCode();
		await page.goto(`/device?user_code=${user_code}`);
		await expect(page).toHaveURL(/\/login\?redirect=/);
		await expect(page.getByTestId('device-code')).toHaveText(user_code);
		await expect(page.getByText('Started it from the terminal with')).toBeVisible();
		await page.getByLabel('Email').fill('test.user@example.com');
		await page.getByRole('button', { name: 'Email me a sign-in link' }).click();
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Check your email.');
		await followMagicLink(page, 'test.user@example.com', `${E2E.web}/device?user_code=${user_code}`);
		await expect(page.getByRole('button', { name: 'Approve this device' })).toBeVisible();
	});

	test('approve: the terminal is signed in as the member', async ({ page }) => {
		await signIn(page, 'member');
		const { user_code, device_code } = await requestDeviceCode();
		await page.goto(`/device?user_code=${user_code}`);
		await expect(page.getByText(/asking to sign in as @test_user/)).toBeVisible();
		await expect(page.getByTestId('device-code')).toHaveText(user_code);
		await page.getByRole('button', { name: 'Approve this device' }).click();
		await expect(page.getByText('Approved.')).toBeVisible();
		expect(sql(`select status from device_code where device_code = '${device_code}'`)).toBe('approved');
	});

	test('deny: the terminal is told no', async ({ page }) => {
		await signIn(page, 'member');
		const { user_code, device_code } = await requestDeviceCode();
		await page.goto(`/device?user_code=${user_code}`);
		await page.getByRole('button', { name: 'Deny' }).click();
		await expect(page.getByText('Denied.')).toBeVisible();
		expect(sql(`select status from device_code where device_code = '${device_code}'`)).toBe('denied');
	});

	test('an expired code says so, and offers another', async ({ page }) => {
		await signIn(page, 'member');
		const { user_code, device_code } = await requestDeviceCode();
		sql(`update device_code set expires_at = now() - interval '1 minute' where device_code = '${device_code}'`);
		await page.goto(`/device?user_code=${user_code}`);
		await expect(page.getByText('This code has expired.')).toBeVisible();
		await expect(page.getByLabel('Code from your terminal')).toBeVisible();
	});

	test('a code typed by hand, loosely, is found; an unknown one is not', async ({ page }) => {
		await signIn(page, 'member');
		await page.goto('/device');
		const field = page.getByLabel('Code from your terminal');
		await field.fill('QTM-2222');
		await page.getByRole('button', { name: 'Continue' }).click();
		await expect(page.getByText('That code did not work.')).toBeVisible();
		const { user_code } = await requestDeviceCode();
		await field.fill(user_code.toLowerCase().replace('-', ' '));
		await page.getByRole('button', { name: 'Continue' }).click();
		await expect(page).toHaveURL(new RegExp(`user_code=${user_code}`));
		await expect(page.getByRole('button', { name: 'Approve this device' })).toBeVisible();
	});

	test('GitHub comes back to the app, not the API, even from a bare /login', async ({ page }) => {
		for (const [path, back] of [
			['/login', `${E2E.web}/`],
			['/login?redirect=%2Fsettings', `${E2E.web}/settings`]
		]) {
			await page.goto(path);
			// Stop at the API: the test needs only what the app asks for.
			await page.route('**/auth/sign-in/social', (route) =>
				route.fulfill({ json: { url: `${E2E.web}/`, redirect: false } })
			);
			const asked = page.waitForRequest('**/auth/sign-in/social');
			await page.getByRole('button', { name: 'Continue with GitHub' }).click();
			expect((await asked).postDataJSON()).toMatchObject({ provider: 'github', callbackURL: back });
			await page.unroute('**/auth/sign-in/social');
		}
	});
});
