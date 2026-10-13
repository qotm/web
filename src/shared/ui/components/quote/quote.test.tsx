import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { QuoteCardEntity } from '@/shared/types';
import { ActionBar } from './action-bar';
import { Attribution } from './attribution';
import { QuoteCard } from './quote-card';

const inRouter = (ui: React.ReactNode) => render(<MemoryRouter>{ui}</MemoryRouter>);

const card = (q: Partial<QuoteCardEntity> = {}): QuoteCardEntity => ({
	id: 'q_8f2k1c',
	text: 'Simplicity is prerequisite for reliability.',
	type: 'canonical',
	status: 'CURATED',
	author: { slug: 'dijkstra', name: 'Edsger W. Dijkstra' },
	attribution: null,
	work: 'EWD 498',
	year: 1975,
	contributor: { handle: 'kofi' },
	topics: [{ slug: 'simplicity', name: 'simplicity' }],
	counts: { likes: 412, favorites: 188, recommends: 0 },
	publishedAt: null,
	...q
});

describe('ActionBar', () => {
	it('flips a toggle and its count at once, and reports the new state', () => {
		const onAction = vi.fn();
		render(<ActionBar counts={{ likes: 1, favorites: 2, recommends: 3 }} onAction={onAction} />);
		fireEvent.click(screen.getByRole('button', { name: 'like 1' }));
		expect(screen.getByRole('button', { name: 'like 2' })).toHaveAttribute('aria-pressed', 'true');
		expect(onAction).toHaveBeenLastCalledWith('like', true);
		fireEvent.click(screen.getByRole('button', { name: 'share' }));
		expect(onAction).toHaveBeenLastCalledWith('share');
	});

	it('takes the parent’s answer over its optimistic flip (a rollback)', () => {
		const { rerender } = render(<ActionBar counts={{ likes: 1 }} state={{ liked: false }} />);
		fireEvent.click(screen.getByRole('button', { name: 'like 1' }));
		expect(screen.getByRole('button', { name: 'like 2' })).toHaveAttribute('aria-pressed', 'true');
		rerender(<ActionBar counts={{ likes: 5 }} state={{ liked: false }} />);
		expect(screen.getByRole('button', { name: 'like 5' })).toHaveAttribute('aria-pressed', 'false');
	});

	it('shows words at md only, and share and report are not toggles', () => {
		const { rerender } = render(<ActionBar state={{ favorited: true }} />);
		expect(screen.getByRole('button', { name: 'favorite' })).toHaveTextContent('favorited');
		expect(screen.getByRole('button', { name: 'report' })).not.toHaveAttribute('aria-pressed');
		rerender(<ActionBar size="sm" state={{ favorited: true }} />);
		expect(screen.getByRole('button', { name: 'favorite' })).not.toHaveTextContent('favorited');
	});
});

describe('Attribution', () => {
	it('credits a former member when the contributor is gone', () => {
		inRouter(<Attribution author="Phil Karlton" contributor={null} />);
		expect(screen.getByText(/submitted by/)).toHaveTextContent('submitted by a former member');
	});

	it('reads an original as declared by its contributor', () => {
		inRouter(<Attribution type="original" contributor="@ada" />);
		expect(screen.getByRole('link', { name: '@ada' })).toHaveAttribute('href', '/@ada');
	});
});

describe('QuoteCard', () => {
	it('links the quote, author, topic and contributor', () => {
		inRouter(<QuoteCard quote={card()} />);
		expect(screen.getByRole('link', { name: /Simplicity/ })).toHaveAttribute('href', '/q/8f2k1c');
		expect(screen.getByRole('link', { name: 'Edsger W. Dijkstra' })).toHaveAttribute('href', '/authors/dijkstra');
		expect(screen.getByRole('link', { name: 'simplicity' })).toHaveAttribute('href', '/topics/simplicity');
		expect(screen.getByRole('link', { name: '@kofi' })).toHaveAttribute('href', '/@kofi');
	});

	it('offers recommend only on community quotes', () => {
		const { unmount } = inRouter(<QuoteCard quote={card()} />);
		expect(screen.queryByRole('button', { name: /^recommend/ })).toBeNull();
		unmount();
		inRouter(<QuoteCard quote={card({ type: 'original', status: 'PUBLISHED', author: null })} />);
		expect(screen.getByRole('button', { name: /^recommend/ })).toBeInTheDocument();
		expect(screen.getByText('declared original')).toBeInTheDocument();
	});

	it('uses the free-text attribution when there is no author page, and shows a private status once', () => {
		inRouter(<QuoteCard quote={card({ type: 'private', status: 'PRIVATE', author: null, attribution: 'my notes' })} />);
		expect(screen.getAllByText('private')).toHaveLength(1);
		expect(screen.getByText(/my notes/)).toBeInTheDocument();
	});

	it('drops topics, source and credit when compact', () => {
		inRouter(<QuoteCard quote={card()} variant="compact" />);
		expect(screen.queryByRole('link', { name: 'simplicity' })).toBeNull();
		expect(screen.queryByText(/EWD 498/)).toBeNull();
		expect(screen.queryByText(/submitted by/)).toBeNull();
	});
});
