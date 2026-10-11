import * as React from 'react';
import type { QuoteEntity } from '@/shared/types';
import { cn, glyph } from '../../lib/utils';

type Tone = 'neutral' | 'pending' | 'attention' | 'positive' | 'curated' | 'negative';

/** Every lifecycle state (BUILD-PLAN §4) as the kit names it: [label, tone, glyph]. */
const QUOTE_STATUSES = {
	PRIVATE: ['private', 'neutral', '·'],
	SUBMITTED: ['submitted', 'pending', '○'],
	UNDER_REVIEW: ['under review', 'pending', '…'],
	NEEDS_EVIDENCE: ['needs evidence', 'attention', '?'],
	REJECTED: ['rejected', 'negative', '×'],
	VERIFIED: ['verified', 'positive', '✓'],
	CURATION_REVIEW: ['curation review', 'pending', '…'],
	CURATION_CANDIDATE: ['curation candidate', 'pending', '↑'],
	CURATED: ['curated', 'curated', '❯'],
	DATASET_RELEASE: ['in release', 'curated', '❯'],
	ORIGINALITY_CHECK: ['originality check', 'pending', '…'],
	PUBLISHED: ['published', 'positive', '✓'],
	COMMUNITY_DISCOVERY: ['in community', 'pending', '·'],
	DISPUTED: ['disputed', 'attention', '!'],
	WITHDRAWN: ['withdrawn', 'negative', '−']
} as const satisfies Record<QuoteEntity['status'], readonly [string, Tone, string]>;

/** Quote types, visibility and roles share the badge. The superuser shows as admin. */
const OTHER_STATUSES = {
	CANONICAL: ['canonical', 'neutral', ''],
	ORIGINAL: ['declared original', 'neutral', ''],
	PUBLIC: ['public', 'neutral', ''],
	PERSONAL: ['personal', 'neutral', ''],
	COMMUNITY: ['community', 'neutral', ''],
	MEMBER: ['member', 'neutral', ''],
	VERIFIER: ['verifier', 'positive', ''],
	MODERATOR: ['moderator', 'positive', ''],
	ADMIN: ['admin', 'curated', ''],
	SUPERUSER: ['admin', 'curated', '']
} as const satisfies Record<string, readonly [string, Tone, string]>;

const STATUSES: Record<string, readonly [string, Tone, string]> = { ...QUOTE_STATUSES, ...OTHER_STATUSES };

type Status = keyof typeof QUOTE_STATUSES | keyof typeof OTHER_STATUSES;

const TONES: Record<Tone, string> = {
	neutral: 'border-border text-stone-600',
	pending: 'border-dashed border-border text-stone-600',
	attention: 'bg-clay-100 text-clay-700',
	positive: 'border-stone-400 bg-card text-ink [&>[data-glyph]]:text-clay-600',
	curated: 'bg-ink text-paper [&>[data-glyph]]:text-clay-400',
	negative: 'border-border text-stone-600 line-through decoration-stone-400 [&>[data-glyph]]:inline-block'
};

type StatusBadgeProps = Omit<React.ComponentProps<'span'>, 'children'> & {
	/** A quote status, type (`canonical`, `original`), visibility or role, in any case. */
	status: Status | Lowercase<Status> | (string & {});
	/** Overrides the kit's wording. */
	label?: string;
};

/** The label, tone and glyph the kit gives a status; unknown ones read as neutral text. */
function statusInfo(status: string) {
	const key = status.toUpperCase();
	const [label, tone, mark] = STATUSES[key] ?? [key.toLowerCase().replace(/_/g, ' '), 'neutral', ''];
	return { key, label, tone, glyph: mark };
}

/** qotm_kit StatusBadge: a quote's lifecycle state, type or a member's role. Words, not colour, carry the meaning. */
function StatusBadge({ status, label, className, ...props }: StatusBadgeProps) {
	const info = statusInfo(status);
	return (
		<span
			data-status={info.key}
			className={cn(
				'inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill border border-transparent px-[9px] py-px font-mono text-[11px]/[18px] tracking-[0.12em] uppercase',
				TONES[info.tone],
				className
			)}
			{...props}
		>
			{info.glyph ? (
				<span aria-hidden="true" data-glyph className="text-[12px] tracking-normal no-underline">
					{glyph(info.glyph)}
				</span>
			) : null}
			{label ?? info.label}
		</span>
	);
}

export { StatusBadge, statusInfo, QUOTE_STATUSES };
export type { StatusBadgeProps };
