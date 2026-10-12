import { apiAs, expect, signIn, sql, test } from './fixtures';

const MEMBER = `(select id from "user" where email = 'test.user@example.com')`;
const stamp = () => String(Date.now());

/** QOT-81: my quotes. */
test.describe('my quotes', () => {
	let privateText: string;
	let evidenceText: string;

	test.beforeAll(async () => {
		const member = await apiAs('member');
		privateText = `A private thought ${stamp()} for my quotes.`;
		expect((await member.post('/v1/submissions', { data: { type: 'private', text: privateText } })).ok()).toBe(true);
		evidenceText = `A canonical quote ${stamp()} that needs a source.`;
		const res = await member.post('/v1/submissions', {
			data: {
				type: 'canonical',
				text: evidenceText,
				attribution: 'Ada Lovelace',
				source: 'A letter',
				topics: ['programming']
			}
		});
		expect(res.ok(), await res.text()).toBe(true);
		const { id } = await res.json();
		const admin = await apiAs('admin');
		const decision = await admin.post(`/v1/admin/quotes/${id}/verification`, {
			data: { decision: 'needs_evidence', note: 'Which letter? A scan or an archive reference would do.' }
		});
		expect(decision.ok(), await decision.text()).toBe(true);
		await member.dispose();
		await admin.dispose();
	});

	test.beforeEach(async ({ page }) => {
		await signIn(page, 'member');
	});

	test('tabs with counts from the API, and each quote shaped by its state', async ({ page }) => {
		await page.goto('/my-quotes');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('My quotes.');
		await expect(page.getByRole('link', { name: 'New quote' })).toHaveAttribute('href', '/submit');
		const tabs = page.getByRole('tablist', { name: 'My quotes' });
		await expect(tabs.getByRole('tab', { name: /^all \d+$/ })).toHaveAttribute('aria-selected', 'true');
		const priv = page.getByRole('article', { name: privateText });
		await expect(priv.locator('[data-status="PERSONAL"]')).toBeVisible();
		await expect(priv.getByRole('button', { name: 'Submit as original' })).toBeVisible();
		const ev = page.getByRole('article', { name: evidenceText });
		await expect(ev.getByText('A verifier needs a primary source.')).toBeVisible();
		await expect(ev).toContainText('Which letter? A scan or an archive reference would do.');
		await expect(ev.getByRole('list', { name: 'Lifecycle' })).toBeVisible();
		await tabs.getByRole('tab', { name: /^private/ }).click();
		await expect(page).toHaveURL(/tab=private$/);
		await expect(page.getByRole('article', { name: evidenceText })).toHaveCount(0);
		await expect(page.getByRole('article', { name: privateText })).toBeVisible();
	});

	test('add evidence sends it to the verifier', async ({ page }) => {
		await page.goto('/my-quotes?tab=review');
		const ev = page.getByRole('article', { name: evidenceText });
		await ev.getByRole('button', { name: 'Add evidence' }).click();
		const dialog = page.getByRole('dialog', { name: 'Add evidence' });
		await expect(dialog).toContainText('Which letter?');
		await dialog.getByRole('button', { name: 'Send to the verifier' }).click();
		await expect(dialog.getByText('This field is required')).toBeVisible();
		await dialog.getByLabel(/What you found/).fill('The 1843 letter to Babbage, British Library Add MS 37192.');
		await dialog.getByRole('button', { name: 'Send to the verifier' }).click();
		await expect(page.getByText('Sent to the verifier.')).toBeVisible();
		expect(sql(`select status from quotes where text = '${evidenceText}'`)).toBe('UNDER_REVIEW');
	});

	test('edit a private quote, then delete it after confirming', async ({ page }) => {
		await page.goto('/my-quotes?tab=private');
		const card = page.getByRole('article', { name: privateText });
		await card.getByRole('button', { name: 'Edit' }).click();
		const edit = page.getByRole('dialog', { name: 'Edit quote' });
		const edited = `${privateText} Edited.`;
		await edit.getByLabel(/^Quote/).fill(edited);
		await edit.getByLabel(/^Author/).fill('Me, on a train');
		await edit.getByRole('button', { name: 'Save' }).click();
		await expect(page.getByText('Saved.')).toBeVisible();
		const now = page.getByRole('article', { name: edited });
		await expect(now).toContainText('Me, on a train');
		privateText = edited;

		await now.getByRole('button', { name: 'Delete' }).click();
		const confirm = page.getByRole('alertdialog', { name: 'Delete this quote?' });
		await confirm.getByRole('button', { name: 'Keep it' }).click();
		await expect(page.getByRole('article', { name: edited })).toBeVisible();
		await now.getByRole('button', { name: 'Delete' }).click();
		await confirm.getByRole('button', { name: 'Delete' }).click();
		await expect(page.getByRole('article', { name: edited })).toHaveCount(0);
		expect(sql(`select count(*) from quotes where text = '${edited}' and contributor_id = ${MEMBER}`)).toBe('0');
	});

	test('a private quote can be submitted as an original', async ({ page }) => {
		const text = `My own words ${stamp()}, kept privately first.`;
		const member = await apiAs('member');
		await member.post('/v1/submissions', { data: { type: 'private', text } });
		await member.dispose();
		await page.goto('/my-quotes?tab=private');
		await page.getByRole('article', { name: text }).getByRole('button', { name: 'Submit as original' }).click();
		const dialog = page.getByRole('dialog', { name: 'Submit as your original' });
		await expect(dialog.getByRole('button', { name: 'Submit', exact: true })).toBeDisabled();
		await dialog.getByRole('button', { name: 'creativity', exact: true }).click();
		await dialog.getByRole('checkbox', { name: /I wrote this quote/ }).check();
		await dialog.getByRole('button', { name: 'Submit', exact: true }).click();
		await expect(page.getByText(/Submitted\. It publishes once/)).toBeVisible();
		expect(sql(`select type, status from quotes where text = '${text}'`)).toBe('ORIGINAL|ORIGINALITY_CHECK');
	});

	test('nothing in a tab says so; 760 without sideways scroll', async ({ page }) => {
		sql(
			`delete from quotes where contributor_id = ${MEMBER} and status in ('PUBLISHED','COMMUNITY_DISCOVERY','CURATION_CANDIDATE','VERIFIED','CURATED','DATASET_RELEASE')`
		);
		await page.goto('/my-quotes?tab=public');
		await expect(page.getByText('None of your quotes is public yet.')).toBeVisible();
		await page.setViewportSize({ width: 760, height: 900 });
		await page.goto('/my-quotes');
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(760);
	});
});
