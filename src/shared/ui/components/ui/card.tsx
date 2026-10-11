import * as React from 'react';
import { cn } from '../../lib/utils';

type CardProps = Omit<React.HTMLAttributes<HTMLElement>, 'title'> & {
	/** raised (white) · paper · wash (clay-100) · dark (ink). */
	tone?: 'raised' | 'paper' | 'wash' | 'dark';
	/** The mono uppercase eyebrow at the top: "Provenance", "Sounds like". */
	label?: React.ReactNode;
	title?: React.ReactNode;
	/** The whole card is a target: its edge darkens on hover. */
	interactive?: boolean;
	padding?: 'md' | 'sm' | 'none';
	as?: 'div' | 'section' | 'article' | 'aside';
};

const TONES = {
	raised: 'bg-card border-border',
	paper: 'bg-background border-border',
	wash: 'bg-accent border-transparent',
	dark: 'bg-dark border-dark-rule text-dark-foreground'
} as const;

const LABEL_TONES = {
	raised: 'text-link',
	paper: 'text-link',
	wash: 'text-clay-700',
	dark: 'text-dark-accent'
} as const;

/** qotm_kit Card: 1px hairline, radius 14, no shadow. */
function Card({
	tone = 'raised',
	label,
	title,
	interactive,
	padding = 'md',
	as: Tag = 'div',
	className,
	children,
	...props
}: CardProps) {
	return (
		<Tag
			data-slot="card"
			className={cn(
				'box-border rounded-card border text-foreground transition-colors duration-[180ms]',
				TONES[tone],
				padding === 'md' && 'px-card-x py-card-y',
				padding === 'sm' && 'px-4 py-3.5',
				padding === 'none' && 'overflow-hidden p-0',
				interactive && 'cursor-pointer hover:border-foreground',
				className
			)}
			{...props}
		>
			{label ? <CardLabel className={LABEL_TONES[tone]}>{label}</CardLabel> : null}
			{title ? <h3 className="mt-0 mb-2 text-h3">{title}</h3> : null}
			{children}
		</Tag>
	);
}

/** The card's eyebrow, for cards that compose their own head. */
function CardLabel({ className, ...props }: React.ComponentProps<'h4'>) {
	return (
		<h4
			className={cn(
				'mt-0 mb-3 font-mono text-[12px]/[1.15] font-normal tracking-[0.12em] text-link uppercase',
				className
			)}
			{...props}
		/>
	);
}

export { Card, CardLabel };
export type { CardProps };
