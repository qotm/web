import type { ComponentProps, ReactNode } from 'react';
import { Button, Spinner, cn } from '@/shared/ui';

type SubmitButtonProps = ComponentProps<typeof Button> & {
	loading?: boolean;
	children: ReactNode;
};

export function SubmitButton({ loading, children, className, disabled, ...props }: SubmitButtonProps) {
	return (
		<Button type="submit" className={cn('w-full', className)} disabled={disabled || loading} {...props}>
			{loading ? <Spinner /> : null}
			{children}
		</Button>
	);
}
