import { E2E, apiAs, expect, signIn, sql, test } from './fixtures';

/** A fresh published original from the member, reported by the moderator; returns the report's id. */
async function reported(text: string, reason = 'content', details = 'Reads like an ad.') {
	const member = await apiAs('member');
	const admin = await apiAs('admin');
	const moderator = await apiAs('moderator');
	const sub = await member.post('/v1/submissions', {
		data: { type: 'original', text, topics: ['software-engineering'], rights: true }
	});
	expect(sub.ok(), await sub.text()).toBe(true);
	const { id } = await sub.json();
	expect((await admin.post(`/v1/admin/submissions/${id}/decision`, { data: { decision: 'publish' } })).ok()).toBe(true);
	const res = await moderator.post(`/v1/quotes/${id}/reports`, { data: { reason, details } });
	expect(res.ok(), await res.text()).toBe(true);
	const report = await res.json();
	for (const c of [member, admin, moderator]) await c.dispose();
	return { quote: id as string, report: report.id as string };
}

/** QOT-88: reports. */
test.describe('admin reports', () => {
	test('lists open reports, and shows the selected one with its quote', async ({ page }) => {
		await signIn(page, 'moderator');
		const open = await (await page.request.get(`${E2E.api}/v1/admin/reports?status=open&limit=20`)).json();
		await page.goto('/admin/reports');
		await expect(page).toHaveTitle(/^Reports/);
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
		const table = page.getByRole('table', { name: 'Reports' });
		await expect(table.getByRole('row', { name: /^Review / })).toHaveCount(open.list.length);

		const first = open.list[0];
		await table.getByRole('row', { name: new RegExp(`^Review ${first.id}`) }).click();
		const card = page.getByLabel(`Report ${first.id}`);
		await expect(card).toContainText(`Report ${first.id} · ${first.reason}`);
		await expect(card).toContainText(first.quote.text);
		const decision = page.getByRole('region', { name: 'Moderation decision' });
		await expect(decision.getByRole('button', { name: 'Dismiss report' })).toBeVisible();
	});

	test('warns when the quote already shipped in a release', async ({ page }) => {
		// q_6f1k9s (Kernighan & Plauger) is in v2026.08.3.
		const moderator = await apiAs('moderator');
		const res = await moderator.post('/v1/quotes/q_6f1k9s/reports', {
			data: { reason: 'attribution', details: 'Plauger co-wrote it; check the credit.' }
		});
		expect(res.ok(), await res.text()).toBe(true);
		const { id } = await res.json();
		await moderator.dispose();
		await signIn(page, 'moderator');
		await page.goto(`/admin/reports?id=${id}`);
		await expect(page.getByLabel(`Report ${id}`)).toContainText('Plauger co-wrote it');
		await expect(page.getByText(/^This quote is in v\d{4}\.\d{2}\.\d+\.$/)).toBeVisible();
		await expect(page.getByText('Withdrawing it removes it from the next release.')).toBeVisible();
	});

	test('dismissing keeps the quote up and resolves the report', async ({ page }) => {
		const { quote, report } = await reported(`Logs are letters to your future self ${Date.now()}.`);
		await signIn(page, 'moderator');
		await page.goto(`/admin/reports?id=${report}`);
		await page
			.getByRole('region', { name: 'Moderation decision' })
			.getByRole('button', { name: 'Dismiss report' })
			.click();
		await expect(page.getByText(`${report} dismissed.`)).toBeVisible();
		await expect(page.getByRole('row', { name: new RegExp(`^Review ${report}`) })).toHaveCount(0);
		expect(sql(`SELECT status FROM quotes WHERE public_id = '${quote}'`)).toBe('PUBLISHED');
	});

	test('marking disputed needs a note and keeps the report open', async ({ page }) => {
		const { quote, report } = await reported(
			`Every TODO is a tiny apology ${Date.now()}.`,
			'originality',
			'Seen this elsewhere.'
		);
		await signIn(page, 'moderator');
		await page.goto(`/admin/reports?id=${report}`);
		const decision = page.getByRole('region', { name: 'Moderation decision' });
		await expect(decision.getByRole('button', { name: 'Mark disputed' })).toBeDisabled();
		await decision.getByLabel('Note').fill('Looking for an earlier source.');
		await decision.getByRole('button', { name: 'Mark disputed' }).click();
		await expect(page.getByText(`${quote} marked disputed`)).toBeVisible();
		expect(sql(`SELECT status FROM quotes WHERE public_id = '${quote}'`)).toBe('DISPUTED');
		await expect(page.getByRole('row', { name: new RegExp(`^Review ${report}`) })).toBeVisible();
	});

	test('withdrawing needs a note, and withdraws the quote', async ({ page }) => {
		const { quote, report } = await reported(`Deploy on Fridays, they said ${Date.now()}.`);
		await signIn(page, 'admin');
		await page.goto(`/admin/reports?id=${report}`);
		const decision = page.getByRole('region', { name: 'Moderation decision' });
		await decision.getByLabel('Note').fill('Promotional content.');
		await decision.getByRole('button', { name: 'Withdraw' }).click();
		await expect(page.getByText(`${quote} withdrawn.`)).toBeVisible();
		expect(sql(`SELECT status FROM quotes WHERE public_id = '${quote}'`)).toBe('WITHDRAWN');
	});

	test('a verifier may not open it', async ({ page }) => {
		await signIn(page, 'verifier');
		await page.goto('/admin/reports');
		await expect(page.getByText('Not authorized')).toBeVisible();
	});

	test('stacks at 760', async ({ page }) => {
		await page.setViewportSize({ width: 760, height: 1000 });
		await signIn(page, 'moderator');
		await page.goto('/admin/reports');
		await expect(page.getByRole('region', { name: 'Moderation decision' })).toBeVisible();
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(760);
	});
});
