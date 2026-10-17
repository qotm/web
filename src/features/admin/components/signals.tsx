import * as React from 'react';
import type { QueueItemEntity } from '@/shared/types';

type SignalsProps = {
	counts: QueueItemEntity['counts'];
	/** Recommends only count for a community original. */
	original: boolean;
	/** Facts that follow the counts (the releases a quote is in). */
	more?: { label: string; value: React.ReactNode }[];
};

/**
 * A quote's community signals as one quiet row that wraps on a phone: the
 * figure over its label. Shown to reviewers, never decisive.
 */
export function Signals({ counts, original, more = [] }: SignalsProps) {
	const facts = [
		{ label: 'likes', value: counts.likes, figure: true },
		{ label: 'favorites', value: counts.favorites, figure: true },
		{ label: 'recommends', value: original ? counts.recommends : '—', figure: true },
		...more.map((m) => ({ ...m, figure: false }))
	];
	return (
		<dl className="m-0 flex flex-wrap items-end gap-x-7 gap-y-3">
			{facts.map((f) => (
				<div key={f.label} className="flex min-w-0 flex-col-reverse">
					<dt className="font-mono text-[12px] text-stone-600">{f.label}</dt>
					<dd
						className={f.figure ? 'm-0 font-display text-[22px] font-bold' : 'm-0 font-mono text-[13px] wrap-anywhere'}
					>
						{f.value}
					</dd>
				</div>
			))}
		</dl>
	);
}
