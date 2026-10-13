/**
 * The legal documents' inline markup: `**strong**`, `` `code` `` and
 * `[text](href)`, and nothing else. Plain (no imports): the web image's server renders the same
 * documents for crawlers.
 */
export type Inline = { text: string } | { strong: string } | { code: string } | { link: string; href: string };

const TOKEN = /\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;

export function inline(source: string): Inline[] {
	const out: Inline[] = [];
	let last = 0;
	for (const m of source.matchAll(TOKEN)) {
		if (m.index > last) out.push({ text: source.slice(last, m.index) });
		out.push(m[1] !== undefined ? { strong: m[1] } : m[2] !== undefined ? { code: m[2] } : { link: m[3], href: m[4] });
		last = m.index + m[0].length;
	}
	if (last < source.length) out.push({ text: source.slice(last) });
	return out;
}
