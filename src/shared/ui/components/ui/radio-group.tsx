import * as React from 'react';
import { cn } from '../../lib/utils';

type RadioOption = {
	value: string;
	label: React.ReactNode;
	description?: React.ReactNode;
	disabled?: boolean;
};

type RadioGroupProps = Omit<React.ComponentProps<'fieldset'>, 'onChange' | 'defaultValue'> & {
	label?: React.ReactNode;
	name?: string;
	options: RadioOption[];
	value?: string;
	defaultValue?: string;
	onChange?: (value: string) => void;
	/** `card`: each option a bordered panel with its description (quote type, report reason). */
	variant?: 'list' | 'card';
};

/** qotm_kit RadioGroup: one choice from a few. */
function RadioGroup({
	label,
	name,
	options,
	value,
	defaultValue,
	onChange,
	variant = 'list',
	className,
	...props
}: RadioGroupProps) {
	const auto = React.useId();
	const [inner, setInner] = React.useState(defaultValue);
	const current = value !== undefined ? value : inner;
	const card = variant === 'card';
	return (
		<fieldset
			className={cn(
				'm-0 min-w-0 border-0 p-0',
				card ? 'grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3' : 'flex flex-col gap-2.5',
				className
			)}
			{...props}
		>
			{label ? (
				<legend className={cn('mb-2 text-label text-muted-foreground', card && 'col-span-full')}>{label}</legend>
			) : null}
			{options.map((option) => {
				const checked = current === option.value;
				return (
					<label
						key={option.value}
						data-checked={checked || undefined}
						className={cn(
							'relative flex cursor-pointer items-start gap-3 text-[15px]/[1.4]',
							card &&
								'rounded-card border border-border bg-card px-4.5 py-4 transition-colors duration-[180ms] hover:border-stone-400 data-checked:border-foreground data-checked:hover:border-foreground',
							option.disabled && 'cursor-not-allowed opacity-55'
						)}
					>
						<input
							type="radio"
							name={name ?? auto}
							value={option.value}
							checked={checked}
							disabled={option.disabled}
							onChange={() => {
								setInner(option.value);
								onChange?.(option.value);
							}}
							className="peer absolute m-0 size-px opacity-0"
						/>
						<span
							aria-hidden="true"
							className={cn(
								'mt-px box-border flex size-[18px] flex-none items-center justify-center rounded-[50%] border bg-card',
								'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring',
								checked ? 'border-clay-500' : 'border-stone-400'
							)}
						>
							{checked ? <span className="size-2 rounded-[50%] bg-clay-500" /> : null}
						</span>
						<span className="flex flex-col gap-[3px]">
							<span className="font-medium">{option.label}</span>
							{option.description ? (
								<span className="text-meta leading-[1.5] text-muted-foreground">{option.description}</span>
							) : null}
						</span>
					</label>
				);
			})}
		</fieldset>
	);
}

export { RadioGroup };
export type { RadioGroupProps, RadioOption };
