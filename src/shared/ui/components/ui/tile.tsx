import * as React from 'react';
import { cn } from '../../lib/utils';

/** qotm_kit Tile: a centring box for a mark or graphic, with a mono caption. */
function Tile({
	caption,
	dark,
	className,
	children,
	...props
}: React.ComponentProps<'div'> & { caption?: React.ReactNode; dark?: boolean }) {
	return (
		<div className={className} {...props}>
			<div
				className={cn(
					'flex items-center justify-center rounded-card border p-tile',
					dark ? 'border-dark-rule bg-dark' : 'border-border bg-card'
				)}
			>
				{children}
			</div>
			{caption ? <div className="mt-2 text-center text-label text-muted-foreground normal-case">{caption}</div> : null}
		</div>
	);
}

export { Tile };
