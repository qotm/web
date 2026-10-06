import * as React from 'react';
import { cn } from '../../lib/utils';

/**
 * Wise card anatomy: white surface, 24px radius, 24px padding, NO shadow.
 * Elevation comes from surface contrast (white card on sage), not shadows.
 */
function Card({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="card"
			className={cn('flex flex-col gap-6 rounded-3xl bg-card p-6 text-card-foreground', className)}
			{...props}
		/>
	);
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
	return <div data-slot="card-header" className={cn('flex flex-col gap-1.5', className)} {...props} />;
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="card-title"
			className={cn('font-display text-2xl font-semibold tracking-tight', className)}
			{...props}
		/>
	);
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
	return <div data-slot="card-description" className={cn('text-sm text-mute', className)} {...props} />;
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
	return <div data-slot="card-content" className={cn('flex flex-col gap-4', className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
	return <div data-slot="card-footer" className={cn('flex items-center gap-3', className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
