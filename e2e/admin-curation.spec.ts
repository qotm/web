import { E2E, apiAs, expect, signIn, sql, test } from './fixtures';

/** A canonical quote submitted by the member and verified by the admin: it waits for a curator. */
async function verified(text: string) {
	const member = await apiAs('member');
	const admin = await apiAs('admin');
	const res = await member.post('/v1/submissions', {
		data: { type: 'canonical', text, attribution: 'Donald E. Knuth', source: 'A lecture', topics: ['programming'] }
	});
	expect(res.ok(), await res.text()).toBe(true);
	const { id } = await res.json();
	expect((await admin.patch(`/v1/admin/quotes/${id}`, { data: { author: 'knuth', note: 'Linked.' } })).ok()).toBe(true);
	const v = await admin.post(`/v1/admin/quotes/${id}/verification`, { data: { decision: 'verify' } });
	expect(v.ok(), await v.text()).toBe(true);
	await member.dispose();
	await admin.dispose();
	return id as string;
}

const tickAll = async (page: import('@playwright/test').Page) => {
	const boxes = page.getByRole('group', { name: 'Curation checklist' }).getByRole('checkbox');
	await expect(boxes).toHaveCount(7);
	for (const box of await boxes.all()) await box.check();
};

/** QOT-87: the curation queue. */
test.describe('admin curation', () => {
	test('lists the queue, and shows a candidate’s signals and the checklist', async ({ page }) => {
		await signIn(page, 'admin');
		const queue = await (await page.request.get(`${E2E.api}/v1/admin/curation?limit=20`)).json();
		await page.goto('/admin/curation');
		await expect(page).toHaveTitle(/^Curation queue/);
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
		const table = page.getByRole('table', { name: 'Curation queue' });
		await expect(table.getByRole('row', { name: /^Review / })).toHaveCount(queue.list.length);

		const candidate = queue.list.find((q: { type: string }) => q.type === 'original');
		await table.getByRole('row', { name: new RegExp(`^Review ${candidate.id}`) }).click();
		const card = page.getByLabel(`Candidate ${candidate.id}`);
		await expect(card).toContainText(candidate.text);
		await expect(card).toContainText('declared original');
		await expect(page.getByText(String(candidate.counts.recommends), { exact: true }).first()).toBeVisible();
		await expect(page.getByText('popularity never publishes to the dataset')).toBeVisible();

		const decision = page.getByRole('region', { name: 'Curation decision' });
		await expect(decision.getByRole('button', { name: 'Curate' })).toBeDisabled();
		await tickAll(page);
		await expect(decision.getByRole('button', { name: 'Curate' })).toBeEnabled();
	});

	test('curates a verified quote with the whole checklist', async ({ page }) => {
		const id = await verified(`Science is what we understand well enough to explain to a computer ${Date.now()}.`);
		await signIn(page, 'admin');
		await page.goto(`/admin/curation?id=${id}`);
		await expect(page.getByLabel(`Candidate ${id}`)).toBeVisible();
		await tickAll(page);
		await page.getByRole('region', { name: 'Curation decision' }).getByRole('button', { name: 'Curate' }).click();
		await expect(page.getByText(`${id} curated.`)).toBeVisible();
		await expect(page.getByRole('row', { name: new RegExp(`^Review ${id}`) })).toHaveCount(0);
		expect(sql(`SELECT status FROM quotes WHERE public_id = '${id}'`)).toBe('CURATED');
	});

	test('keeping one out needs a note, and it leaves the queue', async ({ page }) => {
		const id = await verified(`Beware of bugs in the above code; I have only proved it correct ${Date.now()}.`);
		await signIn(page, 'admin');
		await page.goto(`/admin/curation?id=${id}`);
		const decision = page.getByRole('region', { name: 'Curation decision' });
		await expect(decision.getByRole('button', { name: 'Keep out of dataset' })).toBeDisabled();
		await decision.getByLabel('Note').fill('Needs its context to land.');
		await decision.getByRole('button', { name: 'Keep out of dataset' }).click();
		await expect(page.getByText(`${id} kept out of the dataset.`)).toBeVisible();
		await expect(page.getByRole('row', { name: new RegExp(`^Review ${id}`) })).toHaveCount(0);
		expect(sql(`SELECT status FROM quotes WHERE public_id = '${id}'`)).toBe('VERIFIED');
	});

	test('an open report blocks curating, in the API’s words', async ({ page }) => {
		const id = await verified(`An algorithm must be seen to be believed ${Date.now()}.`);
		const member = await apiAs('member');
		expect((await member.post(`/v1/quotes/${id}/reports`, { data: { reason: 'attribution' } })).ok()).toBe(true);
		await member.dispose();
		await signIn(page, 'admin');
		await page.goto(`/admin/curation?id=${id}`);
		await tickAll(page);
		await page.getByRole('region', { name: 'Curation decision' }).getByRole('button', { name: 'Curate' }).click();
		await expect(page.getByText('Resolve the open reports first')).toBeVisible();
	});

	test('verifiers and moderators may not open it', async ({ page }) => {
		for (const who of ['verifier', 'moderator'] as const) {
			await page.context().clearCookies();
			await signIn(page, who);
			await page.goto('/admin/curation');
			await expect(page.getByText('Not authorized')).toBeVisible();
		}
	});

	test('stacks at 760', async ({ page }) => {
		await page.setViewportSize({ width: 760, height: 1000 });
		await signIn(page, 'admin');
		await page.goto('/admin/curation');
		await expect(page.getByRole('region', { name: 'Curation decision' })).toBeVisible();
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(760);
	});
});
