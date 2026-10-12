import { E2E, expect, signIn, sql, test } from './fixtures';
import type { Page } from '@playwright/test';

const MEMBER = `(select id from "user" where email = 'test.user@example.com')`;
const favorite = async (page: Page, id: string) => {
	const res = await page.request.post(`${E2E.api}/v1/quotes/${id}/favorite`, { headers: { Origin: E2E.web } });
	expect(res.ok(), await res.text()).toBe(true);
};
const favoritedIds = () =>
	sql(`select q.public_id from favorites f join quotes q on q.id = f.quote_id where f.user_id = ${MEMBER} order by 1`);

/** QOT-80: favorites. */
test.describe('favorites', () => {
	test.beforeEach(async ({ page }) => {
		sql(`delete from favorites where user_id = ${MEMBER}`);
		await signIn(page, 'member');
	});

	test('nothing yet says how to start', async ({ page }) => {
		await page.goto('/favorites');
		await expect(page.getByText('No favorites yet.')).toBeVisible();
		await expect(page.locator('code', { hasText: 'qotm save' })).toBeVisible();
	});

	test('the count, the commands, two columns of cards, filter and sort in the URL', async ({ page }) => {
		for (const id of ['q_8f2k1c', 'q_1t7c4e', 'q_3m9d0a']) await favorite(page, id);
		await page.goto('/favorites');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Favorites.');
		await expect(page.getByText('3 quotes. They sync to every terminal')).toBeVisible();
		await expect(page.locator('code', { hasText: 'qotm --favorites' })).toBeVisible();
		await expect(page.locator('code', { hasText: 'qotm favorites' })).toBeVisible();
		await expect(page.getByRole('article')).toHaveCount(3);
		const field = page.getByRole('searchbox', { name: 'Filter favorites' });
		await field.fill('debugging');
		await field.press('Enter');
		await expect(page).toHaveURL(/q=debugging/);
		await expect(page.getByRole('article')).toHaveCount(1);
		await expect(page.getByRole('article')).toContainText('Debugging is twice as hard');
		await field.fill('zzzz');
		await field.press('Enter');
		await expect(page.getByText('No favorites match “zzzz”.')).toBeVisible();
		await page.getByRole('button', { name: 'Clear the filter' }).click();
		await expect(page.getByRole('article')).toHaveCount(3);
		await page.getByLabel('Sort').selectOption('author');
		await expect(page).toHaveURL(/sort=author/);
		await expect(page.getByRole('article').first()).toContainText('Brian W. Kernighan');
	});

	test('unfavoriting removes the card, and undo brings it back', async ({ page }) => {
		await favorite(page, 'q_8f2k1c');
		await favorite(page, 'q_1t7c4e');
		await page.goto('/favorites');
		await expect(page.getByRole('article')).toHaveCount(2);
		const card = page.getByRole('article').filter({ hasText: 'Simplicity is prerequisite' });
		await card.getByRole('button', { name: /^favorite/ }).click();
		await expect(page.getByText('Removed from favorites.')).toBeVisible();
		await expect(page.getByRole('article')).toHaveCount(1);
		expect(favoritedIds()).toBe('q_1t7c4e');
		await page.getByRole('button', { name: 'undo' }).click();
		await expect(page.getByRole('article')).toHaveCount(2);
		expect(favoritedIds()).toBe('q_1t7c4e\nq_8f2k1c');
	});

	test('needs a session; stacks at 760 without sideways scroll', async ({ page, context }) => {
		await favorite(page, 'q_8f2k1c');
		await page.setViewportSize({ width: 760, height: 900 });
		await page.goto('/favorites');
		await expect(page.getByRole('article')).toHaveCount(1);
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(760);
		await context.clearCookies();
		await page.goto('/favorites');
		await expect(page).toHaveURL(/\/login\?redirect=%2Ffavorites/);
	});
});
