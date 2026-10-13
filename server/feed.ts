import type { QuoteCardEntity } from '../src/shared/types/api/types.gen.ts';
import { paths } from '../src/lib/paths.ts';
import { BRAND } from '../src/shared/ui/meta/brand.ts';
import { creditOf } from './meta.ts';

/** The feeds a reader can subscribe to: /feed.xml (latest) and /curated.xml. */
export const FEEDS = {
	'/feed.xml': {
		feed: 'latest',
		title: `${BRAND.name}: latest`,
		description: 'Newly published quotes on qotm, newest first. Each one checked against its source.',
		page: paths.latest
	},
	'/curated.xml': {
		feed: 'curated',
		title: `${BRAND.name}: curated`,
		description: "The quotes in qotm's current dataset release: what every install shows.",
		page: paths.curated
	}
} as const;
export type FeedPath = keyof typeof FEEDS;

const xml = (s: string) =>
	s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		// XML 1.0 has no place for these control characters.
		// eslint-disable-next-line no-control-regex
		.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');

/** RSS 2.0, one item per quote: its words as the title, the credit as the description. */
export function rssXml(path: FeedPath, site: string, quotes: QuoteCardEntity[]): string {
	const feed = FEEDS[path];
	const items = quotes.map((q) => {
		const url = `${site}${paths.quote(q.id)}`;
		const credit = creditOf(q);
		const work = q.work ? `, ${q.work}${q.year ? ` (${q.year})` : ''}` : '';
		return [
			'\t\t<item>',
			`\t\t\t<title>${xml(`“${q.text}” — ${credit}`)}</title>`,
			`\t\t\t<link>${xml(url)}</link>`,
			`\t\t\t<guid isPermaLink="true">${xml(url)}</guid>`,
			`\t\t\t<description>${xml(`“${q.text}” — ${credit}${work}`)}</description>`,
			...(q.publishedAt ? [`\t\t\t<pubDate>${new Date(q.publishedAt).toUTCString()}</pubDate>`] : []),
			...q.topics.map((t) => `\t\t\t<category>${xml(t.name)}</category>`),
			'\t\t</item>'
		].join('\n');
	});
	const newest = quotes.find((q) => q.publishedAt)?.publishedAt;
	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
		'\t<channel>',
		`\t\t<title>${xml(feed.title)}</title>`,
		`\t\t<link>${xml(`${site}${feed.page}`)}</link>`,
		`\t\t<description>${xml(feed.description)}</description>`,
		'\t\t<language>en</language>',
		`\t\t<atom:link href="${xml(`${site}${path}`)}" rel="self" type="application/rss+xml" />`,
		...(newest ? [`\t\t<lastBuildDate>${new Date(newest).toUTCString()}</lastBuildDate>`] : []),
		...items,
		'\t</channel>',
		'</rss>',
		''
	].join('\n');
}
