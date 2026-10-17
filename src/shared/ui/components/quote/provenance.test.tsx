import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { QuoteEntity } from '@/shared/types';
import { OUTCOMES, TRACKS, lifecycleOf } from './lifecycle';
import { LifecycleSteps } from './lifecycle-steps';
import { ProvenancePanel } from './provenance-panel';

const quote = (q: Partial<QuoteEntity> = {}): QuoteEntity => ({
	id: 'q_8f2k1c',
	text: 'Simplicity is prerequisite for reliability.',
	type: 'canonical',
	status: 'VERIFIED',
	author: { slug: 'dijkstra', name: 'Edsger W. Dijkstra' },
	attribution: null,
	work: 'EWD 498',
	year: 1975,
	contributor: { handle: 'kofi' },
	topics: [],
	counts: { likes: 0, favorites: 0, recommends: 0 },
	publishedAt: null,
	context: null,
	sourceUrl: null,
	source: null,
	verifier: null,
	verifiedAt: null,
	lifecycle: [],
	corrections: [],
	releases: [],
	...q
});

const at = (status: QuoteEntity['status'], day: number) => ({
	status,
	at: `2026-08-${String(day).padStart(2, '0')}T12:00:00.000Z`
});

describe('lifecycleOf', () => {
	it('places a canonical quote on its track, with dated steps', () => {
		const l = lifecycleOf(
			quote({ status: 'VERIFIED', lifecycle: [at('SUBMITTED', 4), at('UNDER_REVIEW', 5), at('VERIFIED', 9)] })
		);
		expect(l).toEqual({
			track: 'canonical',
			current: 'VERIFIED',
			dates: { SUBMITTED: 'Aug 04', UNDER_REVIEW: 'Aug 05', VERIFIED: 'Aug 09' }
		});
	});

	it('uses the original track for originals', () => {
		expect(lifecycleOf(quote({ type: 'original', status: 'COMMUNITY_DISCOVERY' }))).toMatchObject({
			track: 'original',
			current: 'COMMUNITY_DISCOVERY'
		});
	});

	it.each(OUTCOMES)('stops at the last step reached for %s', (outcome) => {
		const l = lifecycleOf(
			quote({ status: outcome, lifecycle: [at('SUBMITTED', 4), at('UNDER_REVIEW', 5), at(outcome, 6)] })
		);
		expect(l).toMatchObject({ current: 'UNDER_REVIEW', outcome });
	});

	it('keeps the first date when a step repeats', () => {
		const l = lifecycleOf(quote({ status: 'UNDER_REVIEW', lifecycle: [at('UNDER_REVIEW', 5), at('UNDER_REVIEW', 7)] }));
		expect(l.dates?.UNDER_REVIEW).toBe('Aug 05');
	});
});

describe('LifecycleSteps', () => {
	it.each(Object.keys(TRACKS) as (keyof typeof TRACKS)[])('renders the whole %s track', (track) => {
		render(<LifecycleSteps track={track} current="SUBMITTED" />);
		expect(screen.getAllByRole('listitem')).toHaveLength(TRACKS[track].length);
	});

	it.each([
		['NEEDS_EVIDENCE', '?'],
		['DISPUTED', '!'],
		['REJECTED', '×'],
		['WITHDRAWN', '−']
	] as const)('marks %s off the track with its glyph and word', (outcome, mark) => {
		render(<LifecycleSteps current="UNDER_REVIEW" outcome={outcome} orientation="vertical" />);
		const step = screen.getByRole('listitem', { current: 'step' });
		expect(step).toHaveAttribute('data-state', 'off');
		expect(step.querySelector('[aria-hidden]')).toHaveTextContent(mark);
		expect(step).toHaveTextContent(outcome.toLowerCase().replace('_', ' '));
		expect(screen.getAllByRole('listitem')[0]).toHaveAttribute('data-state', 'done');
	});
});

describe('ProvenancePanel', () => {
	const inRouter = (ui: React.ReactNode) => render(<MemoryRouter>{ui}</MemoryRouter>);

	it('skips empty rows and credits a former member', () => {
		inRouter(<ProvenancePanel quote={quote({ contributor: null, work: null })} />);
		const panel = screen.getByRole('region', { name: 'Provenance' });
		expect(within(panel).queryByText('Work')).toBeNull();
		expect(within(panel).queryByText('Verified by')).toBeNull();
		expect(panel).toHaveTextContent('Submitted bya former member');
	});

	it('falls back to the free-text attribution and the source url', () => {
		inRouter(
			<ProvenancePanel quote={quote({ author: null, attribution: 'Anonymous', sourceUrl: 'https://example.com/a' })} />
		);
		expect(screen.getByText('Anonymous')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'https://example.com/a' })).toHaveAttribute('rel', 'noopener noreferrer');
	});
});
