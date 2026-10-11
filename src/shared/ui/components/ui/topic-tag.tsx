import * as React from 'react';
import { Link } from 'react-router';
import { paths } from '@/lib/paths';
import { cn } from '../../lib/utils';
import { topicPillClasses } from './topic-picker';

type TopicTagProps = Omit<React.ComponentProps<typeof Link>, 'to'> & {
	/** The topic's slug; defaults to the name, hyphenated. */
	slug?: string;
	/** Overrides the topic page link. */
	to?: React.ComponentProps<typeof Link>['to'];
	selected?: boolean;
};

/** qotm_kit TopicTag: a topic pill linking to its feed. `selected` marks the one being viewed. */
function TopicTag({ children, slug, to, selected = false, className, ...props }: TopicTagProps) {
	const s = slug ?? String(children).toLowerCase().replace(/\s+/g, '-');
	return (
		<Link
			to={to ?? paths.topic(s)}
			aria-current={selected ? 'page' : undefined}
			data-selected={selected || undefined}
			className={cn(
				topicPillClasses,
				'data-selected:border-foreground data-selected:bg-foreground data-selected:text-background',
				className
			)}
			{...props}
		>
			{children}
		</Link>
	);
}

export { TopicTag };
export type { TopicTagProps };
