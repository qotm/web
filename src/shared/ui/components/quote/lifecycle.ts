import type { QuoteEntity } from '@/shared/types';

type Status = QuoteEntity['status'];

/** The two tracks (BUILD-PLAN §4), from the kit. */
const TRACKS = {
	canonical: ['SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'CURATION_REVIEW', 'CURATED', 'DATASET_RELEASE'],
	original: [
		'SUBMITTED',
		'ORIGINALITY_CHECK',
		'PUBLISHED',
		'COMMUNITY_DISCOVERY',
		'CURATION_CANDIDATE',
		'CURATION_REVIEW',
		'CURATED',
		'DATASET_RELEASE'
	]
} as const satisfies Record<string, readonly Status[]>;

/** Where a quote can leave its track. */
const OUTCOMES = ['NEEDS_EVIDENCE', 'DISPUTED', 'REJECTED', 'WITHDRAWN'] as const satisfies readonly Status[];

type Track = keyof typeof TRACKS;
type Outcome = (typeof OUTCOMES)[number];

/** Where a quote stands on its track; LifecycleSteps renders it. */
type Lifecycle = {
	track?: Track;
	/** The step reached (or, with an outcome, the step it left the track at). */
	current: Status;
	outcome?: Outcome | null;
	/** Display dates by step ("Aug 04"). */
	dates?: Partial<Record<Status, string>>;
};

const fmtDate = (iso: string) =>
	new Date(iso).toLocaleDateString('en-US', { month: 'short', day: '2-digit', timeZone: 'UTC' });

/**
 * A quote's place on its track, from the API's status and lifecycle events: an
 * outcome status stops it at the last track step it reached.
 */
function lifecycleOf(q: Pick<QuoteEntity, 'type' | 'status' | 'lifecycle'>): Lifecycle {
	const track: Track = q.type === 'original' ? 'original' : 'canonical';
	const steps: readonly Status[] = TRACKS[track];
	const dates: Partial<Record<Status, string>> = {};
	for (const e of q.lifecycle) dates[e.status] ??= fmtDate(e.at);
	const outcome = (OUTCOMES as readonly Status[]).includes(q.status) ? (q.status as Outcome) : null;
	if (!outcome) return { track, current: steps.includes(q.status) ? q.status : 'SUBMITTED', dates };
	const reached = q.lifecycle.map((e) => e.status).filter((s) => steps.includes(s));
	return { track, current: reached.at(-1) ?? 'SUBMITTED', outcome, dates };
}

export { TRACKS, OUTCOMES, lifecycleOf };
export type { Status, Track, Outcome, Lifecycle };
