import * as React from 'react';
import { cn } from '../../lib/utils';

type AvatarProps = Omit<React.ComponentProps<'span'>, 'children'> & {
	name?: string | null;
	handle?: string | null;
	src?: string | null;
	/** Diameter in px (the kit uses 24, 32, 40 and 64). */
	size?: number;
};

/** Up to two lower-case initials from a name, else the first two letters of the handle. */
function initials(name?: string | null, handle?: string | null) {
	const words = (name ?? '').split(/\s+/).filter(Boolean);
	if (words.length)
		return words
			.slice(0, 2)
			.map((w) => w[0])
			.join('')
			.toLowerCase();
	return (handle || '?').replace(/^@/, '').slice(0, 2).toLowerCase();
}

/** qotm_kit Avatar: initials in a hairline circle, or the member's image. */
function Avatar({ name, handle, src, size = 32, className, style, ...props }: AvatarProps) {
	return (
		<span
			role="img"
			aria-label={name || handle || undefined}
			className={cn(
				'box-content inline-flex flex-none items-center justify-center overflow-hidden rounded-[50%] border border-border bg-card font-mono leading-[1.6] tracking-normal text-ink',
				className
			)}
			style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.38)), ...style }}
			{...props}
		>
			{src ? <img src={src} alt="" className="size-full object-cover" /> : initials(name, handle)}
		</span>
	);
}

export { Avatar, initials };
export type { AvatarProps };
