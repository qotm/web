import { VISUAL, expectMatchesKit } from './kit';
import { test } from './fixtures';

const TEXT = [...VISUAL, 'line-height', 'text-transform', 'padding-bottom', 'padding-right', 'margin-bottom'] as const;

/** QOT-69: SiteHeader and SiteFooter against qotm_kit. */
test.describe('kit: site chrome', () => {
	test('SiteHeader matches the kit: bar, brand, nav, active link and actions', async ({ page }) => {
		const signedIn = 'css:header:first-of-type';
		await expectMatchesKit(
			page,
			'SiteHeader',
			[
				['.qk-header:first-of-type', signedIn],
				['.qk-header:first-of-type .qk-header__in', `${signedIn} > div`],
				['.qk-header:first-of-type .qk-header__brand', `${signedIn} > div > a`],
				['.qk-header:first-of-type .qk-header__brand b', `${signedIn} > div > a b`],
				['.qk-header:first-of-type .qk-header__nav', `${signedIn} nav`],
				['.qk-header:first-of-type .qk-navlink.is-active', `${signedIn} nav [aria-current="page"]`],
				['.qk-header:first-of-type .qk-navlink:not(.is-active)', `${signedIn} nav a:not([aria-current])`],
				['.qk-header:last-of-type .qk-header__in', 'css:header:last-of-type > div']
			],
			TEXT
		);
	});

	test('SiteFooter matches the kit: brand, columns, links and note', async ({ page }) => {
		await expectMatchesKit(
			page,
			'SiteFooter',
			[
				['.qk-footer', 'css:footer'],
				['.qk-footer__in', 'css:footer > div'],
				['.qk-footer__brand b', 'css:footer b'],
				['.qk-footer__brand p', 'css:footer p'],
				['.qk-footer__col h4', 'css:footer h4'],
				['.qk-footer__col a', 'css:footer h4 + a'],
				['.qk-footer__note', 'css:footer > div > div:last-child']
			],
			TEXT
		);
	});
});
