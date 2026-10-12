import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { ContributionEntity, ProfileEntity } from '@/shared/types';
import { ShareCard } from '../quote/share-card';
import { AuthorHeader } from './author-header';
import { ContributionRow } from './contribution-row';
import { ProfileHeader } from './profile-header';

const inRouter = (ui: React.ReactNode) => render(<MemoryRouter>{ui}</MemoryRouter>);

const profile: ProfileEntity = {
	handle: 'ada',
	name: 'Ada Mensah',
	image: null,
	bio: null,
	role: 'member',
	joinedAt: '2026-08-31T23:30:00.000Z',
	showFavorites: false,
	stats: { quotes: 1200, contributions: 31, curated: 6 }
};

describe('ProfileHeader', () => {
	it('shows no badge for a member, the join month in UTC and the profile’s stats', () => {
		inRouter(<ProfileHeader profile={profile} />);
		expect(screen.queryByText('member')).toBeNull();
		expect(screen.getByText('· joined Aug 2026')).toBeInTheDocument();
		expect(screen.getByText('1,200')).toBeInTheDocument();
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Ada Mensah');
	});

	it('badges other roles and falls back to the handle without a name', () => {
		inRouter(<ProfileHeader profile={{ ...profile, name: '', role: 'admin' }} />);
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('@ada');
		expect(screen.getByText('admin')).toHaveAttribute('data-status', 'ADMIN');
	});
});

describe('AuthorHeader', () => {
	it('links its topics and leaves out an empty line', () => {
		inRouter(<AuthorHeader name="Brian W. Kernighan" topics={[{ slug: 'unix', name: 'unix' }]} />);
		expect(screen.getByRole('link', { name: 'unix' })).toHaveAttribute('href', '/topics/unix');
		expect(screen.getByRole('heading', { level: 1 }).nextElementSibling?.tagName).toBe('DIV');
	});
});

describe('ContributionRow', () => {
	const c: ContributionEntity = {
		id: 'q_6h2w8r',
		text: 'Naming things.',
		author: null,
		type: 'canonical',
		status: 'NEEDS_EVIDENCE',
		submittedAt: '2026-08-21T09:00:00.000Z',
		release: null
	};

	it('links to the quote and reads an unknown author plainly', () => {
		inRouter(<ContributionRow contribution={c} />);
		const row = screen.getByRole('link');
		expect(row).toHaveAttribute('href', '/q/6h2w8r');
		expect(row).toHaveTextContent('— unknown · Aug 21');
		expect(row).not.toHaveTextContent('shipped');
	});
});

describe('ShareCard', () => {
	it('starts at 60, 50 or 42px by length, as the kit does', () => {
		const size = (quote: string) => {
			const { unmount } = render(<ShareCard quote={quote} author="x" />);
			const px = (document.querySelector('[data-share="quote"]') as HTMLElement).style.fontSize;
			unmount();
			return px;
		};
		expect(size('a'.repeat(60))).toBe('60px');
		expect(size('a'.repeat(100))).toBe('50px');
		expect(size('a'.repeat(101))).toBe('42px');
	});

	it('is one image named by the quote, at the asked width', () => {
		render(<ShareCard quote="Talk is cheap." author="Linus Torvalds" id="q_1a2b3c" width={300} />);
		const img = screen.getByRole('img', { name: '“Talk is cheap.” — Linus Torvalds' });
		expect(img).toHaveStyle({ width: '300px', height: '157.5px' });
		expect(img).toHaveTextContent('q/1a2b3c');
	});
});
