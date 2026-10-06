import type { ReactNode } from 'react';
import { cn } from '@/shared/ui';

export type SectionTone = 'page' | 'band';

type SectionProps = {
	/** `page` (default) is the plain page background; `band` is the tinted alternate. */
	tone?: SectionTone;
	id?: string;
	className?: string;
	children?: ReactNode;
};

/**
 * The design alternates the plain page background and a tinted band between
 * sections. This owns that tone plus the shared 1200px container and vertical
 * rhythm, so pages reach for a prop instead of one-off classes per section.
 */
export function Section({ tone = 'page', id, className, children }: SectionProps) {
	return (
		<section
			id={id}
			// `scroll-mt` only matters for a section that's also an anchor
			// target — otherwise the sticky header covers the heading on arrival.
			className={cn(tone === 'band' ? 'bg-secondary' : 'bg-background', id && 'scroll-mt-20')}
		>
			<div className={cn('mx-auto max-w-[1200px] px-5 py-14 sm:py-16 lg:py-24', className)}>{children}</div>
		</section>
	);
}
