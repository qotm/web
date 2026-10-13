import { describe, expect, it } from 'vitest';
import { PRIVACY, TERMS } from './documents';
import { inline } from './inline';

describe('inline', () => {
	it('reads strong, code and links, and leaves the rest as text', () => {
		expect(inline('Run `qotm login`, see **Settings** or [the terms](/terms).')).toEqual([
			{ text: 'Run ' },
			{ code: 'qotm login' },
			{ text: ', see ' },
			{ strong: 'Settings' },
			{ text: ' or ' },
			{ link: 'the terms', href: '/terms' },
			{ text: '.' }
		]);
		expect(inline('plain')).toEqual([{ text: 'plain' }]);
	});
});

describe('the documents', () => {
	it('link only to their own anchors, each other, mail or https', () => {
		const anchors = new Set([...TERMS.sections, ...PRIVACY.sections].map((s) => s.id));
		const sources = [TERMS, PRIVACY].flatMap((d) => [
			...d.summary,
			...d.sections.flatMap((s) => s.blocks.flatMap((b) => (typeof b === 'string' ? [b] : b.list)))
		]);
		const hrefs = sources.flatMap((s) => inline(s).flatMap((p) => ('href' in p ? [p.href] : [])));
		expect(hrefs.length).toBeGreaterThan(5);
		for (const href of hrefs) {
			const [path, hash] = href.split('#');
			if (path === '' || path === '/terms' || path === '/privacy') {
				if (hash) expect(anchors, href).toContain(hash);
			} else expect(href).toMatch(/^(https:\/\/|mailto:)/);
		}
		// Nothing left unparsed.
		for (const s of sources) for (const p of inline(s)) if ('text' in p) expect(p.text, s).not.toMatch(/\*\*|\]\(|`/);
	});
});
