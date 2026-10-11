import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { QuoteEntity } from '@/shared/types';
import { Avatar, initials } from './avatar';
import { QUOTE_STATUSES, StatusBadge, statusInfo } from './status-badge';
import { TopicTag } from './topic-tag';

describe('StatusBadge', () => {
	it('names every lifecycle state the API can return', () => {
		const all: QuoteEntity['status'][] = [
			'PRIVATE',
			'SUBMITTED',
			'CURATION_REVIEW',
			'CURATED',
			'DATASET_RELEASE',
			'UNDER_REVIEW',
			'VERIFIED',
			'ORIGINALITY_CHECK',
			'PUBLISHED',
			'COMMUNITY_DISCOVERY',
			'CURATION_CANDIDATE',
			'NEEDS_EVIDENCE',
			'DISPUTED',
			'REJECTED',
			'WITHDRAWN'
		];
		expect(Object.keys(QUOTE_STATUSES).sort()).toEqual([...all].sort());
	});

	it('takes types and roles in any case, and shows the superuser as admin', () => {
		expect(statusInfo('canonical')).toMatchObject({ label: 'canonical', tone: 'neutral' });
		expect(statusInfo('original').label).toBe('declared original');
		expect(statusInfo('superuser')).toMatchObject({ label: 'admin', tone: 'curated' });
		expect(statusInfo('verifier').tone).toBe('positive');
	});

	it('reads an unknown status as neutral words', () => {
		expect(statusInfo('SOMETHING_NEW')).toMatchObject({ label: 'something new', tone: 'neutral', glyph: '' });
	});

	it('hides the glyph and lets a label override the words', () => {
		render(<StatusBadge status="VERIFIED" label="checked" />);
		const badge = screen.getByText('checked');
		expect(badge).toHaveAttribute('data-status', 'VERIFIED');
		expect(badge.querySelector('[aria-hidden="true"]')).toHaveTextContent('✓');
	});
});

describe('Avatar', () => {
	it('takes two initials from a name, else the handle', () => {
		expect(initials('Ada Mensah')).toBe('am');
		expect(initials('Grace Brewster Murray Hopper')).toBe('gb');
		expect(initials(null, '@kofi')).toBe('ko');
		expect(initials()).toBe('?');
	});

	it('is an image named for the member, sized from `size`', () => {
		render(<Avatar name="Ada Mensah" size={64} />);
		const avatar = screen.getByRole('img', { name: 'Ada Mensah' });
		expect(avatar).toHaveStyle({ width: '64px', fontSize: '24px' });
	});
});

describe('TopicTag', () => {
	it('links to the topic, hyphenating the name', () => {
		render(
			<MemoryRouter>
				<TopicTag>software design</TopicTag>
				<TopicTag slug="unix" selected>
					Unix
				</TopicTag>
			</MemoryRouter>
		);
		expect(screen.getByRole('link', { name: 'software design' })).toHaveAttribute('href', '/topics/software-design');
		expect(screen.getByRole('link', { name: 'Unix' })).toHaveAttribute('aria-current', 'page');
	});
});

describe('brand artwork', () => {
	const svgs = import.meta.glob<string>('../brand/svg/*.svg', { query: '?raw', import: 'default', eager: true });

	it('is plain SVG, not a URL-encoded data URI body', () => {
		expect(Object.keys(svgs).length).toBe(11);
		for (const [file, svg] of Object.entries(svgs)) {
			expect(svg, file).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
			expect(svg, file).not.toMatch(/%[0-9A-F]{2}/);
		}
	});

	it('draws the reversed lockups in white', () => {
		for (const [file, svg] of Object.entries(svgs).filter(([f]) => f.endsWith('-white.svg')))
			expect(svg, file).toMatch(/#FFFFFF/i);
	});
});
