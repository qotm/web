import * as React from 'react';
import { cn } from '../../lib/utils';

const SIZES = {
	sm: 'text-quote-sm',
	md: 'text-quote',
	lg: 'text-display leading-[1.1]'
} as const;

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
			<blockquote className={cn('m-0 text-balance', SIZES[size], onDark ? 'text-dark-foreground' : 'text-foreground')}>
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
