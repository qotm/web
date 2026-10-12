// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { AuthorEntity, QuoteEntity, TopicEntity } from '../src/shared/types/api/types.gen.ts';
import { authorTags, escapeHtml, inject, noindex, quoteTags, renderTags, topicTags } from './meta.ts';

const SITE = 'https://qotm.site';
const API = 'https://api.qotm.site';

const knuth = {
	id: 'q_5k0q2j',
	text: 'Premature optimization is the root of all evil.',
	type: 'canonical',
	status: 'CURATED',
	author: { slug: 'knuth', name: 'Donald E. Knuth' },
	attribution: null
} as unknown as QuoteEntity;

const INDEX = `<!doctype html><html><head>
		<meta
			name="description"
			content="qotm: one considered programming quote."
		/>
		<title>qotm</title>
	</head><body><div id="root"></div></body></html>`;

describe('page tags', () => {
	it('words a quote as its page does, with the share card as og:image', () => {
		expect(quoteTags(knuth, SITE, API)).toEqual({
			title: 'Premature optimization is the root of all evil. · qotm',
			description:
				'“Premature optimization is the root of all evil.” — Donald E. Knuth. Source and provenance on qotm.',
			canonical: 'https://qotm.site/q/5k0q2j',
			type: 'article',
			image: {
				url: 'https://api.qotm.site/v1/quotes/q_5k0q2j/og.png',
				width: 1200,
				height: 630,
				alt: '“Premature optimization is the root of all evil.” — Donald E. Knuth'
			},
			noindex: false
		});
	});

	it('shortens a long quote’s title, credits an original to no one, and keeps a withdrawn one out', () => {
		const long = {
			...knuth,
			text: 'x'.repeat(80),
			type: 'original',
			status: 'WITHDRAWN',
			author: null
		} as unknown as QuoteEntity;
		const tags = quoteTags(long, SITE, API);
		expect(tags.title).toBe(`${'x'.repeat(57)}… · qotm`);
		expect(tags.description).toBe(`“${'x'.repeat(80)}” Declared original on qotm.`);
		expect(tags.image?.alt).toBe(`“${'x'.repeat(80)}”`);
		expect(tags.noindex).toBe(true);
	});

	it('words authors and topics', () => {
		const a = { slug: 'knuth', name: 'Donald E. Knuth', line: '1938–' } as AuthorEntity;
		expect(authorTags(a, SITE)).toMatchObject({
			title: 'Donald E. Knuth · qotm',
			description: 'Quotes by Donald E. Knuth (1938–), each with its source, on qotm.',
			canonical: 'https://qotm.site/authors/knuth',
			type: 'profile'
		});
		expect(authorTags({ ...a, line: '—' }, SITE).description).toBe(
			'Quotes by Donald E. Knuth, each with its source, on qotm.'
		);
		const t = {
			slug: 'debugging',
			name: 'debugging',
			description: null,
			counts: { quotes: 12, curated: 4 }
		} as TopicEntity;
		expect(topicTags(t, SITE)).toMatchObject({
			title: 'Debugging · qotm',
			description: 'Programming quotes about debugging on qotm: 12 quotes, 4 curated.',
			canonical: 'https://qotm.site/topics/debugging'
		});
	});

	it('escapes what goes into attributes', () => {
		expect(escapeHtml(`"<a href='x'>&</a>"`)).toBe('&quot;&lt;a href=&#39;x&#39;&gt;&amp;&lt;/a&gt;&quot;');
		const tags = quoteTags({ ...knuth, text: 'Use <b> & "quotes"' } as QuoteEntity, SITE, API);
		expect(renderTags(tags)).toContain('content="“Use &lt;b&gt; &amp; &quot;quotes&quot;” — Donald E. Knuth');
		expect(renderTags(tags)).not.toContain('<b>');
	});

	it('replaces the title and description in index.html and adds the rest to the head', () => {
		const html = inject(INDEX, quoteTags(knuth, SITE, API));
		expect(html).toContain('<title>Premature optimization is the root of all evil. · qotm</title>');
		expect(html.match(/<title>/g)).toHaveLength(1);
		expect(html.match(/name="description"/g)).toHaveLength(1);
		expect(html).toContain('<meta name="description" content="“Premature optimization');
		expect(html).toContain('<meta property="og:image" content="https://api.qotm.site/v1/quotes/q_5k0q2j/og.png" />');
		expect(html.indexOf('og:image')).toBeLessThan(html.indexOf('</head>'));
		expect(noindex(INDEX)).toContain('<meta name="robots" content="noindex" />');
	});
});
