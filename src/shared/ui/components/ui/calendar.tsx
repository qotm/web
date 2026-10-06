import * as React from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { cn } from '../../lib/utils';

/**
 * Calendar (react-day-picker v9) styled to the Wise design — self-contained, no external CSS.
 * Defaults to month + year dropdown navigation (spanning ~60 years back) so users can jump to
 * old dates without clicking through months. Override captionLayout / startMonth / endMonth as needed.
 */
function Calendar({
	className,
	classNames,
	showOutsideDays = true,
	captionLayout = 'dropdown',
	startMonth,
	endMonth,
	...props
}: React.ComponentProps<typeof DayPicker>) {
	const currentYear = new Date().getFullYear();
	const start = startMonth ?? new Date(currentYear - 60, 0);
	const end = endMonth ?? new Date(currentYear + 1, 11);

	return (
		<DayPicker
			showOutsideDays={showOutsideDays}
			captionLayout={captionLayout}
			startMonth={start}
			endMonth={end}
			className={cn('p-1', className)}
			classNames={{
				root: 'w-fit',
				months: 'relative flex flex-col gap-4',
				month: 'flex flex-col gap-3',
				month_caption: 'flex h-8 items-center justify-center',
				caption_label:
					'flex items-center gap-1 px-1 text-sm font-semibold text-foreground [&>svg]:size-3.5 [&>svg]:text-mute',
				dropdowns: 'flex items-center justify-center gap-1.5',
				dropdown_root:
					'relative inline-flex items-center rounded-lg border border-input focus-within:border-foreground focus-within:ring-2 focus-within:ring-ring hover:bg-secondary',
				dropdown: 'absolute inset-0 cursor-pointer opacity-0',
				nav: 'absolute inset-x-0 top-0 flex items-center justify-between',
				button_previous:
					'inline-flex size-8 items-center justify-center rounded-full text-mute outline-none hover:bg-secondary hover:text-foreground disabled:opacity-40',
				button_next:
					'inline-flex size-8 items-center justify-center rounded-full text-mute outline-none hover:bg-secondary hover:text-foreground disabled:opacity-40',
				month_grid: 'w-full border-collapse',
				weekdays: 'flex',
				weekday: 'w-9 text-[11px] font-semibold text-mute',
				week: 'mt-1 flex w-full',
				day: 'size-9 p-0 text-center',
				day_button:
					'flex size-9 items-center justify-center rounded-full text-sm font-normal text-foreground outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring aria-selected:bg-foreground aria-selected:text-background aria-selected:hover:bg-foreground',
				today: 'font-bold text-ink-deep',
				outside: 'text-mute/50',
				disabled: 'text-mute/40 opacity-50',
				hidden: 'invisible',
				...classNames
			}}
			components={{
				Chevron: ({ orientation, className: chevronClassName }) => {
					const Icon =
						orientation === 'left'
							? ChevronLeft
							: orientation === 'right'
								? ChevronRight
								: orientation === 'up'
									? ChevronUp
									: ChevronDown;
					return <Icon className={cn('size-4', chevronClassName)} />;
				}
			}}
			{...props}
		/>
	);
}

export { Calendar };
