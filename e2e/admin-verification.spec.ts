import { E2E, apiAs, expect, signIn, sql, test } from './fixtures';

/** A canonical quote from the member, waiting for a verifier (its author not linked). */
async function submitted(text: string, attribution = 'Grace Hopper') {
	const member = await apiAs('member');
	const res = await member.post('/v1/submissions', {
		data: { type: 'canonical', text, attribution, source: 'An interview', topics: ['programming'] }
	});
	expect(res.ok(), await res.text()).toBe(true);
	const { id } = await res.json();
	await member.dispose();
	return id as string;
}

/** QOT-86: the verification queue. */
test.describe('admin verification', () => {
	test('lists the queue, and shows the selected quote with its provenance and notes', async ({ page }) => {
		await signIn(page, 'verifier');
		const queue = await (await page.request.get(`${E2E.api}/v1/admin/verification?limit=10`)).json();
		await page.goto('/admin/verification');
		await expect(page).toHaveTitle(/^Verification queue/);
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
		const list = page.getByRole('list', { name: 'Verification queue' });
		await expect(list.getByRole('link', { name: /^Review / })).toHaveCount(queue.list.length);

		await list.getByRole('link', { name: /^Review q_6h2w8r/ }).click();
		const card = page.getByRole('region', { name: 'Submission q_6h2w8r' });
		await expect(card).toContainText('cache invalidation and naming things');
		await expect(card).toContainText('submitted by @');
		await expect(page.getByText('A verifier needs a primary source.')).toBeVisible();
		await expect(page.getByText('Check the wording against the source.')).toBeVisible();
		await expect(page.getByRole('region', { name: 'Verification decision' })).toBeVisible();
	});

	test('will not verify before the author is linked; linking it, then verifying, clears it', async ({ page }) => {
		const id = await submitted(`The most dangerous phrase is: we have always done it this way ${Date.now()}.`);
		await signIn(page, 'verifier');
		await page.goto(`/admin/verification?id=${id}`);
		await expect(page.getByText('Link the author before verifying.')).toBeVisible();
		const decision = page.getByRole('region', { name: 'Verification decision' });
		await decision.getByRole('button', { name: 'Verify' }).click();
		await expect(page.getByText(/Link the author before verifying \(submitted as "Grace Hopper"\)/)).toBeVisible();

		await page.getByRole('button', { name: 'Link author' }).click();
		const dialog = page.getByRole('dialog', { name: 'Correct before verifying' });
		await dialog.getByLabel('Author').fill('Knuth');
		await dialog.getByRole('option', { name: /Knuth/ }).click();
		await expect(dialog.getByText('Linked: knuth')).toBeVisible();
		await dialog.getByLabel('Note').fill('Linked for the test.');
		await dialog.getByRole('button', { name: 'Save correction' }).click();
		await expect(page.getByText('Corrected.')).toBeVisible();
		await expect(page.getByText('Link the author before verifying.')).toHaveCount(0);

		await decision.getByRole('button', { name: 'Verify' }).click();
		await expect(page.getByText(`${id} verified.`)).toBeVisible();
		await expect(page.getByRole('link', { name: new RegExp(`^Review ${id}`) })).toHaveCount(0);
		expect(sql(`SELECT status FROM quotes WHERE public_id = '${id}'`)).toBe('VERIFIED');
	});

	test('corrects the wording, kept as a correction', async ({ page }) => {
		const id = await submitted(`It is easier to ask forgiveness than permission ${Date.now()}.`);
		await signIn(page, 'admin');
		await page.goto(`/admin/verification?id=${id}`);
		await page.getByRole('button', { name: 'Correct wording' }).click();
		const dialog = page.getByRole('dialog', { name: 'Correct before verifying' });
		await expect(dialog.getByRole('button', { name: 'Save correction' })).toBeVisible();
		await dialog.getByRole('button', { name: 'Save correction' }).click();
		await expect(dialog.getByText('Say what you checked, for the audit log')).toBeVisible();
		const fixed = `It’s easier to ask forgiveness than it is to get permission ${Date.now()}.`;
		await dialog.getByLabel('Quote').fill(fixed);
		await dialog.getByLabel('Note').fill('The 1986 interview has this wording.');
		await dialog.getByRole('button', { name: 'Save correction' }).click();
		await expect(page.getByText('Corrected.')).toBeVisible();
		await expect(page.getByLabel(`Submission ${id}`)).toContainText('to get permission');
		expect(
			sql(`SELECT count(*) FROM corrections c JOIN quotes q ON q.id = c.quote_id WHERE q.public_id = '${id}'`)
		).toBe('1');
	});

	test('asking for evidence needs a note, which goes to the submitter', async ({ page }) => {
		const id = await submitted(`A ship in port is safe, but that is not what ships are built for ${Date.now()}.`);
		await signIn(page, 'verifier');
		await page.goto(`/admin/verification?id=${id}`);
		const decision = page.getByRole('region', { name: 'Verification decision' });
		await expect(decision.getByRole('button', { name: 'Needs evidence' })).toBeDisabled();
		await decision.getByLabel('Note').fill('Where was this said? A talk, an interview?');
		await decision.getByRole('button', { name: 'Needs evidence' }).click();
		await expect(page.getByText(`Evidence requested for ${id}.`)).toBeVisible();
		expect(sql(`SELECT status FROM quotes WHERE public_id = '${id}'`)).toBe('NEEDS_EVIDENCE');
		// The next one opens; this one stays in the queue, now with the note.
		await expect(page).not.toHaveURL(new RegExp(`id=${id}`));
		await page.getByRole('link', { name: new RegExp(`^Review ${id}`) }).click();
		await expect(page.getByText('Where was this said? A talk, an interview?').last()).toBeVisible();
	});

	test('a moderator may not open it', async ({ page }) => {
		await signIn(page, 'moderator');
		await page.goto('/admin/verification');
		await expect(page.getByText('Not authorized')).toBeVisible();
	});

	test('on a phone, the list and the item are two screens, the decision pinned at the foot', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await signIn(page, 'admin');
		await page.goto('/admin/verification');
		const list = page.getByRole('list', { name: 'Verification queue' });
		await expect(list).toBeVisible();
		await expect(page.getByRole('region', { name: 'Verification decision' })).toBeHidden();
		await list.getByRole('link', { name: /^Review q_6h2w8r/ }).click();
		await expect(list).toBeHidden();
		const decision = page.getByRole('region', { name: 'Verification decision' });
		await expect(decision.getByRole('button', { name: 'Verify' })).toBeInViewport();
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
		await page.getByRole('button', { name: /Queue$/ }).click();
		await expect(list).toBeVisible();
	});

	test('J and K, and the arrows, move through the queue', async ({ page }) => {
		await signIn(page, 'admin');
		const queue = await (await page.request.get(`${E2E.api}/v1/admin/verification?limit=10`)).json();
		test.skip(queue.list.length < 2, 'needs two items');
		const [a, b] = queue.list;
		await page.goto(`/admin/verification?id=${a.id}`);
		await expect(page.getByRole('region', { name: `Submission ${a.id}` })).toBeVisible();
		await page.keyboard.press('j');
		await expect(page).toHaveURL(new RegExp(`id=${b.id}`));
		await expect(page.getByRole('region', { name: `Submission ${b.id}` })).toContainText(`2 of ${queue.total}`);
		await page.getByRole('button', { name: 'Previous' }).click();
		await expect(page).toHaveURL(new RegExp(`id=${a.id}`));
		// Not while typing a note.
		await page.getByRole('region', { name: 'Verification decision' }).getByLabel('Note').fill('j');
		await expect(page).toHaveURL(new RegExp(`id=${a.id}`));
	});
});
