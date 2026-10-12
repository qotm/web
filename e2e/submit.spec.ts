import { expect, signIn, sql, test } from './fixtures';
import type { Page } from '@playwright/test';

const unique = () => `A test quote, written ${Date.now()} for the submit flow.`;
const pickTopic = (page: Page, name: string) => page.getByRole('button', { name, exact: true }).click();

/** QOT-78: the submit flow. */
test.describe('submit', () => {
	test.beforeEach(async ({ page }) => {
		await signIn(page, 'member');
	});

	test('canonical: its fields, the contributor notice, and it goes for review', async ({ page }) => {
		await page.goto('/submit');
		await expect(page).toHaveTitle(/Submit a quote/);
		await expect(page.getByRole('radio', { name: /A quote by someone else/ })).toBeChecked();
		const text = unique();
		await page.locator('#text').fill(`“${text}”`);
		await page.locator('#attribution').fill('Grace Hopper');
		await page.locator('#year').fill('1987');
		await page.locator('#source').fill('An interview');
		await pickTopic(page, 'programming');
		await expect(page.getByText('Grace Hopper stays the author.')).toBeVisible();
		await expect(page.getByText('or from the terminal: qotm submit')).toBeVisible();
		await page.getByRole('button', { name: 'Submit for review' }).click();
		await expect(page).toHaveURL(/\/my-quotes$/);
		await expect(page.getByText('Submitted for review.')).toBeVisible();
		// Saved without the quotation marks, waiting for review.
		expect(sql(`select status, type, year from quotes where text = '${text}'`)).toBe('SUBMITTED|CANONICAL|1987');
	});

	test('says what is missing, on each field', async ({ page }) => {
		await page.goto('/submit');
		await page.getByRole('button', { name: 'Submit for review' }).click();
		await expect(page.getByText('At least 3 characters')).toBeVisible();
		await expect(page.getByText('Who said or wrote it')).toBeVisible();
		await expect(page.getByText('The book, paper, talk or post')).toBeVisible();
		await expect(page.getByText('Pick at least one topic')).toBeVisible();
	});

	test('the API’s own validation lands on its field', async ({ page }) => {
		await page.route('**/v1/submissions', (route) =>
			route.fulfill({ status: 400, json: { statusCode: 400, message: 'Validation: sourceUrl: Invalid URL' } })
		);
		await page.goto('/submit');
		await page.locator('#text').fill(unique());
		await page.locator('#attribution').fill('Grace Hopper');
		await page.locator('#source').fill('An interview');
		await page.locator('#sourceUrl').fill('https://example.com/x');
		await pickTopic(page, 'programming');
		await page.getByRole('button', { name: 'Submit for review' }).click();
		await expect(page.getByText('Invalid URL')).toBeVisible();
		await expect(page).toHaveURL(/\/submit$/);
	});

	test('the live match compares an existing quote, debounced, and can be dismissed', async ({ page }) => {
		let calls = 0;
		page.on('request', (r) => {
			if (r.url().endsWith('/v1/quotes/match')) calls++;
		});
		await page.goto('/submit');
		await page.locator('#text').pressSequentially('Premature optimization is the root of all evil', { delay: 20 });
		const compare = page.getByRole('region', { name: 'Possible match' });
		await expect(compare).toBeVisible();
		await expect(compare).toContainText('Premature optimization is the root of all evil.');
		expect(calls).toBeLessThanOrEqual(2);
		await compare.getByRole('button', { name: 'Not a duplicate' }).click();
		await expect(compare).toHaveCount(0);
	});

	test('original: the originality check, the rights box, and it publishes', async ({ page }) => {
		await page.goto('/submit');
		await page.getByRole('radio', { name: /My own original/ }).check();
		await expect(page.getByText('Your own words, shared with the community.')).toBeVisible();
		await expect(page.locator('#attribution')).toHaveCount(0);
		const text = unique();
		await page.locator('#text').fill(text);
		await pickTopic(page, 'software engineering');
		await expect(page.getByText('Originality check: no known matching attribution found.')).toBeVisible();
		await expect(page.getByText('Public isn’t the same as shipped.')).toBeVisible();
		await page.getByRole('button', { name: 'Publish to the community' }).click();
		await expect(page.getByText('Confirm you wrote this quote and may publish it')).toBeVisible();
		await page.getByRole('checkbox', { name: /I wrote this quote/ }).check();
		await page.getByRole('button', { name: 'Publish to the community' }).click();
		// The originality check runs in the worker; the quote page shows it meanwhile.
		await expect(page).toHaveURL(/\/q\/\w{6}$/);
		await expect(page.getByText(/Checking it against the corpus|Published to the community/)).toBeVisible();
		await expect(page.locator('blockquote')).toContainText(text);
	});

	test('keeping it private needs only the words', async ({ page }) => {
		await page.goto('/submit');
		const text = unique();
		await page.locator('#text').fill(text);
		await page.getByRole('button', { name: 'Save as private' }).click();
		await expect(page).toHaveURL(/\/my-quotes$/);
		await expect(page.getByText('Saved privately.')).toBeVisible();
		expect(sql(`select status, type from quotes where text = '${text}'`)).toBe('PRIVATE|PRIVATE');
	});

	test('stacks at 760 without sideways scroll', async ({ page }) => {
		await page.setViewportSize({ width: 760, height: 900 });
		await page.goto('/submit');
		await expect(page.locator('#attribution')).toBeVisible();
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(760);
	});
});
