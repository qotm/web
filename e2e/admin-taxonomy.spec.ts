import { E2E, expect, signIn, sql, test } from './fixtures';

const stamp = () => Date.now().toString(36);

/** QOT-89: authors, sources and topics. */
test.describe('admin taxonomy', () => {
	test('authors: the list, search, add, edit, and a taken slug', async ({ page }) => {
		await signIn(page, 'admin');
		const all = await (await page.request.get(`${E2E.api}/v1/admin/authors?limit=20`)).json();
		await page.goto('/admin/authors');
		await expect(page).toHaveTitle(/^Authors/);
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
		const table = page.getByRole('table', { name: 'Authors' });
		await expect(table.locator('tbody tr')).toHaveCount(all.list.length);
		await expect(table.getByRole('row', { name: 'Edit Donald E. Knuth' })).toContainText('knuth');

		await page.getByLabel('Search authors').fill('Hoare');
		await expect(table.locator('tbody tr')).toHaveCount(1);
		await page.getByLabel('Search authors').fill('');

		const s = stamp();
		await page.getByRole('button', { name: 'Add author' }).click();
		let dialog = page.getByRole('dialog', { name: 'Add author' });
		await dialog.getByRole('button', { name: 'Add author' }).click();
		await expect(dialog.getByText('Name is required')).toBeVisible();
		await dialog.getByLabel('Name').fill(`Grace Hopper ${s}`);
		await dialog.getByLabel('Born').fill('1906');
		await dialog.getByRole('button', { name: 'Add author' }).click();
		await expect(page.getByText('Author added.')).toBeVisible();
		expect(sql(`SELECT born_year FROM authors WHERE slug = 'grace-hopper-${s}'`)).toBe('1906');

		await page.getByLabel('Search authors').fill(`Grace Hopper ${s}`);
		await table.getByRole('row', { name: `Edit Grace Hopper ${s}` }).click();
		dialog = page.getByRole('dialog', { name: 'Edit author' });
		await expect(dialog.getByLabel('Born')).toHaveValue('1906');
		await dialog.getByLabel('Died').fill('1992');
		await dialog.getByLabel('Slug').fill('knuth');
		await dialog.getByRole('button', { name: 'Save' }).click();
		await expect(dialog.getByText('That slug is taken.')).toBeVisible();
		await dialog.getByLabel('Slug').fill(`hopper-${s}`);
		await dialog.getByRole('button', { name: 'Save' }).click();
		await expect(page.getByText('Author saved.')).toBeVisible();
		expect(sql(`SELECT died_year FROM authors WHERE slug = 'hopper-${s}'`)).toBe('1992');
	});

	test('sources: add one with its author and kind', async ({ page }) => {
		await signIn(page, 'admin');
		await page.goto('/admin/sources');
		await expect(
			page.getByRole('table', { name: 'Sources' }).getByRole('row', { name: /^Edit EWD 498/ })
		).toContainText('Edsger W. Dijkstra');
		const title = `The Art of Computer Programming ${stamp()}`;
		await page.getByRole('button', { name: 'Add source' }).click();
		const dialog = page.getByRole('dialog', { name: 'Add source' });
		await dialog.getByLabel('Title').fill(title);
		await dialog.getByLabel('Author').fill('knuth');
		await dialog.getByLabel('Year').fill('1968');
		await dialog.getByLabel('Kind').selectOption('BOOK');
		await dialog.getByLabel('Link').fill('not a link');
		await dialog.getByRole('button', { name: 'Add source' }).click();
		await expect(dialog.getByText('A link starting with https://')).toBeVisible();
		await dialog.getByLabel('Link').fill('https://www-cs-faculty.stanford.edu/~knuth/taocp.html');
		await dialog.getByRole('button', { name: 'Add source' }).click();
		await expect(page.getByText('Source added.')).toBeVisible();
		await page.getByLabel('Search sources').fill(title);
		await expect(page.getByRole('row', { name: `Edit ${title}` })).toContainText('Donald E. Knuth');
		await expect(page.getByRole('row', { name: `Edit ${title}` })).toContainText('book');
	});

	test('topics: every topic, add one and describe it', async ({ page }) => {
		await signIn(page, 'admin');
		const all = await (await page.request.get(`${E2E.api}/v1/admin/topics?limit=100`)).json();
		await page.goto('/admin/topics');
		const table = page.getByRole('table', { name: 'Topics' });
		await expect(table.locator('tbody tr')).toHaveCount(all.list.length);
		const s = stamp();
		await page.getByRole('button', { name: 'Add topic' }).click();
		let dialog = page.getByRole('dialog', { name: 'Add topic' });
		await dialog.getByLabel('Name').fill(`Compilers ${s}`);
		await dialog.getByRole('button', { name: 'Add topic' }).click();
		await expect(page.getByText('Topic added.')).toBeVisible();
		await table.getByRole('row', { name: `Edit compilers ${s}` }).click();
		dialog = page.getByRole('dialog', { name: 'Edit topic' });
		await dialog.getByLabel('Description').fill('Parsing, codegen and the rest.');
		await dialog.getByRole('button', { name: 'Save' }).click();
		await expect(page.getByText('Topic saved.')).toBeVisible();
		expect(sql(`SELECT description FROM topics WHERE slug = 'compilers-${s}'`)).toBe('Parsing, codegen and the rest.');
		// Other specs count the seeded topics.
		sql(`DELETE FROM topics WHERE slug = 'compilers-${s}'`);
	});

	test('only admins may open them', async ({ page }) => {
		await signIn(page, 'verifier');
		for (const p of ['authors', 'sources', 'topics']) {
			await page.goto(`/admin/${p}`);
			await expect(page.getByText('Not authorized')).toBeVisible();
		}
	});

	test('stacks at 760', async ({ page }) => {
		await page.setViewportSize({ width: 760, height: 1000 });
		await signIn(page, 'admin');
		for (const p of ['authors', 'sources', 'topics']) {
			await page.goto(`/admin/${p}`);
			await expect(page.locator('tbody tr').first()).toBeVisible();
			expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(760);
		}
	});
});
