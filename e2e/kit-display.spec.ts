import { VISUAL, expectMatchesKit } from './kit';
import { expect, test } from './fixtures';

const TEXT = [...VISUAL, 'line-height', 'text-transform', 'border-top-style', 'text-decoration-line'] as const;

const STATUSES = [
	'SUBMITTED',
	'UNDER_REVIEW',
	'NEEDS_EVIDENCE',
	'REJECTED',
	'VERIFIED',
	'CURATION_REVIEW',
	'CURATED',
	'DATASET_RELEASE',
	'ORIGINALITY_CHECK',
	'PUBLISHED',
	'COMMUNITY_DISCOVERY',
	'CURATION_CANDIDATE',
	'DISPUTED',
	'WITHDRAWN',
	'CANONICAL',
	'ORIGINAL',
	'PRIVATE',
	'PUBLIC',
	'PERSONAL',
	'COMMUNITY',
	'MEMBER',
	'VERIFIER',
	'MODERATOR',
	'ADMIN'
];

const GLYPHLESS = [
	'CANONICAL',
	'ORIGINAL',
	'PUBLIC',
	'PERSONAL',
	'COMMUNITY',
	'MEMBER',
	'VERIFIER',
	'MODERATOR',
	'ADMIN'
];

/** QOT-62: Badge, StatusBadge, Eyebrow, Divider, Avatar, TopicTag and Logo against qotm_kit. */
test.describe('kit: display', () => {
	test('Badge matches the kit in every tone', async ({ page }) => {
		await expectMatchesKit(
			page,
			'Badge',
			[
				['.qk-badge--neutral:not(.qk-badge--upper)', 'neutral'],
				['.qk-badge--clay', 'clay'],
				['.qk-badge--ink', 'ink'],
				['.qk-badge--upper', 'upper'],
				['.qk-badge--dark', 'dark']
			],
			TEXT
		);
	});

	// The kit's preview has no glyph font, so ✓ ❯ ○ fall back to a system font
	// there; ours sets them in the qotm glyphs font. Badges with a glyph are
	// compared without their width, and the glyphs on their own type.
	test('StatusBadge matches the kit for every state, type and role', async ({ page }) => {
		const pair = (s: string): [string, string] => [`[data-status="${s}"]`, `css:[data-status="${s}"]`];
		await expectMatchesKit(page, 'StatusBadge', STATUSES.filter((s) => GLYPHLESS.includes(s)).map(pair), TEXT);
		await expectMatchesKit(
			page,
			'StatusBadge',
			[
				...STATUSES.filter((s) => !GLYPHLESS.includes(s)).map(pair),
				...['VERIFIED', 'CURATED', 'REJECTED', 'SUBMITTED', 'NEEDS_EVIDENCE'].map((s): [string, string] => [
					`[data-status="${s}"] .qk-status__glyph`,
					`css:[data-status="${s}"] [data-glyph]`
				])
			],
			TEXT.filter((p) => p !== 'width' && p !== 'border-top-style')
		);
	});

	test('StatusBadge words carry the meaning; the glyph is hidden', async ({ page }) => {
		await page.goto('/_kit?only=StatusBadge');
		const verified = page.locator('[data-status="VERIFIED"]');
		await expect(verified).toHaveText(/verified/);
		await expect(verified.locator('[aria-hidden="true"]')).toHaveText(/✓/);
		await expect(page.locator('[data-status="DATASET_RELEASE"]')).toContainText('in release');
	});

	test('Eyebrow matches the kit, muted and clay', async ({ page }) => {
		await expectMatchesKit(
			page,
			'Eyebrow',
			[
				['.qk-eyebrow--muted', 'muted'],
				['.qk-eyebrow--clay', 'clay']
			],
			[...TEXT.filter((p) => p !== 'width' && p !== 'border-top-style'), 'margin-bottom']
		);
	});

	test('Divider matches the kit: rule, graphic and mark', async ({ page }) => {
		await expectMatchesKit(
			page,
			'Divider',
			[
				['hr.qk-divider', 'css:hr'],
				['.qk-divider-img', 'css:img:nth-of-type(1)'],
				['.qk-divider-mark', 'css:img:nth-of-type(2)']
			],
			['border-top-color', 'border-top-width', 'margin-top', 'margin-left', 'width', 'height']
		);
		await expect(page.locator('img[alt=""]')).toHaveCount(2);
	});

	test('Avatar matches the kit at every size, with lower-case initials', async ({ page }) => {
		await expectMatchesKit(
			page,
			'Avatar',
			[1, 2, 3, 4].map((n): [string, string] => [`.qk-avatar:nth-child(${n})`, `css:[role="img"]:nth-child(${n})`]),
			[...VISUAL, 'line-height']
		);
		const avatars = page.getByRole('img');
		await expect(avatars).toHaveText(['am', 'ko', 'ml', 'ad']);
		await expect(page.getByRole('img', { name: 'Ada Mensah' })).toBeVisible();
	});

	test('TopicTag matches the kit and links to its topic', async ({ page }) => {
		await expectMatchesKit(
			page,
			'TopicTag',
			[
				['.qk-topic:not(.is-on)', 'css:a:not([data-selected])'],
				['.qk-topic.is-on', 'css:a[data-selected]']
			],
			TEXT
		);
		await expect(page.getByRole('link', { name: 'software design' })).toHaveAttribute(
			'href',
			'/topics/software-design'
		);
		await expect(page.getByRole('link', { name: 'unix' })).toHaveAttribute('aria-current', 'page');
		await page.getByRole('link', { name: 'simplicity' }).focus();
		await expect
			.poll(() => page.getByRole('link', { name: 'simplicity' }).evaluate((el) => getComputedStyle(el).outlineStyle))
			.toBe('solid');
	});

	test('Logo matches the kit: every lockup and reversed', async ({ page }) => {
		const lockups = [1, 2, 3, 4].map((n): [string, string] => [
			`.qk-pv-row:first-child .qk-logo:nth-child(${n})`,
			`css:div:first-child > img:nth-child(${n})`
		]);
		await expectMatchesKit(
			page,
			'Logo',
			[...lockups, ['.qk-pv-row:last-child .qk-logo:nth-child(2)', 'css:div:last-child > img:nth-child(2)']],
			['width', 'height', 'display']
		);
		const logos = page.getByRole('img', { name: 'qotm' });
		await expect(logos).toHaveCount(6);
		for (const src of await logos.evaluateAll((els) => els.map((el) => (el as HTMLImageElement).naturalWidth)))
			expect(src).toBeGreaterThan(0);
	});
});
