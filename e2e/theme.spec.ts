import { expect, test } from './fixtures';

test.describe('one theme, Paper', () => {
	test.use({ colorScheme: 'dark' });

	test('ignores a dark OS preference and offers no toggle', async ({ page }) => {
		await page.goto('/login');
		const html = page.locator('html');
		await expect(html).not.toHaveClass(/dark/);
		expect(await html.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(244, 242, 237)');
		expect(await page.locator('body').evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
			'rgb(244, 242, 237)'
		);
		await expect(page.getByRole('button', { name: /theme/i })).toHaveCount(0);
		await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#f4f2ed');
	});

	test('draws the kit glyphs with the qotm glyphs faces', async ({ page }) => {
		await page.goto('/login');
		const loaded = await page.evaluate(async () => {
			const probe = document.createElement('span');
			probe.style.fontFamily = 'var(--font-mono)';
			probe.textContent = '❯ → ↗ ♡ ★ ⚑ ✓';
			document.body.append(probe);
			await document.fonts.load('16px "qotm glyphs"', '❯→↗♡★⚑✓');
			return [...document.fonts].filter((f) => f.family.replace(/"/g, '') === 'qotm glyphs').map((f) => f.status);
		});
		expect(loaded).toEqual(['loaded', 'loaded', 'loaded']);
	});
});
