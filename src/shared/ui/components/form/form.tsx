import * as React from 'react';
import { useField } from 'formik';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { DatePicker } from '../ui/date-picker';
import { cn } from '../../lib/utils';

/** Inline field error message (used by the fields below, also usable standalone). */
function FormError({ className, children }: { className?: string; children: React.ReactNode }) {
	return (
		<p role="alert" className={cn('text-sm text-negative', className)}>
			{children}
		</p>
	);
}

/** Label + control wrapper shared by the form fields. */
function Field({
	id,
	label,
	hint,
	error,
	className,
	children
}: {
	id: string;
	label?: string;
	hint?: string;
	error?: string;
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<div className={cn('flex flex-col gap-1.5', className)}>
			{label ? <Label htmlFor={id}>{label}</Label> : null}
			{children}
			{error ? <FormError>{error}</FormError> : hint ? <p className="text-sm text-mute">{hint}</p> : null}
		</div>
	);
}

type FormFieldProps = Omit<React.ComponentProps<typeof Input>, 'name'> & {
	name: string;
	label?: string;
	hint?: string;
};

/**
 * Formik-bound labelled input with error display. Must render inside a <Formik>.
 * The form primitives wrap shadcn parts so a future RHF swap stays contained here.
 */
function FormField({ name, label, hint, className, id, ...props }: FormFieldProps) {
	const [field, meta] = useField(name);
	const fieldId = id ?? name;
	const showError = meta.touched && Boolean(meta.error);

	return (
		<Field id={fieldId} label={label} hint={hint} error={showError ? meta.error : undefined} className={className}>
			<Input id={fieldId} aria-invalid={showError || undefined} {...field} {...props} />
		</Field>
	);
}

type FormTextareaProps = Omit<React.ComponentProps<typeof Textarea>, 'name'> & {
	name: string;
	label?: string;
	hint?: string;
};

/** Formik-bound multiline text field. */
function FormTextarea({ name, label, hint, className, id, ...props }: FormTextareaProps) {
	const [field, meta] = useField(name);
	const fieldId = id ?? name;
	const showError = meta.touched && Boolean(meta.error);

	return (
		<Field id={fieldId} label={label} hint={hint} error={showError ? meta.error : undefined} className={className}>
			<Textarea id={fieldId} aria-invalid={showError || undefined} {...field} {...props} />
		</Field>
	);
}

type FormDateFieldProps = {
	name: string;
	label?: string;
	hint?: string;
	className?: string;
	id?: string;
	placeholder?: string;
};

/**
 * Formik-bound date field: an input-styled trigger opening a Popover calendar.
 * Stores `yyyy-MM-dd`.
 *
 * The composition lives in `DatePicker` so the Formik-less apps (`admin`,
 * `landing`) get the same control without a second copy to keep in sync.
 */
function FormDateField({ name, label, hint, className, id, placeholder = 'Pick a date' }: FormDateFieldProps) {
	const [field, meta, helpers] = useField<string>(name);
	const fieldId = id ?? name;
	const showError = meta.touched && Boolean(meta.error);

	return (
		<Field id={fieldId} label={label} hint={hint} error={showError ? meta.error : undefined} className={className}>
			<DatePicker
				id={fieldId}
				value={field.value}
				placeholder={placeholder}
				invalid={showError}
				onChange={(value) => void helpers.setValue(value)}
				onCommit={() => void helpers.setTouched(true)}
			/>
		</Field>
	);
}

export { FormField, FormTextarea, FormDateField, FormError };
export type { FormFieldProps, FormTextareaProps, FormDateFieldProps };
