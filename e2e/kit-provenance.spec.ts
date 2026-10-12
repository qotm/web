import { VISUAL, expectMatchesKit } from './kit';
import { expect, test } from './fixtures';

const TEXT = [...VISUAL, 'line-height', 'text-transform', 'margin-top', 'margin-bottom', 'padding-bottom'] as const;

/** QOT-66: ProvenancePanel and LifecycleSteps against qotm_kit. */
test.describe('kit: provenance', () => {
	test('ProvenancePanel matches the kit: canonical and declared original', async ({ page }) => {
		await expectMatchesKit(
			page,
			'ProvenancePanel',
			[
				['.qk-prov:nth-child(1)', 'css:section[aria-label="Provenance"]'],
				['.qk-prov:nth-child(1) .qk-prov__head', 'css:section[aria-label="Provenance"] > div:first-child'],
				['.qk-prov:nth-child(1) .qk-card__label', 'css:section[aria-label="Provenance"] h4'],
				[
					'.qk-prov:nth-child(1) > dl > .qk-prov__row:nth-child(1)',
					'css:section[aria-label="Provenance"] > dl > div:nth-child(1)'
				],
				[
					'.qk-prov:nth-child(1) > dl > .qk-prov__row:nth-child(2)',
					'css:section[aria-label="Provenance"] > dl > div:nth-child(2)'
				],
				[
					'.qk-prov:nth-child(1) > dl > .qk-prov__row:nth-child(1) dt',
					'css:section[aria-label="Provenance"] > dl > div:nth-child(1) dt'
				],
				[
					'.qk-prov:nth-child(1) > dl > .qk-prov__row:nth-child(1) a',
					'css:section[aria-label="Provenance"] > dl > div:nth-child(1) a'
				],
				['.qk-prov:nth-child(1) .qk-prov__credit', 'css:section[aria-label="Provenance"] > div:last-child'],
				['.qk-prov:nth-child(1) .qk-prov__credit dd', 'css:section[aria-label="Provenance"] > div:last-child dd'],
				['.qk-prov:nth-child(2)', 'css:section[aria-label="Provenance"]:nth-child(2)']
			],
			TEXT
		);
		const [canonical, original] = await page.getByRole('region', { name: 'Provenance' }).all();
		await expect(canonical.getByRole('link', { name: 'Edsger W. Dijkstra' })).toHaveAttribute(
			'href',
			'/authors/dijkstra'
		);
		await expect(canonical.getByRole('link', { name: /EWD 498: How do we tell/ })).toHaveAttribute(
			'href',
			'https://www.cs.utexas.edu/~EWD/transcriptions/EWD04xx/EWD498.html'
		);
		await expect(canonical).toContainText('2026-08-02');
		await expect(canonical).toContainText('v2026.08.1 · v2026.08.3');
		await expect(original).toContainText('Declared original by @ada');
		await expect(original).toContainText('No known matching attribution found.');
		await expect(original.getByText('Submitted by')).toHaveCount(0);
	});

	test('LifecycleSteps matches the kit: done, current, todo and an outcome', async ({ page }) => {
		const ol = (n: number) => `css:ol:nth-of-type(${n})`;
		await expectMatchesKit(
			page,
			'LifecycleSteps',
			[
				['.qk-steps:nth-child(1)', ol(1)],
				['.qk-steps:nth-child(1) .qk-step.is-done', `${ol(1)} [data-state="done"]`],
				['.qk-steps:nth-child(1) .qk-step.is-done .qk-step__dot', `${ol(1)} [data-state="done"] > span:first-child`],
				[
					'.qk-steps:nth-child(1) .qk-step.is-current .qk-step__dot',
					`${ol(1)} [data-state="current"] > span:first-child`
				],
				['.qk-steps:nth-child(1) .qk-step.is-todo .qk-step__dot', `${ol(1)} [data-state="todo"] > span:first-child`],
				[
					'.qk-steps:nth-child(1) .qk-step.is-done .qk-step__label',
					`${ol(1)} [data-state="done"] > span:last-child > span:first-child`
				],
				[
					'.qk-steps:nth-child(1) .qk-step.is-todo .qk-step__label',
					`${ol(1)} [data-state="todo"] > span:last-child > span:first-child`
				],
				['.qk-steps:nth-child(1) .qk-step__date', `${ol(1)} [data-state="done"] > span:last-child > span:last-child`],
				['.qk-steps:nth-child(2) .qk-step.is-off .qk-step__dot', `${ol(2)} [data-state="off"] > span:first-child`],
				['.qk-step__out', `${ol(2)} [data-state="off"] > span:last-child > span:nth-child(2)`],
				['.qk-steps:nth-child(3)', ol(3)]
			],
			TEXT
		);
		// The connecting rules: ink after a done step, hairline after the rest.
		const before = (sel: string) =>
			page
				.locator(sel)
				.first()
				.evaluate((el) => getComputedStyle(el, '::before').backgroundColor);
		expect(await before('ol:nth-of-type(1) [data-state="done"]')).toBe('rgb(20, 18, 16)');
		expect(await before('ol:nth-of-type(1) [data-state="todo"]')).toBe('rgb(218, 215, 208)');
		const current = page.locator('ol').first().locator('[aria-current="step"]');
		await expect(current).toContainText('curation review');
		await expect(page.locator('ol').nth(1).locator('[aria-current="step"]')).toContainText('needs evidence');
		await expect(page.locator('ol').nth(2).getByRole('listitem')).toHaveCount(8);
	});
});
