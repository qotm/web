import { describe, expect, it } from 'vitest';
import { balance, FALLBACK_QUOTE, readmeCardSvg } from './readme-card.ts';

const dijkstra = {
	text: 'The art of programming is the art of organizing complexity, of mastering multitude and avoiding its bastard chaos as effectively as possible.',
	credit: 'Edsger W. Dijkstra',
	ref: 'q/d4t6qo'
};
const heightOf = (svg: string) => Number(/height="(\d+)"/.exec(svg)![1]);

describe('the README card', () => {
	it('breaks lines as the CLI does: at most 60 cells, balanced', () => {
		const lines = balance(dijkstra.text, 60);
		expect(lines).toHaveLength(3);
		expect(Math.max(...lines.map((l) => l.length))).toBeLessThanOrEqual(60);
		expect(balance('Talk is cheap. Show me the code.', 60)).toEqual(['Talk is cheap. Show me the code.']);
	});

	it('draws the quote, its credit and link, the prompt and the install line', () => {
		const svg = readmeCardSvg(dijkstra);
		for (const line of balance(dijkstra.text, 60)) expect(svg).toContain(`>${line}</text>`);
		expect(svg).toContain('Edsger W. Dijkstra  ·  q/d4t6qo');
		expect(svg).toContain('quote of the moment');
		expect(svg).toContain('>qotm</text>');
		expect(svg).toContain('npm i -g qotm');
		expect(svg).toContain('aria-label="Quote of the moment: “The art of programming');
		expect(svg).not.toContain('@font-face');
	});

	it('grows with the quote, keeping the marks’ two rows for a one-line quote', () => {
		const one = readmeCardSvg({ text: 'Talk is cheap.', credit: 'Linus Torvalds' });
		const two = readmeCardSvg({ text: 'Short. '.repeat(12), credit: 'X' });
		expect(heightOf(one)).toBe(heightOf(two));
		expect(heightOf(readmeCardSvg(dijkstra))).toBe(heightOf(two) + 21);
	});

	it('escapes what it prints', () => {
		const svg = readmeCardSvg({ text: 'Use <b> & "quotes" carefully.', credit: "O'Brien" });
		expect(svg).toContain('Use &lt;b&gt; &amp; &quot;quotes&quot; carefully.');
		expect(svg).toContain('O&#39;Brien');
		expect(svg).not.toContain('<b>');
	});

	it('comes in ink and in paper, and carries the font when given one', () => {
		expect(readmeCardSvg(FALLBACK_QUOTE)).toContain('fill="#141210"');
		expect(readmeCardSvg(FALLBACK_QUOTE, 'light')).toContain('fill="#f4f2ed"');
		expect(readmeCardSvg(FALLBACK_QUOTE, 'dark', 'AAAA')).toContain('url(data:font/woff2;base64,AAAA)');
	});
});
