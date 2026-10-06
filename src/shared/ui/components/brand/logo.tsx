import { cn } from '../../lib/utils';

/** Qotm Web "in" monogram mark (fills with currentColor). */
export function LogoMark({ width = 18, className }: { width?: number; className?: string }) {
	return (
		<svg width={width} height={(width * 319) / 368} viewBox="0 0 368 319" aria-hidden="true" className={className}>
			<g transform="translate(0,319) scale(0.1,-0.1)" fill="currentColor" stroke="none">
				<path d="M20 2865 l0 -305 410 0 410 0 0 305 0 305 -410 0 -410 0 0 -305z" />
				<path d="M20 1021 c0 -649 3 -1002 10 -1006 5 -3 376 -3 824 1 l814 7 5 166 c5 187 13 221 92 370 127 238 337 445 560 551 147 70 337 115 460 108 l60 -3 2 -590 c2 -324 3 -593 3 -597 0 -5 182 -8 405 -8 l405 0 0 1000 0 1000 -475 0 c-602 0 -716 -12 -980 -101 -439 -148 -809 -447 -1070 -864 -145 -232 -235 -474 -282 -760 -14 -87 -19 260 -14 1018 l4 707 -411 0 -412 0 0 -999z" />
			</g>
		</svg>
	);
}

const DISC_SIZE = {
	md: 'size-9 rounded-xl',
	sm: 'size-8 rounded-[10px]'
} as const;

/**
 * The brand mark on its green disc (no wordmark) — the reusable app icon.
 * Ink-on-green is the approved primary treatment from the logo guidelines
 * (the earlier yellow-on-ink disc is the superseded legacy mark). The mark is
 * always ink #0e0f0c on Nerd Green, independent of light/dark theme.
 */
export function LogoDisc({ size = 'md', className }: { size?: 'sm' | 'md'; className?: string }) {
	return (
		<span
			className={cn('flex flex-none items-center justify-center bg-primary text-[#0e0f0c]', DISC_SIZE[size], className)}
		>
			<LogoMark width={size === 'md' ? 18 : 16} />
		</span>
	);
}

/** Full brand lockup: the mark on its disc plus the "Qotm Web" wordmark. */
export function Logo({ size = 'md', className }: { size?: 'sm' | 'md'; className?: string }) {
	return (
		<span className={cn('inline-flex items-center gap-2.5', className)}>
			<LogoDisc size={size} />
			<span
				className={cn(
					'font-display font-extrabold leading-none tracking-tight text-foreground',
					size === 'md' ? 'text-[15px]' : 'text-sm'
				)}
			>
				Qotm Web
			</span>
		</span>
	);
}
