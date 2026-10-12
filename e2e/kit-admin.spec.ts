import { VISUAL, expectMatchesKit } from './kit';
import { expect, test } from './fixtures';

const TEXT = [...VISUAL, 'line-height', 'text-transform', 'margin-bottom', 'padding-bottom', 'padding-right'] as const;

/** QOT-68: DataTable, StatCard, ReleaseSummary, ReviewDecision and MatchCompare against qotm_kit. */
test.describe('kit: admin', () => {
	test('DataTable matches the kit: box, head, cells, mono, status', async ({ page }) => {
		await expectMatchesKit(
			page,
			'DataTable',
			[
				['.qk-table-wrap', 'css::scope > div:first-child'],
				['.qk-table', 'css:table'],
				['.qk-table th:nth-child(2)', 'css:th:nth-child(2)'],
				['.qk-table th.qk-table__sel', 'css:th:first-child'],
				['.qk-table tbody tr:first-child td:nth-child(2)', 'css:tbody tr:first-child td:nth-child(2)'],
				['.qk-table tbody tr:first-child td:nth-child(3)', 'css:tbody tr:first-child td:nth-child(3)'],
				['.qk-table tbody tr:last-child td:nth-child(3)', 'css:tbody tr:last-child td:nth-child(3)'],
				['.qk-table tbody tr:first-child td:last-child', 'css:tbody tr:first-child td:last-child']
			],
			TEXT
		);
	});

	test('DataTable selects rows and all, by mouse and keyboard', async ({ page }) => {
		await page.goto('/_kit?only=DataTable');
		const table = page.getByRole('table', { name: 'Verification queue' });
		const row = table.getByRole('row').nth(1);
		await table.getByRole('checkbox', { name: 'Select q_6h2w8r' }).check();
		await expect(row).toHaveAttribute('aria-selected', 'true');
		await expect
			.poll(() =>
				row
					.locator('td')
					.first()
					.evaluate((el) => getComputedStyle(el).backgroundColor)
			)
			.toBe('rgb(238, 219, 208)');
		const all = table.getByRole('checkbox', { name: 'Select all' });
		expect(await all.evaluate((el: HTMLInputElement) => el.indeterminate)).toBe(true);
		await all.focus();
		await page.keyboard.press('Space');
		await expect(table.getByRole('checkbox', { checked: true })).toHaveCount(4);
		await expect.poll(() => all.evaluate((el) => getComputedStyle(el).outlineColor)).toBe('rgb(184, 92, 62)');
	});

	test('StatCard matches the kit: label, value, delta and note', async ({ page }) => {
		await expectMatchesKit(
			page,
			'StatCard',
			[
				['.qk-stat:nth-child(1)', 'css::scope > div > div:nth-child(1)'],
				['.qk-stat:nth-child(1) .qk-stat__label', 'css::scope > div > div:nth-child(1) > div:nth-child(1)'],
				['.qk-stat:nth-child(1) .qk-stat__value', 'css::scope > div > div:nth-child(1) > div:nth-child(2)'],
				['.qk-stat__delta', 'css::scope > div > div:nth-child(1) > div:nth-child(3)'],
				['.qk-stat__note', 'css::scope > div > div:nth-child(2) > div:nth-child(3)']
			],
			TEXT
		);
	});

	test('ReleaseSummary matches the kit: preview and published', async ({ page }) => {
		const pv = 'css:section:nth-child(1)';
		await expectMatchesKit(
			page,
			'ReleaseSummary',
			[
				['.qk-release:nth-child(1)', pv],
				['.qk-release:nth-child(1) .qk-eyebrow', `${pv} p`],
				['.qk-release:nth-child(1) .qk-release__v', `${pv} h3`],
				['.qk-release:nth-child(1) .qk-status', `${pv} > div:first-child > span`],
				['.qk-release:nth-child(2) .qk-status', 'css:section:nth-child(2) > div:first-child > span'],
				['.qk-release:nth-child(1) .qk-release__count', `${pv} > div:nth-child(2)`],
				['.qk-release:nth-child(1) .qk-release__count b', `${pv} b`],
				['.qk-release:nth-child(1) .qk-diff--mod', `${pv} > div:nth-child(3) > span:nth-child(2)`],
				['.qk-release:nth-child(1) .qk-release__meta', `${pv} dl`],
				['.qk-release:nth-child(1) .qk-release__meta dt', `${pv} dt`],
				['.qk-release:nth-child(1) .qk-release__actions', `${pv} > div:last-child`]
			],
			TEXT
		);
		const preview = page.getByRole('region', { name: 'Dataset v2026.08.3' });
		await expect(preview).toContainText('2.8 MB');
		await expect(preview).toContainText('9f3c2a…7e1b');
		await expect(preview.getByRole('button', { name: 'Publish' })).toBeEnabled();
		const published = page.getByRole('region', { name: 'Dataset v2026.08.2' });
		await expect(published).toContainText('2026-08-18');
		await expect(published.getByRole('button')).toHaveCount(0);
	});

	test('ReviewDecision matches the kit, and the note goes with the decision', async ({ page }) => {
		await expectMatchesKit(
			page,
			'ReviewDecision',
			[
				['.qk-decide', 'css:section'],
				['.qk-decide .qk-eyebrow', 'css:section > p:first-child'],
				['.qk-decide__q', 'css:section > p:nth-child(2)'],
				['.qk-decide__btns', 'css:section > div:last-child'],
				['.qk-decide__btns .qk-btn--quiet', 'css:section > div:last-child > button:last-child']
			],
			TEXT
		);
		// The control's edge is --input, not the kit's hairline (QOT-11: 3:1 contrast).
		await expectMatchesKit(
			page,
			'ReviewDecision',
			[['.qk-decide textarea', 'css:textarea']],
			TEXT.filter((p) => !p.startsWith('border-') || p.endsWith('width'))
		);
		const note = page.getByRole('textbox', { name: 'Note' });
		await note.fill('Checked EWD 498 in the archive.');
		await expect(page.getByRole('button', { name: 'Verify' })).toBeEnabled();
		await page.keyboard.press('Tab');
		await expect(page.getByRole('button', { name: 'Verify' })).toBeFocused();
	});

	test('MatchCompare matches the kit: head, both columns and actions', async ({ page }) => {
		await expectMatchesKit(
			page,
			'MatchCompare',
			[
				['.qk-match', 'css:section'],
				['.qk-match__head .qk-status', 'css:section > div:first-child > span:first-child'],
				['.qk-match__method', 'css:section > div:first-child > span:last-child'],
				['.qk-match__cols', 'css:section > div:nth-child(2)'],
				['.qk-match__cols > div:first-child', 'css:section > div:nth-child(2) > div:first-child'],
				['.qk-match__label', 'css:section > div:nth-child(2) > div:first-child > div'],
				['.qk-match__text', 'css:section > div:nth-child(2) > div:first-child > p'],
				['.qk-match__btns .qk-btn--sm', 'css:section > div:last-child > button:first-child']
			],
			TEXT
		);
		await expect(page.getByRole('region', { name: 'Possible match' })).toContainText('fuzzy text match · 91% similar');
	});
});
