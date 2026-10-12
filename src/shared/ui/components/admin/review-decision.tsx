import * as React from 'react';
import type { QuoteEntity } from '@/shared/types';
import { cn } from '../../lib/utils';
import { Button, type ButtonProps } from '../ui/button';
import { Eyebrow } from '../ui/eyebrow';
import { Field } from '../ui/field';
import { Textarea } from '../ui/textarea';

type Status = QuoteEntity['status'];
type Kind = 'verification' | 'curation' | 'moderation';

/** Each review's outcomes, as the kit words them: [status, button, variant]. */
const DECISIONS: Record<Kind, [Status, string, ButtonProps['variant']][]> = {
	verification: [
		['VERIFIED', 'Verify', 'solid'],
		['NEEDS_EVIDENCE', 'Needs evidence', 'outline'],
		['REJECTED', 'Reject', 'quiet']
	],
	curation: [
		['CURATED', 'Curate', 'accent'],
		['VERIFIED', 'Keep out of dataset', 'outline']
	],
	moderation: [
		['PUBLISHED', 'Publish', 'solid'],
		['DISPUTED', 'Mark disputed', 'outline'],
		['WITHDRAWN', 'Withdraw', 'quiet']
	]
};

const QUESTIONS: Record<Kind, string> = {
	verification: 'Did this person actually say or write these words, and is there sufficient evidence?',
	curation: 'Is this quote appropriate and valuable enough to distribute to qotm users by default?',
	moderation: 'Does this quote meet the community guidelines?'
};

type ReviewDecisionProps = {
	kind?: Kind;
	question?: React.ReactNode;
	/** Called with the outcome and the note (trimmed). */
	onDecide?: (status: Status, note: string) => void;
	/** Disables the buttons while a decision is saved. */
	busy?: boolean;
	/** Outcomes that need a note before they can be chosen. */
	noteRequired?: Status[];
	/** Outcomes not open yet (curating with an unticked checklist). */
	unavailable?: Status[];
	className?: string;
};

/** qotm_kit ReviewDecision: the question a reviewer answers, a note for the audit log, and the outcomes. */
function ReviewDecision({
	kind = 'verification',
	question,
	onDecide,
	busy = false,
	noteRequired = [],
	unavailable = [],
	className
}: ReviewDecisionProps) {
	const [note, setNote] = React.useState('');
	const id = React.useId();
	const trimmed = note.trim();
	return (
		<section
			aria-label={`${kind[0].toUpperCase()}${kind.slice(1)} decision`}
			className={cn(
				'box-border flex flex-col gap-stack rounded-card border border-border bg-background px-card-x py-card-y',
				className
			)}
		>
			<Eyebrow tone="clay" className="m-0">
				{kind}
			</Eyebrow>
			<p className="m-0 font-display text-[18px]/[1.4] font-medium">{question ?? QUESTIONS[kind]}</p>
			<Field label="Note" hint="Kept in the audit log with your name." htmlFor={id}>
				<Textarea
					id={id}
					rows={3}
					placeholder="What you checked, and where."
					value={note}
					onChange={(e) => setNote(e.target.value)}
				/>
			</Field>
			<div className="flex flex-wrap gap-2.5">
				{DECISIONS[kind].map(([status, label, variant]) => (
					<Button
						key={status}
						variant={variant}
						disabled={busy || unavailable.includes(status) || (noteRequired.includes(status) && !trimmed)}
						onClick={() => onDecide?.(status, trimmed)}
					>
						{label}
					</Button>
				))}
			</div>
		</section>
	);
}

export { ReviewDecision };
export type { ReviewDecisionProps };
