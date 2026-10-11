import * as React from 'react';
import { useField } from 'formik';
import { Field } from '../ui/field';
import { Input, type InputProps } from '../ui/input';
import { Textarea, type TextareaProps } from '../ui/textarea';
import { Select, type SelectProps } from '../ui/select';
import { Checkbox, type CheckboxProps } from '../ui/checkbox';
import { Switch, type SwitchProps } from '../ui/switch';
import { RadioGroup, type RadioGroupProps } from '../ui/radio-group';
import { TopicPicker, type TopicPickerProps } from '../ui/topic-picker';
import { cn, glyph } from '../../lib/utils';

/**
 * Formik-bound kit fields: each renders the kit's Field (mono label, hint,
 * clay-700 error once touched) around its control. Must render inside a
 * <Formik>.
 */
type Labelled = {
	name: string;
	label?: React.ReactNode;
	hint?: React.ReactNode;
	required?: boolean;
	optional?: boolean;
};

function useKitField<V>(name: string) {
	const [field, meta, helpers] = useField<V>(name);
	const error = meta.touched && meta.error ? meta.error : undefined;
	return { field, helpers, error };
}

/** A form-level error (the request failed), in the field error's voice. */
function FormError({ className, children }: { className?: string; children: React.ReactNode }) {
	return (
		<p role="alert" className={cn('m-0 text-meta text-clay-700', className)}>
			{glyph('×')} {children}
		</p>
	);
}

type FormFieldProps = Labelled & Omit<InputProps, 'name'>;

function FormField({ name, label, hint, required, optional, className, id, ...props }: FormFieldProps) {
	const { field, error } = useKitField<string>(name);
	const fieldId = id ?? name;
	return (
		<Field
			htmlFor={fieldId}
			label={label}
			hint={hint}
			error={error}
			required={required}
			optional={optional}
			className={className}
		>
			<Input id={fieldId} aria-invalid={Boolean(error) || undefined} required={required} {...field} {...props} />
		</Field>
	);
}

type FormTextareaProps = Labelled & Omit<TextareaProps, 'name'>;

/** With a maxLength, the label shows a live count ("42 / 280"). */
function FormTextarea({
	name,
	label,
	hint,
	required,
	optional,
	className,
	id,
	maxLength,
	...props
}: FormTextareaProps) {
	const { field, error } = useKitField<string>(name);
	const fieldId = id ?? name;
	return (
		<Field
			htmlFor={fieldId}
			label={label}
			hint={hint}
			error={error}
			required={required}
			optional={optional}
			count={maxLength ? `${(field.value ?? '').length} / ${maxLength}` : undefined}
			className={className}
		>
			<Textarea
				id={fieldId}
				maxLength={maxLength}
				aria-invalid={Boolean(error) || undefined}
				required={required}
				{...field}
				{...props}
			/>
		</Field>
	);
}

type FormSelectProps = Labelled & Omit<SelectProps, 'name'>;

function FormSelect({ name, label, hint, required, optional, className, id, ...props }: FormSelectProps) {
	const { field, error } = useKitField<string>(name);
	const fieldId = id ?? name;
	return (
		<Field
			htmlFor={fieldId}
			label={label}
			hint={hint}
			error={error}
			required={required}
			optional={optional}
			className={className}
		>
			<Select id={fieldId} aria-invalid={Boolean(error) || undefined} {...field} {...props} />
		</Field>
	);
}

type FormCheckboxProps = { name: string } & Omit<CheckboxProps, 'name' | 'checked'>;

function FormCheckbox({ name, className, ...props }: FormCheckboxProps) {
	const { field, error } = useKitField<boolean>(name);
	return (
		<div className={cn('flex flex-col gap-2', className)}>
			<Checkbox
				name={name}
				checked={Boolean(field.value)}
				onChange={field.onChange}
				onBlur={field.onBlur}
				aria-invalid={Boolean(error) || undefined}
				{...props}
			/>
			{error ? <FormError>{error}</FormError> : null}
		</div>
	);
}

type FormSwitchProps = { name: string } & Omit<SwitchProps, 'name' | 'checked'>;

function FormSwitch({ name, ...props }: FormSwitchProps) {
	const { field } = useKitField<boolean>(name);
	return (
		<Switch name={name} checked={Boolean(field.value)} onChange={field.onChange} onBlur={field.onBlur} {...props} />
	);
}

type FormRadioGroupProps = { name: string } & Omit<RadioGroupProps, 'name' | 'value' | 'onChange'>;

function FormRadioGroup({ name, className, ...props }: FormRadioGroupProps) {
	const { field, helpers, error } = useKitField<string>(name);
	return (
		<div className={cn('flex flex-col gap-2', className)}>
			<RadioGroup
				name={name}
				value={field.value}
				onChange={(value) => {
					void helpers.setValue(value);
					void helpers.setTouched(true, false);
				}}
				{...props}
			/>
			{error ? <FormError>{error}</FormError> : null}
		</div>
	);
}

type FormTopicPickerProps = { name: string } & Omit<TopicPickerProps, 'value' | 'onChange' | 'error'>;

function FormTopicPicker({ name, ...props }: FormTopicPickerProps) {
	const { field, helpers, error } = useKitField<string[]>(name);
	return (
		<TopicPicker
			value={field.value ?? []}
			onChange={(slugs) => {
				void helpers.setValue(slugs);
				void helpers.setTouched(true, false);
			}}
			error={error}
			{...props}
		/>
	);
}

export { FormField, FormTextarea, FormSelect, FormCheckbox, FormSwitch, FormRadioGroup, FormTopicPicker, FormError };
export type {
	FormFieldProps,
	FormTextareaProps,
	FormSelectProps,
	FormCheckboxProps,
	FormSwitchProps,
	FormRadioGroupProps,
	FormTopicPickerProps
};
