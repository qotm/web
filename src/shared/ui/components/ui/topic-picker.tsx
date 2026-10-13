import * as React from 'react';
import { cn, glyph } from '../../lib/utils';
import { Field } from './field';

type Topic = string | { slug: string; label: string };

type TopicPickerProps = {
	label?: React.ReactNode;
	topics: Topic[];
	value?: string[];
	defaultValue?: string[];
	onChange?: (slugs: string[]) => void;
	max?: number;
	hint?: React.ReactNode;
	error?: React.ReactNode;
	className?: string;
};

/** The pill a topic is drawn as, in a picker or as a TopicTag. */
const topicPillClasses = cn(
	'tap inline-flex items-center whitespace-nowrap rounded-pill border border-border bg-transparent px-2.5 py-[3px]',
	'font-mono text-xs/[18px] text-stone-600 no-underline transition-colors duration-[180ms]',
	'hover:border-foreground hover:text-foreground'
);

/** qotm_kit TopicPicker: choose up to `max` from the controlled taxonomy (no free-form tags). */
function TopicPicker({
	label = 'Topics',
	topics,
	value,
	defaultValue = [],
	onChange,
	max = 3,
	hint,
	error,
	className
}: TopicPickerProps) {
	const [inner, setInner] = React.useState(defaultValue);
	const selected = value !== undefined ? value : inner;
	const toggle = (slug: string) => {
		const on = selected.includes(slug);
		if (!on && selected.length >= max) return;
		const next = on ? selected.filter((s) => s !== slug) : [...selected, slug];
		setInner(next);
		onChange?.(next);
	};
	return (
		<Field
			label={label}
			count={`${selected.length} / ${max}`}
			hint={hint ?? `Pick up to ${max} from the qotm taxonomy.`}
			error={error}
			className={className}
		>
			<div role="group" aria-label={typeof label === 'string' ? label : 'Topics'} className="flex flex-wrap gap-2">
				{topics.map((topic) => {
					const { slug, label: name } = typeof topic === 'string' ? { slug: topic, label: topic } : topic;
					const on = selected.includes(slug);
					return (
						<button
							key={slug}
							type="button"
							aria-pressed={on}
							disabled={!on && selected.length >= max}
							onClick={() => toggle(slug)}
							className={cn(
								topicPillClasses,
								'cursor-pointer',
								'aria-pressed:border-foreground aria-pressed:bg-foreground aria-pressed:text-background',
								'disabled:cursor-not-allowed disabled:border-border disabled:text-stone-400 disabled:hover:border-border'
							)}
						>
							{on ? `${glyph('✓')} ` : ''}
							{name}
						</button>
					);
				})}
			</div>
		</Field>
	);
}

export { TopicPicker, topicPillClasses };
export type { TopicPickerProps, Topic };
