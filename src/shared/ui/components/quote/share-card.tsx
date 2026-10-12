import * as React from 'react';
import { cn } from '../../lib/utils';
import marks from '../brand/svg/cursor-quote.svg';
import { Logo } from '../brand/logo';

const W = 1200;
const H = 630;
/** The worker's floor (apps/worker share-images): below this a quote is not a card. */
const MIN_FONT = 24;

type ShareCardProps = {
	quote: string;
	author: string;
	variant?: 'quote' | 'terminal';
	/** The quote's id, shown in the footer of the quote card. */
	id?: string;
	/** Rendered width in px; the 1200×630 card is scaled to it. */
	width?: number;
	className?: string;
};

/**
 * qotm_kit ShareCard: the 1200×630 image the worker renders for a quote
 * (apps/worker/src/workers/share-images), drawn at any width. Same markup and
 * the same fit: the quote starts at 60, 50 or 42px by length and steps down
 * 2px at a time until the credit clears the footer (quote card) or the last
 * prompt clears the bottom (terminal card).
 */
function ShareCard({ quote, author, variant = 'quote', id, width = 600, className }: ShareCardProps) {
	const scale = width / W;
	const start = quote.length <= 60 ? 60 : quote.length <= 100 ? 50 : 42;
	const [size, setSize] = React.useState(start);
	const card = React.useRef<HTMLDivElement>(null);
	// Fit again once the display face has loaded: the fallback measures differently.
	const [fonts, setFonts] = React.useState(0);
	React.useEffect(() => {
		let live = true;
		void document.fonts?.ready.then(() => live && setFonts((n) => n + 1));
		return () => {
			live = false;
		};
	}, []);

	React.useLayoutEffect(() => {
		const root = card.current;
		// Not laid out (hidden, or no layout engine): nothing to measure.
		if (!root || root.getBoundingClientRect().height === 0) return;
		const q = root.querySelector<HTMLElement>('[data-share="quote"]')!;
		let n = start;
		q.style.fontSize = `${n}px`;
		// Measure in the card's own (unscaled) pixels.
		const unscale = (v: number) => (v - root.getBoundingClientRect().top) / scale;
		const bottom = (sel: string) =>
			Math.max(...[...root.querySelectorAll(sel)].map((el) => unscale(el.getBoundingClientRect().bottom)));
		const fits = () =>
			variant === 'quote'
				? bottom('[data-share="by"]') <=
					unscale(root.querySelector('[data-share="foot"]')!.getBoundingClientRect().top) - 24
				: bottom('[data-share="cmd"]') <= H - 24;
		while (!fits() && n > MIN_FONT) {
			n -= 2;
			q.style.fontSize = `${n}px`;
		}
		// Leaves the size it measured inline; the state carries it into React's render.
		setSize(n);
	}, [quote, author, variant, start, scale, fonts]);

	const terminal = variant === 'terminal';
	const by = (
		<div
			data-share="by"
			className={cn('font-mono text-[26px]', terminal ? 'mt-0 mb-[68px] text-stone-400' : 'mt-9 text-stone-600')}
		>
			<span className={cn('mr-[18px]', terminal ? 'text-dark-accent' : 'text-clay-500')}>—</span> {author}
		</div>
	);
	const text = (
		<div
			data-share="quote"
			className={cn(
				'font-display leading-[1.2] font-semibold text-balance',
				terminal ? 'mt-[60px] mb-7 max-w-[900px]' : 'max-w-[920px] tracking-[-0.01em]'
			)}
			style={{ fontSize: size }}
		>
			{quote}
		</div>
	);
	return (
		<div
			role="img"
			aria-label={`“${quote}” — ${author}`}
			className={cn('relative box-content overflow-hidden rounded-terminal border border-border', className)}
			style={{ width, height: H * scale }}
		>
			<div
				ref={card}
				aria-hidden="true"
				className={cn(
					'absolute top-0 left-0 box-border h-[630px] w-[1200px] origin-top-left',
					terminal
						? 'bg-dark text-dark-foreground'
						: 'border-l-[16px] border-clay-500 bg-background pt-[150px] pr-24 pl-[90px] text-ink'
				)}
				style={{ transform: `scale(${scale})` }}
			>
				{terminal ? (
					<>
						<div className="flex gap-3.5 border-b-2 border-dark-rule px-12 py-9">
							{[0, 1, 2].map((i) => (
								<i key={i} className="block size-[22px] rounded-[50%] bg-stone-600" />
							))}
						</div>
						<div className="px-[72px] py-[60px] font-mono">
							<div data-share="cmd" className="text-[36px]">
								<span className="text-dark-accent">~ &gt;</span> qotm
							</div>
							{text}
							{by}
							<div data-share="cmd" className="text-[36px]">
								<span className="text-dark-accent">~ &gt;</span>{' '}
								<span className="ml-[50px] inline-block h-11 w-6 bg-dark-foreground align-[-8px]" />
							</div>
						</div>
					</>
				) : (
					<>
						<img src={marks} alt="" className="absolute top-[60px] left-16 w-[186px] [clip-path:inset(0_45%_0_0)]" />
						{text}
						{by}
						<div
							data-share="foot"
							className="absolute right-24 bottom-14 left-[90px] flex items-end justify-end gap-[88px] font-mono text-[20px] text-stone-600"
						>
							<span className="whitespace-pre">
								{id ? `q/${id.replace(/^q_/, '')}  ·  ` : ''}a thought between commands
							</span>
							<Logo lockup="symbol" height={44} alt="" />
						</div>
					</>
				)}
			</div>
		</div>
	);
}

export { ShareCard };
export type { ShareCardProps };
