import type {
	AuthorEntity,
	ProfileEntity,
	QuoteCardEntity,
	QuoteEntity,
	TopicEntity
} from '../src/shared/types/api/types.gen.ts';
import { paths } from '../src/lib/paths.ts';

/**
 * Plain HTML for `#root`: what a page says, for crawlers that do not run the
 * app (Bing, DuckDuckGo, the AI crawlers). It is the same content the app
 * shows, as semantic markup with links to follow; `createRoot` replaces it
 * when the app starts, so there is nothing to hydrate. Layout: one readable
 * column on the page's own background.
 */

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const e = (s: string) => s.replace(/[&<>"']/g, (c) => ESCAPES[c]);
const a = (href: string, text: string) => `<a href="${e(href)}">${e(text)}</a>`;

const NAV = `<nav>${[
	a(paths.home, 'qotm'),
	a(paths.discover, 'Discover'),
	a(paths.latest, 'Latest'),
	a(paths.curated, 'Curated'),
	a(paths.topics, 'Topics')
].join(' · ')}</nav>`;

const page = (inner: string) =>
	`<main data-prerender style="max-width:720px;margin:0 auto;padding:48px 16px">${NAV}${inner}</main>`;

const credit = (q: QuoteCardEntity) =>
	q.type === 'original'
		? q.contributor
			? a(paths.profile(q.contributor.handle), `@${q.contributor.handle}`)
			: 'a former member'
		: q.author
			? a(paths.author(q.author.slug), q.author.name)
			: e(q.attribution ?? 'Unknown');

/** A list of quotes, each linking to its page and its author's. */
const list = (quotes: QuoteCardEntity[]) =>
	quotes.length
		? `<ul>${quotes.map((q) => `<li><blockquote>${a(paths.quote(q.id), q.text)}</blockquote> — ${credit(q)}</li>`).join('')}</ul>`
		: '';

const topicLinks = (topics: { slug: string; name: string }[]) =>
	topics.length ? `<p>Topics: ${topics.map((t) => a(paths.topic(t.slug), t.name)).join(', ')}</p>` : '';

export function quoteBody(q: QuoteEntity): string {
	const work = q.source?.title ?? q.work;
	const year = q.source?.year ?? q.year;
	const source = work ? `<cite>${e(work)}</cite>${year ? ` (${year})` : ''}` : '';
	const link = q.source?.url ?? q.sourceUrl;
	return page(
		`<article><blockquote><p>${e(q.text)}</p></blockquote><p>— ${credit(q)}${source ? `, ${source}` : ''}</p>` +
			(link ? `<p>Source: ${a(link, link)}</p>` : '') +
			(q.context ? `<p>${e(q.context)}</p>` : '') +
			topicLinks(q.topics) +
			`</article>`
	);
}

export function authorBody(au: AuthorEntity, quotes: QuoteCardEntity[]): string {
	return page(
		`<h1>${e(au.name)}</h1>` +
			(au.line && au.line !== '—' ? `<p>${e(au.line)}</p>` : '') +
			topicLinks(au.topics) +
			list(quotes)
	);
}

export function topicBody(t: TopicEntity, quotes: QuoteCardEntity[]): string {
	return page(`<h1>${e(t.name)}</h1>${t.description ? `<p>${e(t.description)}</p>` : ''}${list(quotes)}`);
}

export function homeBody(quotes: QuoteCardEntity[]): string {
	return page(
		`<h1>A thought between commands.</h1>` +
			`<p>qotm prints one considered programming quote in your terminal. The community checks where every one of them came from.</p>` +
			`<pre><code>npm i -g qotm</code></pre>` +
			list(quotes)
	);
}

export function feedBody(title: string, description: string, quotes: QuoteCardEntity[]): string {
	return page(`<h1>${e(title)}</h1><p>${e(description)}</p>${list(quotes)}`);
}

export function topicIndexBody(description: string, topics: TopicEntity[]): string {
	return page(
		`<h1>Topics</h1><p>${e(description)}</p>` +
			(topics.length
				? `<ul>${topics.map((t) => `<li>${a(paths.topic(t.slug), t.name)} (${t.counts.quotes})</li>`).join('')}</ul>`
				: '')
	);
}

export function profileBody(p: ProfileEntity): string {
	return page(`<h1>${e(p.name || `@${p.handle}`)}</h1><p>@${e(p.handle)}</p>${p.bio ? `<p>${e(p.bio)}</p>` : ''}`);
}
