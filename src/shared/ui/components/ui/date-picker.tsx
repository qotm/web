import * as React from 'react';
import { CalendarIcon } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from '../../lib/utils';

// Calendar (react-day-picker) is heavy — load it only when a date field opens.
const LazyCalendar = React.lazy(() => import('./calendar').then((module) => ({ default: module.Calendar })));

type DatePickerProps = {
	/** `yyyy-MM-dd`, or '' for empty — the same wire shape as a native `<input type="date">`. */
	value: string;
	onChange: (value: string) => void;
	id?: string;
	placeholder?: string;
	invalid?: boolean;
	/** Called after a date is picked — `FormDateField` uses it to mark the field touched. */
	onCommit?: () => void;
};

/**
 * Controlled date field: an input-styled trigger opening a Popover calendar.
 *
 * Unbound to any form library, so it works in `admin` and `landing` (neither
 * has Formik). `FormDateField` wraps this for the Formik apps — keep the
 * composition here only, so the two can't drift.
 */
function DatePicker({ value, onChange, id, placeholder = 'Pick a date', invalid, onCommit }: DatePickerProps) {
	const [open, setOpen] = React.useState(false);

	const parsed = value ? parseISO(value) : undefined;
	const selected = parsed && isValid(parsed) ? parsed : undefined;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					type="button"
					id={id}
					aria-invalid={invalid || undefined}
					className={cn(
						'flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-input bg-card px-3.5 text-sm outline-none transition-colors',
						'focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring',
						'aria-invalid:border-negative'
					)}
				>
					{selected ? (
						<span className="text-foreground">{format(selected, 'd MMM yyyy')}</span>
					) : (
						<span className="text-mute">{placeholder}</span>
					)}
					<CalendarIcon className="size-4 shrink-0 text-mute" />
				</button>
			</PopoverTrigger>
			<PopoverContent align="start">
				<React.Suspense
					fallback={<div className="flex h-72 w-64 items-center justify-center text-sm text-mute">Loading…</div>}
				>
					<LazyCalendar
						mode="single"
						autoFocus
						selected={selected}
						onSelect={(date) => {
							onChange(date ? format(date, 'yyyy-MM-dd') : '');
							onCommit?.();
							setOpen(false);
						}}
					/>
				</React.Suspense>
			</PopoverContent>
		</Popover>
	);
}

export { DatePicker };
export type { DatePickerProps };
