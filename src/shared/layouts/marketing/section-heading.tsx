import { cn } from '@/shared/ui';

type SectionHeadingProps = {
	eyebrow?: string;
	title: string;
	lede?: string;
	/** `left` drops the centering, for a heading inside a two-column row rather than standing alone. */
	align?: 'center' | 'left';
	className?: string;
};

/**
 * Eyebrow pill / h2 / lede — the heading stack the design repeats at the top
 * of most sections. `bg-accent text-accent-foreground` rather than the fixed
 * `primary-pale` + `ink-deep`: the accent pair flips together per theme, where a
 * fixed pale badge goes muddy on dark.
 */
export function SectionHeading({ eyebrow, title, lede, align = 'center', className }: SectionHeadingProps) {
	return (
		<div
			className={cn(
				'flex flex-col gap-4',
				align === 'center' ? 'items-center text-center' : 'items-start text-left',
				className
			)}
		>
			{eyebrow ? (
				<span className="inline-flex rounded-full bg-accent px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-accent-foreground">
					{eyebrow}
				</span>
			) : null}
			<h2 className="max-w-3xl font-display text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">
				{title}
			</h2>
			{lede ? <p className="max-w-2xl text-lg text-body">{lede}</p> : null}
		</div>
	);
}
