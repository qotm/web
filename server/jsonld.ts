import type { AuthorEntity, QuoteEntity } from '../src/shared/types/api/types.gen.ts';
import { paths } from '../src/lib/paths.ts';
import { BRAND } from '../src/shared/ui/meta/brand.ts';

/**
 * schema.org data for the pages crawlers read (Google's rich results, and
 * anything else that reads JSON-LD). Each builder returns one top-level
 * object; `renderTags` writes each in its own script element.
 */
export type JsonLd = Record<string, unknown>;

const CONTEXT = 'https://schema.org';

/** A source's kind as a schema.org type. */
const WORK_TYPE: Record<NonNullable<QuoteEntity['source']>['kind'], string> = {
	BOOK: 'Book',
	PAPER: 'ScholarlyArticle',
	MANUSCRIPT: 'Manuscript',
	LECTURE: 'CreativeWork',
	TALK: 'CreativeWork',
	POST: 'BlogPosting'
};

const organization = (origin: string): JsonLd => ({
	'@type': 'Organization',
	name: BRAND.name,
	url: `${origin}/`,
	logo: `${origin}/icon-512.png`
});

/** Drops undefined and null fields, so the data never says "null". */
const compact = (o: JsonLd): JsonLd => Object.fromEntries(Object.entries(o).filter(([, v]) => v != null));

/**
 * A quote page: a Quotation with its creator (the author's page, or the
 * member for an original), the work it is from and the topics it is about.
 */
export function quotation(q: QuoteEntity, origin: string): JsonLd {
	const url = `${origin}${paths.quote(q.id)}`;
	const creator =
		q.type === 'original'
			? q.contributor
				? {
						'@type': 'Person',
						name: `@${q.contributor.handle}`,
						url: `${origin}${paths.profile(q.contributor.handle)}`
					}
				: undefined
			: q.author
				? { '@type': 'Person', name: q.author.name, url: `${origin}${paths.author(q.author.slug)}` }
				: q.attribution
					? { '@type': 'Person', name: q.attribution }
					: undefined;
	const work = q.source
		? compact({
				'@type': WORK_TYPE[q.source.kind],
				name: q.source.title,
				datePublished: q.source.year ? String(q.source.year) : undefined,
				url: q.source.url ?? q.sourceUrl ?? undefined
			})
		: q.work
			? compact({
					'@type': 'CreativeWork',
					name: q.work,
					datePublished: q.year ? String(q.year) : undefined,
					url: q.sourceUrl ?? undefined
				})
			: undefined;
	return compact({
		'@context': CONTEXT,
		'@type': 'Quotation',
		'@id': url,
		url,
		text: q.text,
		inLanguage: 'en',
		creator,
		isBasedOn: work,
		dateCreated: q.year ? String(q.year) : undefined,
		datePublished: q.publishedAt ?? undefined,
		keywords: q.topics.length ? q.topics.map((t) => t.name).join(', ') : undefined,
		publisher: organization(origin)
	});
}

/** An author page: a ProfilePage about the Person, linked to their Wikidata item. */
export function author(a: AuthorEntity, origin: string): JsonLd {
	const url = `${origin}${paths.author(a.slug)}`;
	return {
		'@context': CONTEXT,
		'@type': 'ProfilePage',
		url,
		mainEntity: compact({
			'@type': 'Person',
			'@id': `${url}#person`,
			name: a.name,
			url,
			description: a.description ?? undefined,
			birthDate: a.bornYear ? String(a.bornYear) : undefined,
			deathDate: a.diedYear ? String(a.diedYear) : undefined,
			sameAs: a.wikidataId ? [`https://www.wikidata.org/wiki/${a.wikidataId}`] : undefined
		})
	};
}

/** Home › … › this page. */
export function breadcrumbs(origin: string, trail: { name: string; path: string }[]): JsonLd {
	return {
		'@context': CONTEXT,
		'@type': 'BreadcrumbList',
		itemListElement: [{ name: BRAND.name, path: paths.home }, ...trail].map((item, i) => ({
			'@type': 'ListItem',
			position: i + 1,
			name: item.name,
			item: `${origin}${item.path === paths.home ? '/' : item.path}`
		}))
	};
}

/** The home page: the site, its search, and who publishes it. */
export function website(origin: string): JsonLd[] {
	return [
		{
			'@context': CONTEXT,
			'@type': 'WebSite',
			name: BRAND.name,
			url: `${origin}/`,
			potentialAction: {
				'@type': 'SearchAction',
				target: { '@type': 'EntryPoint', urlTemplate: `${origin}${paths.search()}?q={search_term_string}` },
				'query-input': 'required name=search_term_string'
			}
		},
		{ '@context': CONTEXT, ...organization(origin) }
	];
}
