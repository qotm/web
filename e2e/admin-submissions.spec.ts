import { E2E, apiAs, expect, signIn, sql, test } from './fixtures';

/** An original from the member, held by the originality check (the test stack runs no worker). */
async function heldOriginal(text: string) {
	const member = await apiAs('member');
	const res = await member.post('/v1/submissions', {
		data: { type: 'original', text, topics: ['software-engineering'], rights: true }
	});
	expect(res.ok(), await res.text()).toBe(true);
	const { id } = await res.json();
	await member.dispose();
	expect(sql(`SELECT status FROM quotes WHERE public_id = '${id}'`)).toBe('ORIGINALITY_CHECK');
	return id as string;
}

/** QOT-85: the submissions queue, now originality holds (canvas "Admin review", board 3). */
test.describe('admin submissions', () => {
	test('lists the held originals from the API, and shows the selected match', async ({ page }) => {
		await signIn(page, 'admin');
		const queue = await (await page.request.get(`${E2E.api}/v1/admin/submissions?limit=10`)).json();
		await page.goto('/admin/submissions');
		await expect(page).toHaveTitle(/^Originality holds/);
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
		const list = page.getByRole('list', { name: 'Originality holds' });
		expect(queue.list.every((q: { type: string }) => q.type === 'original')).toBe(true);
		await expect(list.getByRole('link', { name: /^Review / })).toHaveCount(queue.list.length);

		// The seeded original that matches a canonical quote.
		await list.getByRole('link', { name: /^Review q_7w2e9n/ }).click();
		await expect(page).toHaveURL(/id=q_7w2e9n/);
		const pane = page.getByRole('region', { name: 'Submission q_7w2e9n' });
		await expect(pane).toContainText(/q_7w2e9n · original by @/);
		const match = page.getByRole('region', { name: 'Possible match' });
		await expect(match).toContainText('Make it work, make it right, make it fast.');
		await expect(match.getByRole('button')).toHaveCount(0);
		await expect(page.getByText('Why it’s held')).toBeVisible();
		const decision = page.getByRole('region', { name: 'Moderation decision' });
		await expect(decision.getByRole('button', { name: 'Not a duplicate — publish' })).toBeEnabled();
		// With a match, withdrawing as its duplicate needs no note: the match is the note.
		await expect(decision.getByRole('button', { name: 'Duplicate — withdraw' })).toBeEnabled();
	});

	test('publishes a held original, and it leaves the queue', async ({ page }) => {
		const id = await heldOriginal(`A queue is a promise with a timestamp ${Date.now()}.`);
		await signIn(page, 'admin');
		await page.goto(`/admin/submissions?id=${id}`);
		await expect(page.getByRole('region', { name: `Submission ${id}` })).toContainText(`${id} · original`);
		await page.getByRole('region', { name: 'Moderation decision' }).getByRole('button', { name: 'Publish' }).click();
		await expect(page.getByText(`${id} published.`)).toBeVisible();
		await expect(page.getByRole('link', { name: new RegExp(`^Review ${id}`) })).toHaveCount(0);
		expect(sql(`SELECT status FROM quotes WHERE public_id = '${id}'`)).toBe('PUBLISHED');
	});

	test('withdrawing needs a note, kept in the audit log', async ({ page }) => {
		const id = await heldOriginal(`Every flag is a feature someone forgot ${Date.now()}.`);
		await signIn(page, 'moderator');
		await page.goto(`/admin/submissions?id=${id}`);
		const decision = page.getByRole('region', { name: 'Moderation decision' });
		await expect(decision.getByRole('button', { name: 'Withdraw' })).toBeDisabled();
		await decision.getByLabel('Note').fill('Spam: the same line posted three times.');
		await decision.getByRole('button', { name: 'Withdraw' }).click();
		await expect(page.getByText(`${id} withdrawn.`)).toBeVisible();
		expect(sql(`SELECT status FROM quotes WHERE public_id = '${id}'`)).toBe('WITHDRAWN');
	});

	test('marks a matching original as a duplicate', async ({ page }) => {
		await signIn(page, 'admin');
		await page.goto('/admin/submissions?id=q_7w2e9n');
		const match = page.getByRole('region', { name: 'Possible match' });
		const existing = (await match.locator('code').innerText()).trim();
		await page
			.getByRole('region', { name: 'Moderation decision' })
			.getByRole('button', { name: 'Duplicate — withdraw' })
			.click();
		await expect(page.getByText('q_7w2e9n withdrawn.')).toBeVisible();
		expect(
			sql(
				`SELECT e.note FROM quote_events e JOIN quotes q ON q.id = e.quote_id WHERE q.public_id = 'q_7w2e9n' ORDER BY e.at DESC LIMIT 1`
			)
		).toBe(`Duplicate of ${existing}`);
		expect(sql(`SELECT status FROM quotes WHERE public_id = 'q_7w2e9n'`)).toBe('WITHDRAWN');
	});

	test('a verifier may not open it', async ({ page }) => {
		await signIn(page, 'verifier');
		await page.goto('/admin/submissions');
		await expect(page.getByText('Not authorized')).toBeVisible();
	});

	test('stacks at 760', async ({ page }) => {
		await page.setViewportSize({ width: 760, height: 1000 });
		await signIn(page, 'admin');
		await page.goto('/admin/submissions');
		await expect(page.getByRole('heading', { level: 1, name: 'Originality holds.' })).toBeVisible();
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(760);
	});
});
