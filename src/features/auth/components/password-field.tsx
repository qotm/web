import { type ReactNode, useState } from 'react';
import { useField } from 'formik';
import { FormError, Input, Label, cn } from '@/shared/ui';
import { scorePassword } from '../lib/password-strength';

function StrengthMeter({ score }: { score: number }) {
	const activeColor = ['bg-border', 'bg-negative', 'bg-warning', 'bg-positive'][score];
	return (
		<div className="mt-1 flex gap-1" aria-hidden="true">
			{[1, 2, 3].map((bar) => (
				<span key={bar} className={cn('h-1 flex-1 rounded-full', bar <= score ? activeColor : 'bg-border')} />
			))}
		</div>
	);
}

type PasswordFieldProps = {
	name: string;
	label?: string;
	placeholder?: string;
	autoComplete?: string;
	showStrength?: boolean;
	/** Replaces the show/hide toggle in the label row (e.g. a "Forgot password?" link). */
	action?: ReactNode;
};

export function PasswordField({
	name,
	label = 'Password',
	placeholder,
	autoComplete = 'current-password',
	showStrength = false,
	action
}: PasswordFieldProps) {
	const [field, meta] = useField(name);
	const [visible, setVisible] = useState(false);
	const showError = meta.touched && Boolean(meta.error);
	const strength = showStrength ? scorePassword((field.value as string) ?? '') : null;

	return (
		<div className="flex flex-col gap-1.5">
			<div className="flex items-center justify-between">
				<Label htmlFor={name}>{label}</Label>
				{action ?? (
					<button
						type="button"
						onClick={() => setVisible((value) => !value)}
						className="text-xs font-semibold text-ink-deep"
					>
						{visible ? 'Hide' : 'Show'}
					</button>
				)}
			</div>
			<Input
				id={name}
				type={visible ? 'text' : 'password'}
				placeholder={placeholder}
				autoComplete={autoComplete}
				aria-invalid={showError || undefined}
				{...field}
			/>
			{strength ? <StrengthMeter score={strength.score} /> : null}
			{showError ? (
				<FormError>{meta.error}</FormError>
			) : strength ? (
				<p className="text-xs text-mute">{strength.label}</p>
			) : null}
		</div>
	);
}
