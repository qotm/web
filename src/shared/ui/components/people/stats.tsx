import { cn } from '../../lib/utils';

type Stat = { label: string; value: number | string };

/** qotm_kit Stats: display-face numbers over mono uppercase labels. */
function Stats({ items, className }: { items: Stat[]; className?: string }) {
	return (
		<dl className={cn('m-0 flex gap-tile', className)}>
			{items.map((s) => (
				<div key={s.label} className="flex flex-col-reverse gap-0.5">
					<dt className="font-mono text-[12px]/[1.6] tracking-[0.14em] text-stone-600 uppercase">{s.label}</dt>
					<dd className="m-0 font-display text-[24px]/[1.1] font-semibold">
						{typeof s.value === 'number' ? s.value.toLocaleString('en-US') : s.value}
					</dd>
				</div>
			))}
		</dl>
	);
}

export { Stats };
export type { Stat };
