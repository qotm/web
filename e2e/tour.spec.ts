import fs from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';
import { expect, signIn, sql, test } from './fixtures';

/**
 * A guided tour of the review flows, one quote from submission to a published
 * release, screenshotted step by step: `TOUR=1 yarn test:e2e e2e/tour.spec.ts`
 * with a worker running against the test stack (releases and the originality
 * check are worker jobs). Off in the normal run. Saved to
 * e2e/.screenshots/tour/NN-<name>.png.
 */
const OUT = path.join(import.meta.dirname, '.screenshots', 'tour');
let n = 0;

async function shot(page: Page, name: string, full = false) {
	await page.waitForLoadState('networkidle');
	await page.screenshot({ path: path.join(OUT, `${String(++n).padStart(2, '0')}-${name}.png`), fullPage: full });
}

/** Polls the test database until `query` returns `want` (the worker's jobs finish in their own time). */
async function until(query: string, want: (v: string) => boolean, timeout = 90_000) {
	const end = Date.now() + timeout;
	for (;;) {
		const v = sql(query);
		if (want(v)) return v;
		if (Date.now() > end) throw new Error(`Timed out on ${query}: ${v}`);
		await new Promise((r) => setTimeout(r, 1000));
	}
}

const TEXT = 'Science is what we understand well enough to explain to a computer; art is everything else.';
const FIXED = 'Science is what we understand well enough to explain to a computer. Art is everything else we do.';
const ORIGINAL = 'A flaky test is a question you keep refusing to answer.';

test.describe('tour', () => {
	test.skip(!process.env.TOUR, 'set TOUR=1 to take the tour');
	test.describe.configure({ mode: 'serial' });
	test.setTimeout(600_000);
	test.use({ actionTimeout: 15_000 });

	test('one quote, submission to release', async ({ browser }) => {
		fs.rmSync(OUT, { recursive: true, force: true });
		fs.mkdirSync(OUT, { recursive: true });
		const member = await browser.newPage({ viewport: { width: 1440, height: 900 } });
		const staff = await browser.newPage({ viewport: { width: 1440, height: 900 } });
		await signIn(member, 'member');
		await signIn(staff, 'admin');

		// 1. The console.
		await staff.goto('/admin');
		await expect(staff.getByRole('heading', { level: 1 })).toBeVisible();
		await shot(staff, 'dashboard', true);

		// 2. A member submits a canonical quote, with a slip in the wording and the author's name as they know it.
		await member.goto('/submit');
		await member.locator('#text').fill(TEXT);
		await member.locator('#attribution').fill('Donald Knuth');
		await member.locator('#source').fill('Foreword to A = B (Petkovšek, Wilf, Zeilberger)');
		await member.locator('#year').fill('1996');
		await member.getByRole('button', { name: 'programming', exact: true }).click();
		await expect(member.getByText('Donald Knuth stays the author.')).toBeVisible();
		await shot(member, 'member-submits-canonical', true);
		await member.getByRole('button', { name: 'Submit for review' }).click();
		await expect(member).toHaveURL(/my-quotes/);
		const id = `q_${sql(`select public_id from quotes where text = '${TEXT}'`).replace(/^q_/, '')}`;
		await shot(member, 'member-my-quotes-in-review');

		// 3. Canonical quotes go straight to a verifier: originality holds take originals only.
		await staff.goto('/admin/submissions');
		await expect(staff.getByRole('link', { name: new RegExp(`^Review ${id}`) })).toHaveCount(0);

		// 4. Verification: the author is not linked yet, so it cannot be verified. Ask for evidence first.
		await staff.goto(`/admin/verification?id=${id}`);
		await expect(staff.getByText('Link the author before verifying.')).toBeVisible();
		await shot(staff, 'verification-queue', true);
		const decision = staff.getByRole('region', { name: 'Verification decision' });
		await decision.getByLabel('Note').fill('Where in A = B? A page number, or a scan of the foreword, would do.');
		await decision.getByRole('button', { name: 'Needs evidence' }).click();
		await expect(staff.getByText(`Evidence requested for ${id}.`)).toBeVisible();
		await shot(staff, 'verification-evidence-requested');

		// 5. The member sees the request, and answers it.
		await member.goto('/my-quotes?tab=review');
		const mine = member.getByRole('article', { name: TEXT });
		await expect(mine).toContainText('Where in A = B?');
		await shot(member, 'member-evidence-requested');
		await mine.getByRole('button', { name: 'Add evidence' }).click();
		const evidence = member.getByRole('dialog', { name: 'Add evidence' });
		await evidence
			.getByLabel(/What you found/)
			.fill(
				'The foreword, page vii: “Science is what we understand well enough to explain to a computer. Art is everything else we do.”'
			);
		await shot(member, 'member-adds-evidence');
		await evidence.getByRole('button', { name: 'Send to the verifier' }).click();
		await expect(member.getByText('Sent to the verifier.')).toBeVisible();

		// 6. Back with the verifier: link the author and fix the wording to the source, then verify.
		await staff.goto(`/admin/verification?id=${id}`);
		await expect(staff.getByText('page vii')).toBeVisible();
		await shot(staff, 'verification-evidence-arrived', true);
		await staff.getByRole('button', { name: 'Link author' }).click();
		const correct = staff.getByRole('dialog', { name: 'Correct before verifying' });
		await correct.getByLabel('Author').fill('Knuth');
		await correct.getByRole('option', { name: /Knuth/ }).click();
		await correct.getByLabel('Quote').fill(FIXED);
		await correct.getByLabel('Note').fill('Linked to Knuth; wording matched to the foreword, p. vii.');
		await shot(staff, 'verification-correct-and-link');
		await correct.getByRole('button', { name: 'Save correction' }).click();
		await expect(staff.getByText('Corrected.')).toBeVisible();
		await staff.getByRole('region', { name: 'Verification decision' }).getByRole('button', { name: 'Verify' }).click();
		await expect(staff.getByText(`${id} verified.`)).toBeVisible();
		await shot(staff, 'verification-verified');

		// 7. Public now, with its history.
		await member.goto(`/q/${id.replace(/^q_/, '')}`);
		await expect(member.locator('blockquote').first()).toContainText(FIXED);
		await shot(member, 'quote-page-verified', true);

		// 8. Someone reports it. An open report blocks curation.
		await member.getByRole('button', { name: /report a problem/ }).click();
		const report = member.getByRole('dialog', { name: 'Report this quote' });
		await report.getByLabel('Details').fill('Is this Knuth? I have seen it credited to others.');
		await shot(member, 'member-reports');
		await report.getByRole('button', { name: 'Send report' }).click();
		await expect(member.getByText(/Report sent/)).toBeVisible();
		const ref = `r_${sql(`select lpad(number::text, 4, '0') from reports order by created_at desc limit 1`)}`;

		await staff.goto(`/admin/curation?id=${id}`);
		await expect(staff.getByLabel(`Candidate ${id}`)).toBeVisible();
		for (const box of await staff.getByRole('group', { name: 'Curation checklist' }).getByRole('checkbox').all())
			await box.check();
		await staff.getByRole('region', { name: 'Curation decision' }).getByRole('button', { name: 'Curate' }).click();
		await expect(staff.getByText('Resolve the open reports first')).toBeVisible();
		await shot(staff, 'curation-blocked-by-report', true);

		// 9. Reports: a moderator marks it disputed while they look, then clears it.
		await staff.goto(`/admin/reports?id=${ref}`);
		await expect(staff.getByLabel(`Report ${ref}`)).toBeVisible();
		await shot(staff, 'reports-open', true);
		const mod = staff.getByRole('region', { name: 'Moderation decision' });
		await mod.getByLabel('Note').fill('Checking the attribution against the foreword.');
		await mod.getByRole('button', { name: 'Mark disputed' }).click();
		await expect(staff.getByText(`${id} marked disputed`)).toBeVisible();
		await member.goto(`/q/${id.replace(/^q_/, '')}`);
		await shot(member, 'quote-page-disputed');
		await staff.goto(`/admin/reports?id=${ref}`);
		await staff
			.getByRole('region', { name: 'Moderation decision' })
			.getByLabel('Note')
			.fill('The foreword is his; the source is on the quote.');
		await staff
			.getByRole('region', { name: 'Moderation decision' })
			.getByRole('button', { name: 'Dismiss report' })
			.click();
		await expect(staff.getByText(`${ref} dismissed.`)).toBeVisible();
		await shot(staff, 'reports-dismissed');

		// 10. Curation, for real this time.
		await staff.goto(`/admin/curation?id=${id}`);
		await expect(staff.getByLabel(`Candidate ${id}`)).toBeVisible();
		for (const box of await staff.getByRole('group', { name: 'Curation checklist' }).getByRole('checkbox').all())
			await box.check();
		await shot(staff, 'curation-checklist', true);
		await staff.getByRole('region', { name: 'Curation decision' }).getByRole('button', { name: 'Curate' }).click();
		await expect(staff.getByText(`${id} curated.`)).toBeVisible();

		// 11. Releases: build a preview with it, then publish.
		const version = sql(`select version from releases where state <> 'PUBLISHED' order by version desc limit 1`);
		const before = sql(
			`select coalesce(sha256, '') || coalesce(preview_built_at::text, '') from releases where version = '${version}'`
		);
		await staff.goto('/admin/releases');
		await shot(staff, 'releases-before', true);
		const summary = staff.getByRole('region', { name: `Dataset ${version}` });
		await summary.getByRole('button', { name: 'Build preview' }).click();
		await expect(staff.getByText(`Building a preview of ${version}.`)).toBeVisible();
		await shot(staff, 'releases-building');
		await until(
			`select coalesce(sha256, '') || coalesce(preview_built_at::text, '') from releases where version = '${version}'`,
			(v) => v !== before && v !== ''
		);
		await staff.reload();
		await shot(staff, 'releases-preview-built', true);
		await summary.getByRole('button', { name: 'Publish' }).click();
		const publish = staff.getByRole('dialog', { name: `Publish ${version}?` });
		await publish.getByRole('checkbox', { name: 'I reviewed the preview build.' }).check();
		await shot(staff, 'releases-publish-confirm');
		await publish.getByRole('button', { name: 'Publish release' }).click();
		await until(`select state from releases where version = '${version}'`, (v) => v === 'PUBLISHED');
		await staff.reload();
		await shot(staff, 'releases-published', true);

		// 12. The quote is in the release: its page, and the curated feed.
		await member.goto(`/q/${id.replace(/^q_/, '')}`);
		await shot(member, 'quote-page-in-release', true);
		await member.goto('/curated');
		await shot(member, 'curated-feed');

		// 13. An original: the originality check publishes a clean one on its own.
		await member.goto('/submit');
		await member.getByRole('radio', { name: /My own original/ }).check();
		await member.locator('#text').fill(ORIGINAL);
		await member.getByRole('button', { name: 'debugging', exact: true }).click();
		await member.getByRole('checkbox', { name: /I wrote this quote/ }).check();
		await expect(member.getByText('Originality check: no known matching attribution found.')).toBeVisible();
		await shot(member, 'member-submits-original', true);
		await member.getByRole('button', { name: 'Publish to the community' }).click();
		await expect(member.getByText(/Checking it against the corpus|Published to the community/)).toBeVisible();
		await until(
			`select status from quotes where text = '${ORIGINAL}'`,
			(v) => v !== 'SUBMITTED' && v !== 'ORIGINALITY_CHECK',
			60_000
		).catch(() => undefined);
		await member.reload();
		await shot(member, 'original-published', true);

		// 14. An original that resembles an existing quote waits for a moderator.
		await staff.goto('/admin/submissions');
		await staff
			.getByRole('list', { name: 'Originality holds' })
			.getByRole('link', { name: /^Review / })
			.first()
			.click();
		await expect(staff.getByRole('region', { name: 'Moderation decision' })).toBeVisible();
		await shot(staff, 'submissions-held-original', true);

		// 15. Everything above, in the audit log; and who holds which role.
		await staff.goto('/admin/audit');
		await shot(staff, 'audit-log', true);
		await staff.goto('/admin/users');
		await shot(staff, 'users-roles');
		await staff.goto('/admin');
		await shot(staff, 'dashboard-after', true);
	});
});
