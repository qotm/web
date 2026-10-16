// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type {
	AuthorEntity,
	ProfileEntity,
	QuoteCardEntity,
	QuoteEntity,
	TopicEntity
} from '../src/shared/types/api/types.gen.ts';
import {
	authorTags,
	escapeHtml,
	inject,
	noindex,
	profileTags,
	quoteTags,
	renderTags,
	staticTags,
	topicTags
} from './meta.ts';

const SITE = { origin: 'https://qotm.site' };

const knuth = {
	id: 'q_5k0q2j',
	text: 'Premature optimization is the root of all evil.',
	type: 'canonical',
	status: 'CURATED',
	author: { slug: 'knuth', name: 'Donald E. Knuth' },
	attribution: null,
	contributor: { handle: 'ada' },
	work: null,
	year: 1974,
	context: null,
	sourceUrl: null,
	source: { title: 'Structured Programming with go to Statements', kind: 'PAPER', year: 1974, url: null },
	topics: [{ slug: 'software-engineering', name: 'software engineering' }],
	publishedAt: '2026-09-24T09:30:00.000Z'
} as unknown as QuoteEntity;

const INDEX = `<!doctype html><html><head>
		<meta
			name="description"
			content="qotm: one considered programming quote."
		/>
		<title>qotm</title>
	</head><body><div id="root"></div></body></html>`;

/** The JSON-LD objects written into a page's head. */
const ld = (html: string) =>
	[...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) => JSON.parse(m[1]));

describe('page tags', () => {
	it('words a quote as its page does, with its card on this origin as og:image', () => {
		expect(quoteTags(knuth, SITE)).toMatchObject({
			title: 'Premature optimization is the root of all evil. · qotm',
			description:
				'“Premature optimization is the root of all evil.” — Donald E. Knuth. Source and provenance on qotm.',
			canonical: 'https://qotm.site/q/5k0q2j',
			type: 'article',
			image: {
				url: 'https://qotm.site/q/5k0q2j/og.png',
				width: 1200,
				height: 630,
				alt: '“Premature optimization is the root of all evil.” — Donald E. Knuth'
			},
			noindex: false
		});
	});

	it('makes the terminal card the og:image when the link asks for it', () => {
		const tags = quoteTags(knuth, SITE, 'terminal');
		expect(tags.image.url).toBe('https://qotm.site/q/5k0q2j/og.png?card=terminal');
		expect(tags.canonical).toBe('https://qotm.site/q/5k0q2j');
	});

	it('shortens a long quote’s title, credits an original to no one, and keeps a withdrawn one out', () => {
		const long = {
			...knuth,
			text: 'x'.repeat(80),
			type: 'original',
			status: 'WITHDRAWN',
			author: null
		} as unknown as QuoteEntity;
		const tags = quoteTags(long, SITE);
		expect(tags.title).toBe(`${'x'.repeat(57)}… · qotm`);
		expect(tags.description).toBe(`“${'x'.repeat(80)}” Declared original on qotm.`);
		expect(tags.image.alt).toBe(`“${'x'.repeat(80)}”`);
		expect(tags.noindex).toBe(true);
	});

	it.each(['UNDER_REVIEW', 'NEEDS_EVIDENCE', 'DISPUTED'] as const)(
		'keeps a %s quote out of search engines until it is checked',
		(status) => {
			expect(quoteTags({ ...knuth, status }, SITE).noindex).toBe(true);
		}
	);

	it('words authors and topics, each with its own card', () => {
		const a = { slug: 'knuth', name: 'Donald E. Knuth', line: '1938–', topics: [] } as unknown as AuthorEntity;
		expect(authorTags(a, [], SITE)).toMatchObject({
			title: 'Donald E. Knuth · qotm',
			description: 'Quotes by Donald E. Knuth (1938–), each with its source, on qotm.',
			canonical: 'https://qotm.site/authors/knuth',
			type: 'profile',
			image: { url: 'https://qotm.site/authors/knuth/og.png' }
		});
		expect(authorTags({ ...a, line: '—' }, [], SITE).description).toBe(
			'Quotes by Donald E. Knuth, each with its source, on qotm.'
		);
		const t = {
			slug: 'debugging',
			name: 'debugging',
			description: null,
			counts: { quotes: 1200, curated: 4 }
		} as TopicEntity;
		expect(topicTags(t, [], SITE)).toMatchObject({
			title: 'Debugging · qotm',
			description: 'Quotes on debugging, each with its source: 1,200 on qotm, 4 in the CLI dataset.',
			canonical: 'https://qotm.site/topics/debugging',
			image: { url: 'https://qotm.site/topics/debugging/og.png' }
		});
	});

	it('words a profile, the home page and the feeds, with the site card', () => {
		const p = { handle: 'ada', name: 'Ada', bio: null } as ProfileEntity;
		expect(profileTags(p, SITE)).toMatchObject({
			title: 'Ada (@ada) · qotm',
			description: '@ada’s quotes and contributions on qotm.',
			canonical: 'https://qotm.site/@ada',
			image: { url: 'https://qotm.site/og.png' }
		});
		expect(staticTags('/', SITE)).toMatchObject({
			title: 'qotm — a thought between commands',
			canonical: 'https://qotm.site',
			image: { url: 'https://qotm.site/og.png' }
		});
		expect(staticTags('/latest', SITE)?.title).toBe('Latest · qotm');
		const terms = staticTags('/terms', SITE)!;
		expect(terms.title).toBe('Terms of Service · qotm');
		expect(terms.body).toContain('<section id="your-content"><h2>Who owns what you submit</h2>');
		expect(staticTags('/privacy', SITE)?.body).toContain('<a href="mailto:privacy@qotm.dev">privacy@qotm.dev</a>');
		expect(staticTags('/search', SITE)?.noindex).toBe(true);
		expect(staticTags('/settings', SITE)).toBeNull();
	});

	it('escapes what goes into attributes', () => {
		expect(escapeHtml(`"<a href='x'>&</a>"`)).toBe('&quot;&lt;a href=&#39;x&#39;&gt;&amp;&lt;/a&gt;&quot;');
		const tags = quoteTags({ ...knuth, text: 'Use <b> & "quotes"' } as QuoteEntity, SITE);
		expect(renderTags(tags)).toContain('content="“Use &lt;b&gt; &amp; &quot;quotes&quot;” — Donald E. Knuth');
		expect(renderTags(tags)).not.toContain('<b>');
	});

	it('replaces the title and description in index.html and adds the rest to the head', () => {
		const html = inject(INDEX, quoteTags(knuth, SITE));
		expect(html).toContain('<title>Premature optimization is the root of all evil. · qotm</title>');
		expect(html.match(/<title>/g)).toHaveLength(1);
		expect(html.match(/name="description"/g)).toHaveLength(1);
		expect(html).toContain('<meta name="description" content="“Premature optimization');
		expect(html).toContain('<meta property="og:image" content="https://qotm.site/q/5k0q2j/og.png" />');
		expect(html).toContain('<meta property="og:image:type" content="image/png" />');
		expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />');
		expect(html.indexOf('og:image')).toBeLessThan(html.indexOf('</head>'));
		expect(noindex(INDEX)).toContain('<meta name="robots" content="noindex" />');
	});
});

describe('structured data', () => {
	it('describes a quote as a Quotation by its author, from its source', () => {
		const [quotation, crumbs] = ld(inject(INDEX, quoteTags(knuth, SITE)));
		expect(quotation).toMatchObject({
			'@context': 'https://schema.org',
			'@type': 'Quotation',
			url: 'https://qotm.site/q/5k0q2j',
			text: 'Premature optimization is the root of all evil.',
			creator: { '@type': 'Person', name: 'Donald E. Knuth', url: 'https://qotm.site/authors/knuth' },
			isBasedOn: {
				'@type': 'ScholarlyArticle',
				name: 'Structured Programming with go to Statements',
				datePublished: '1974'
			},
			datePublished: '2026-09-24T09:30:00.000Z',
			keywords: 'software engineering',
			publisher: { '@type': 'Organization', name: 'qotm' }
		});
		expect(JSON.stringify(quotation)).not.toContain('null');
		expect(crumbs.itemListElement.map((i: { item: string }) => i.item)).toEqual([
			'https://qotm.site/',
			'https://qotm.site/authors/knuth',
			'https://qotm.site/q/5k0q2j'
		]);
	});

	it('credits an original to its member', () => {
		const original = { ...knuth, type: 'original', author: null, source: null } as unknown as QuoteEntity;
		expect(ld(inject(INDEX, quoteTags(original, SITE)))[0].creator).toEqual({
			'@type': 'Person',
			name: '@ada',
			url: 'https://qotm.site/@ada'
		});
	});

	it('links an author to their Wikidata item', () => {
		const a = {
			slug: 'dijkstra',
			name: 'Edsger W. Dijkstra',
			bornYear: 1930,
			diedYear: 2002,
			description: 'computer scientist',
			wikidataId: 'Q8556',
			line: '1930–2002 · computer scientist',
			topics: []
		} as unknown as AuthorEntity;
		const [profile] = ld(inject(INDEX, authorTags(a, [], SITE)));
		expect(profile).toMatchObject({
			'@type': 'ProfilePage',
			mainEntity: {
				'@type': 'Person',
				name: 'Edsger W. Dijkstra',
				birthDate: '1930',
				deathDate: '2002',
				sameAs: ['https://www.wikidata.org/wiki/Q8556']
			}
		});
	});

	it('gives the home page the site and its search', () => {
		const [site, org] = ld(inject(INDEX, staticTags('/', SITE)!));
		expect(site).toMatchObject({
			'@type': 'WebSite',
			potentialAction: {
				'@type': 'SearchAction',
				target: { urlTemplate: 'https://qotm.site/search?q={search_term_string}' }
			}
		});
		expect(org).toMatchObject({ '@type': 'Organization', logo: 'https://qotm.site/icon-512.png' });
	});

	it('never lets a quote close the script element', () => {
		const html = inject(INDEX, quoteTags({ ...knuth, text: '</script><script>alert(1)</script>' }, SITE));
		const head = html.slice(0, html.indexOf('</head>'));
		expect(head.match(/<\/script>/g)).toHaveLength(2); // the two JSON-LD scripts' own
	});
});

describe('crawlable HTML', () => {
	const card = (id: string, text: string) =>
		({ ...knuth, id, text, type: 'canonical', topics: [] }) as unknown as QuoteCardEntity;

	it('writes the quote, its credit, source and topics into #root', () => {
		const html = inject(INDEX, quoteTags(knuth, SITE));
		const root = html.slice(html.indexOf('<div id="root">'));
		expect(root).toContain('<blockquote><p>Premature optimization is the root of all evil.</p></blockquote>');
		expect(root).toContain('<a href="/authors/knuth">Donald E. Knuth</a>');
		expect(root).toContain('<cite>Structured Programming with go to Statements</cite> (1974)');
		expect(root).toContain('<a href="/topics/software-engineering">software engineering</a>');
	});

	it('lists an author’s quotes, linked', () => {
		const a = { slug: 'knuth', name: 'Donald E. Knuth', line: '1938–', topics: [] } as unknown as AuthorEntity;
		const html = inject(INDEX, authorTags(a, [card('q_aaa111', 'One <thing>.')], SITE));
		expect(html).toContain('<h1>Donald E. Knuth</h1>');
		expect(html).toContain('<a href="/q/aaa111">One &lt;thing&gt;.</a>');
	});
});
