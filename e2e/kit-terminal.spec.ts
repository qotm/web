import { VISUAL, expectMatchesKit } from './kit';
import { expect, test } from './fixtures';

const TEXT = [...VISUAL, 'line-height', 'text-transform', 'box-shadow', 'padding-bottom', 'padding-right'] as const;

/** QOT-64: Terminal, Prompt, Cursor, InstallPill and CommandBlock against qotm_kit. */
test.describe('kit: terminal', () => {
	test('Terminal matches the kit: window, bar, dots, title, body, prompt and cursor', async ({ page }) => {
		await expectMatchesKit(
			page,
			'Terminal',
			[
				['.qk-term', 'css::scope > div'],
				['.qk-term__bar', 'css::scope > div > div:first-child'],
				['.qk-term__bar i', 'css::scope i'],
				['.qk-term__title', 'css::scope > div > div:first-child > span'],
				['.qk-term__body', 'css::scope > div > div:last-child'],
				['.qk-prompt', 'css::scope [aria-hidden="true"].text-dark-accent'],
				['.qk-cursor', 'css::scope .animate-blink']
			],
			TEXT
		);
	});

	test('the cursor blinks, and holds still under reduced motion', async ({ page }) => {
		await page.goto('/_kit?only=Terminal');
		const cursor = page.locator('.animate-blink');
		await expect(cursor).toHaveCSS('animation-name', 'blink');
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await expect(cursor).toHaveCSS('animation-name', 'none');
	});

	test('InstallPill matches the kit: plain, copyable and on ink', async ({ page }) => {
		await expectMatchesKit(
			page,
			'InstallPill',
			[
				['span.qk-pill', 'css::scope span.inline-flex'],
				['button.qk-pill:not(.qk-pill--dark)', 'css::scope button:not(.border-dark-rule)'],
				['.qk-pill--dark', 'css::scope button.border-dark-rule'],
				['.qk-pill__glyph', 'css::scope span.inline-flex > span:first-child'],
				['.qk-pill--dark .qk-pill__glyph', 'css::scope button.border-dark-rule > span:first-child'],
				[
					'button.qk-pill:not(.qk-pill--dark) .qk-pill__hint',
					'css::scope button:not(.border-dark-rule) > span:last-child'
				]
			],
			TEXT
		);
	});

	test('CommandBlock matches the kit: dark with caption, and light', async ({ page }) => {
		await expectMatchesKit(
			page,
			'CommandBlock',
			[
				['.qk-cmd--dark', 'css::scope > div:first-child'],
				['.qk-cmd--light', 'css::scope > div:last-child'],
				['.qk-cmd__caption', 'css::scope > div:first-child > div:first-child'],
				['.qk-cmd--dark .qk-cmd__row', 'css::scope > div:first-child > div:last-child'],
				['.qk-cmd--dark .qk-cmd__glyph', 'css::scope > div:first-child code > span'],
				['.qk-cmd--light .qk-cmd__glyph', 'css::scope > div:last-child code > span'],
				['.qk-cmd--dark .qk-cmd__copy', 'css::scope > div:first-child button'],
				['.qk-cmd--light .qk-cmd__copy', 'css::scope > div:last-child button']
			],
			TEXT
		);
	});

	test('copying puts the command on the clipboard and announces it', async ({ page, context }) => {
		await context.grantPermissions(['clipboard-read', 'clipboard-write']);
		await page.goto('/_kit?only=CommandBlock');
		const copy = page.getByRole('button', { name: 'Copy qotm open q_8f2k1c' });
		await copy.focus();
		await expect.poll(() => copy.evaluate((el) => getComputedStyle(el).outlineColor)).toBe('rgb(184, 92, 62)');
		await page.keyboard.press('Enter');
		await expect(copy).toHaveText('copied');
		await expect(page.getByRole('status').first()).toHaveText('Copied “qotm open q_8f2k1c” to the clipboard');
		expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('qotm open q_8f2k1c');
		await expect(copy).toHaveText('copy', { timeout: 3000 });

		await page.goto('/_kit?only=InstallPill');
		await page.getByRole('button', { name: 'Copy qotm sync' }).click();
		await expect(page.getByRole('status').first()).toHaveText('Copied “qotm sync” to the clipboard');
	});
});
