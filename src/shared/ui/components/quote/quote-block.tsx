import * as React from 'react';
import { cn } from '../../lib/utils';

const SIZES = {
	sm: 'text-quote-sm',
	md: 'text-quote',
	lg: ''
} as const;

/**
 * `lg` by length: the display size suits a line or two; a long quote at 52px
 * fills a phone and then some. Fluid between a phone and the desktop size,
 * as the share card steps its size down by length (60, 50, 42).
 */
const lgFor = (length: number) =>
	length <= 80
		? 'text-[clamp(34px,9.2vw,52px)] leading-[1.1]'
		: length <= 160
			? 'text-[clamp(27px,7.2vw,44px)] leading-[1.15]'
			: 'text-[clamp(22px,5.8vw,36px)] leading-[1.22] tracking-[-0.005em]';

type QuoteBlockProps = Omit<React.ComponentProps<'figure'>, 'children'> & {
	quote: string;
	author?: React.ReactNode;
	/** The work and year, after a middle dot. */
	cite?: React.ReactNode;
	size?: keyof typeof SIZES;
	onDark?: boolean;
	/** Wraps the text in curly quotes (the default). */
	quoted?: boolean;
};

/** qotm_kit QuoteBlock: a quote set in the display face, with "— author · cite" below. */
function QuoteBlock({
	quote,
	author,
	cite,
	size = 'md',
	onDark = false,
	quoted = true,
	className,
	...props
}: QuoteBlockProps) {
	return (
		<figure className={cn('m-0', className)} {...props}>
			<blockquote
				className={cn(
					'm-0 text-balance',
					size === 'lg' ? cn('font-display font-semibold tracking-[-0.02em]', lgFor(quote.length)) : SIZES[size],
					onDark ? 'text-dark-foreground' : 'text-foreground'
				)}
			>
				{quoted ? `“${quote}”` : quote}
			</blockquote>
			{author ? (
				<figcaption className={cn('mt-3 font-mono text-[13px]', onDark ? 'text-dark-muted' : 'text-muted-foreground')}>
					— {author}
					{cite ? <span> · {cite}</span> : null}
				</figcaption>
			) : null}
		</figure>
	);
}

export { QuoteBlock };
export type { QuoteBlockProps };
