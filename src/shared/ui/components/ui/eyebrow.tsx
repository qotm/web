import * as React from 'react';
import { cn } from '../../lib/utils';

const TONES = {
	muted: 'text-stone-600',
	clay: 'text-clay-600',
	dark: 'text-stone-400'
} as const;

type EyebrowProps = React.ComponentProps<'p'> & {
	tone?: keyof typeof TONES;
	as?: 'p' | 'span' | 'div' | 'h2';
};

/** qotm_kit Eyebrow: the mono, uppercase line above a heading ("Discover"). `dark` sits on ink. */
function Eyebrow({ tone = 'muted', as: Tag = 'p', className, ...props }: EyebrowProps) {
	return (
		<Tag
			className={cn(
				'mt-0 mb-grid font-mono text-[12px]/[1.5] font-normal tracking-[0.14em] uppercase',
				TONES[tone],
				className
			)}
			{...props}
		/>
	);
}

export { Eyebrow };
export type { EyebrowProps };
