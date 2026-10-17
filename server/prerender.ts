import type {
	AuthorEntity,
	ProfileEntity,
	QuoteCardEntity,
	QuoteEntity,
	TopicEntity
} from '../src/shared/types/api/types.gen.ts';
import { paths } from '../src/lib/paths.ts';
import type { LegalBlock, LegalDoc } from '../src/features/legal/documents.ts';
import { inline } from '../src/features/legal/inline.ts';
import type { CLI_DOC, CliBlock } from '../src/features/cli/docs.ts';

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
	a(paths.topics, 'Topics'),
	a(paths.cli, 'CLI')
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

const rich = (source: string) =>
	inline(source)
		.map((p) =>
			'strong' in p
				? `<b>${e(p.strong)}</b>`
				: 'code' in p
					? `<code>${e(p.code)}</code>`
					: 'link' in p
						? a(p.href, p.link)
						: e(p.text)
		)
		.join('');

const block = (b: LegalBlock) =>
	typeof b === 'string' ? `<p>${rich(b)}</p>` : `<ul>${b.list.map((item) => `<li>${rich(item)}</li>`).join('')}</ul>`;

/** A legal document in full: the terms and the privacy policy are pages worth reading without the app. */
export function legalBody(doc: LegalDoc): string {
	return page(
		`<h1>${e(doc.title)}</h1><p>Last updated ${e(doc.updated)}</p>` +
			`<h2>The short version</h2><ul>${doc.summary.map((s) => `<li>${rich(s)}</li>`).join('')}</ul>` +
			doc.sections
				.map((s) => `<section id="${e(s.id)}"><h2>${e(s.heading)}</h2>${s.blocks.map(block).join('')}</section>`)
				.join('')
	);
}

const pre = (text: string) => `<pre><code>${e(text)}</code></pre>`;

const cliBlock = (b: CliBlock): string => {
	if (typeof b === 'string') return `<p>${rich(b)}</p>`;
	if ('commands' in b) return pre(b.commands.map((l) => `$ ${l.command}${l.note ? `  # ${l.note}` : ''}`).join('\n'));
	if ('shells' in b)
		return `<dl>${b.shells.map((s) => `<dt>${e(s.label)}, at the end of ${e(s.file)}</dt><dd>${pre(s.line)}</dd>`).join('')}</dl>`;
	if ('output' in b)
		return (
			pre([`$ ${b.output.command}`, ...(b.output.result ? [b.output.result] : []), ...b.output.lines].join('\n')) +
			(b.checks ? `<ul>${b.checks.map((c) => `<li>${e(c)}</li>`).join('')}</ul>` : '')
		);
	if ('reference' in b || 'options' in b) {
		const rows = 'reference' in b ? b.reference : b.options;
		return `<dl>${rows.map((r) => `<dt><code>${e(r.command)}</code></dt><dd>${rich(r.note ?? '')}</dd>`).join('')}</dl>`;
	}
	if ('device' in b)
		return `<p><code>qotm login</code> prints a code such as <code>${e(b.device.code)}</code>; approve it at ${a(paths.device, 'qotm.dev/device')}.</p>`;
	if ('embed' in b)
		return `<p><img src="${e(b.embed.image)}" alt="${e(b.embed.alt)}" width="640"></p>${pre(b.embed.markdown)}`;
	if ('styles' in b)
		return b.styles.map((s) => `<h3>${e(s.id)}${s.default ? ' (the default)' : ''}</h3>${pre(s.render)}`).join('');
	if ('paths' in b)
		return `<table><thead><tr><th>System</th><th>Settings, session</th><th>Dataset, favorites, history</th></tr></thead><tbody>${b.paths
			.map((p) => `<tr><th>${e(p.os)}</th><td><code>${e(p.config)}</code></td><td><code>${e(p.data)}</code></td></tr>`)
			.join('')}</tbody></table>`;
	return `<p>${rich('tip' in b ? b.tip : b.note)}</p>`;
};

/** The CLI's documentation in full: a page worth reading without the app. */
export function cliBody(doc: typeof CLI_DOC): string {
	return page(
		`<h1>${e(doc.heading)}</h1><p>${e(doc.lede)}</p>${pre('npm i -g qotm')}<p>${e(doc.requirements)} · ${a(doc.repo, 'source on GitHub')}</p>` +
			doc.sections
				.map(
					(s, i) =>
						`<section id="${e(s.id)}"><h2>${String(i + 1).padStart(2, '0')} · ${e(s.label)}: ${e(s.heading)}</h2>${s.blocks.map(cliBlock).join('')}</section>`
				)
				.join('')
	);
}
