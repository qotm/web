/**
 * /today.svg: the quote of the moment as an image for a GitHub profile
 * README (canvas "README card"), drawn as `qotm` draws it: a terminal, the
 * CLI's pull-quote marks, the quote in balanced lines, its credit. One
 * monospace size, so every position is a number of cells. The font travels
 * inside the SVG (an <img> loads nothing else); without it, a system
 * monospace stands in at nearly the same width.
 */

export type ReadmeTheme = 'dark' | 'light';

export type ReadmeQuote = {
	text: string;
	/** "Niklaus Wirth", or "@ada" for an original. */
	credit: string;
	/** "q/7yiikl"; none on the fallback card. */
	ref?: string;
};

/** What the card shows of the API's quote card: its words, its credit, its link. */
export function readmeQuoteOf(q: {
	id: string;
	text: string;
	type: string;
	author: { name: string } | null;
	attribution: string | null;
	contributor: { handle: string } | null;
}): ReadmeQuote {
	const credit =
		q.type === 'original'
			? q.contributor
				? `@${q.contributor.handle}`
				: 'a former member'
			: (q.author?.name ?? q.attribution ?? 'Unknown');
	return { text: q.text, credit, ref: `q/${q.id.replace(/^q_/, '')}` };
}

/** Shown when the API has no quote to give: the site's line, held briefly. */
export const FALLBACK_QUOTE: ReadmeQuote = { text: 'A thought between commands.', credit: 'qotm' };

const COLORS: Record<
	ReadmeTheme,
	Record<'bg' | 'border' | 'rule' | 'dot' | 'title' | 'accent' | 'text' | 'credit' | 'foot', string>
> = {
	dark: {
		bg: '#141210',
		border: '#2a2724',
		rule: '#2a2724',
		dot: '#4a4640',
		title: '#a7a29a',
		accent: '#c67457',
		text: '#f4f2ed',
		credit: '#a7a29a',
		foot: '#6e6a64'
	},
	light: {
		bg: '#f4f2ed',
		border: '#dad7d0',
		rule: '#dad7d0',
		dot: '#dad7d0',
		title: '#6e6a64',
		accent: '#a24a2c',
		text: '#141210',
		credit: '#6e6a64',
		foot: '#6e6a64'
	}
};

const WIDTH = 640;
const PAD = 22;
/** JetBrains Mono's advance is 0.6 em: 8.4px at 14px. */
const CELL = 8.4;
const LINE = 21;
/** The CLI's column: at most 60 cells (cli/src/render.ts). */
const COLUMNS = 60;
const MARKS_X = PAD + 8;
const TEXT_X = MARKS_X + 5 * CELL + 16;

const cells = (s: string) => [...s].length;

/** Greedy word wrap at `width` cells, as the CLI's wrapWords. */
export function wrapWords(text: string, width: number): string[] {
	const lines: string[] = [];
	let line = '';
	for (const word of text.split(/\s+/).filter(Boolean)) {
		if (line && cells(line) + 1 + cells(word) > width) {
			lines.push(line);
			line = word;
		} else line = line ? `${line} ${word}` : word;
	}
	lines.push(line);
	return lines;
}

/** As the CLI's balance: wrap at `max`, then narrow while the line count holds, so lines come out even. */
export function balance(text: string, max: number): string[] {
	const count = wrapWords(text, max).length;
	if (count === 1) return wrapWords(text, max);
	let width = max;
	while (width > 12 && wrapWords(text, width - 1).length === count) width--;
	return wrapWords(text, width);
}

const clip = (s: string, n: number) => (cells(s) > n ? `${[...s].slice(0, n - 1).join('')}…` : s);
const xml = (s: string) =>
	s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const n = (v: number) => Math.round(v * 10) / 10;

/** The pull quote's marks, `▄▄ ▄▄` over `▀█ ▀█`, as blocks: one rect per filled cell. */
function marks(top: number, fill: string) {
	const half = LINE / 2;
	/** A block character's filled part of its cell: offset from the top, and height. */
	const BLOCKS: Record<string, [number, number]> = { '▄': [half, half], '▀': [0, half], '█': [0, LINE] };
	const rects: string[] = [];
	['▄▄ ▄▄', '▀█ ▀█'].forEach((row, r) =>
		[...row].forEach((ch, col) => {
			const block = BLOCKS[ch];
			if (!block) return;
			const [dy, h] = block;
			rects.push(
				`<rect x="${n(MARKS_X + col * CELL)}" y="${n(top + r * LINE + dy)}" width="${n(CELL)}" height="${n(h)}" fill="${fill}"/>`
			);
		})
	);
	return rects.join('');
}

/**
 * The card's SVG. `font` is JetBrains Mono as base64 woff2 (the site's own
 * latin file), or undefined to rely on the reader's monospace.
 */
export function readmeCardSvg(quote: ReadmeQuote, theme: ReadmeTheme = 'dark', font?: string): string {
	const c = COLORS[theme];
	const lines = balance(quote.text, COLUMNS);
	const promptY = 42 + 33;
	const quoteTop = promptY + 14;
	const first = quoteTop + 15;
	// As the CLI: a one-line quote still gives the marks' second row its line.
	const creditY = first + (Math.max(lines.length, 2) - 1) * LINE + 30;
	const footY = creditY + 38;
	const height = footY + 16;
	const credit = clip(`${quote.credit}${quote.ref ? `  ·  ${quote.ref}` : ''}`, COLUMNS - 3);
	const label = `Quote of the moment: “${quote.text}” — ${quote.credit}`;
	const face = font
		? `@font-face{font-family:'qotm mono';src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:100 800}`
		: '';
	return [
		`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}" role="img" aria-label="${xml(label)}">`,
		`<title>${xml(label)}</title>`,
		`<style>${face}text{font-family:'qotm mono','JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:14px;white-space:pre}.s{font-size:12px}.b{font-weight:600}</style>`,
		`<rect x="0.5" y="0.5" width="${WIDTH - 1}" height="${height - 1}" rx="12" fill="${c.bg}" stroke="${c.border}"/>`,
		[21, 38, 55].map((x) => `<circle cx="${x}" cy="21" r="5" fill="${c.dot}"/>`).join(''),
		`<text class="s" x="${WIDTH - 16}" y="25" text-anchor="end" fill="${c.title}">quote of the moment</text>`,
		`<line x1="0" y1="42.5" x2="${WIDTH}" y2="42.5" stroke="${c.rule}"/>`,
		`<text x="${PAD}" y="${promptY}" fill="${c.accent}">~ &gt;</text>`,
		`<text x="${n(PAD + 4 * CELL)}" y="${promptY}" fill="${c.text}">qotm</text>`,
		marks(quoteTop, c.accent),
		lines
			.map((l, i) => `<text class="b" x="${n(TEXT_X)}" y="${first + i * LINE}" fill="${c.text}">${xml(l)}</text>`)
			.join(''),
		`<text class="s" x="${n(TEXT_X)}" y="${creditY}" fill="${c.accent}">—</text>`,
		`<text class="s" x="${n(TEXT_X + 3 * 7.2)}" y="${creditY}" fill="${c.credit}">${xml(credit)}</text>`,
		`<text class="s" x="${PAD}" y="${footY}" fill="${c.foot}">npm i -g qotm</text>`,
		`<text class="s" x="${WIDTH - PAD}" y="${footY}" text-anchor="end" fill="${c.foot}">qotm.dev</text>`,
		'</svg>'
	].join('');
}
