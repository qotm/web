import { cn } from '../../lib/utils';

type SkeletonProps = {
	/** Text lines, the last one shorter. Ignored with `block`. */
	lines?: number;
	width?: number | string;
	height?: number;
	/** One block instead of lines. */
	block?: boolean;
	className?: string;
};

/** qotm_kit Skeleton: static hairline grey, no shimmer (the cursor is the only thing that moves). */
function Skeleton({ lines = 3, width, height = 12, block = false, className }: SkeletonProps) {
	const bar = 'rounded-[6px] bg-border opacity-70';
	if (block) {
		return <div aria-hidden="true" className={cn(bar, className)} style={{ width: width ?? '100%', height }} />;
	}
	return (
		<div aria-busy="true" aria-label="Loading" className={cn('flex flex-col gap-2.5', className)}>
			{Array.from({ length: lines }, (_, i) => (
				<div key={i} className={bar} style={{ height, width: i === lines - 1 ? '62%' : '100%' }} />
			))}
		</div>
	);
}

export { Skeleton };
export type { SkeletonProps };
