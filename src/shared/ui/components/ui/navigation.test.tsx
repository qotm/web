import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { Breadcrumbs } from './breadcrumbs';
import { Pagination } from './pagination';
import { SideNav } from './side-nav';
import { Tabs } from './tabs';

const inRouter = (ui: React.ReactNode) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('Tabs', () => {
	it('selects button tabs through onSelect', () => {
		const onSelect = vi.fn();
		render(
			<Tabs
				items={[
					{ id: 'a', label: 'quotes', count: 12 },
					{ id: 'b', label: 'contributions' }
				]}
				active="a"
				onSelect={onSelect}
			/>
		);
		expect(screen.getByRole('tab', { name: /quotes\s*12/ })).toHaveAttribute('aria-selected', 'true');
		fireEvent.click(screen.getByRole('tab', { name: 'contributions' }));
		expect(onSelect).toHaveBeenCalledWith('b');
	});

	it('renders link tabs with the current page marked', () => {
		inRouter(
			<Tabs
				items={[
					{ id: 'latest', label: 'latest', to: '/latest' },
					{ id: 'curated', label: 'curated', to: '/curated' }
				]}
				active="curated"
			/>
		);
		expect(screen.getByRole('tab', { name: 'curated' })).toHaveAttribute('href', '/curated');
		expect(screen.getByRole('tab', { name: 'curated' })).toHaveAttribute('aria-current', 'page');
		expect(screen.getByRole('tab', { name: 'latest' })).not.toHaveAttribute('aria-current');
	});
});

describe('Pagination', () => {
	it('shows the range and disables prev on the first page', () => {
		const onPage = vi.fn();
		render(<Pagination page={1} pageSize={25} total={30} onPage={onPage} />);
		expect(screen.getByRole('navigation')).toHaveTextContent('1–25 of 30');
		expect(screen.getByRole('button', { name: /prev/ })).toBeDisabled();
		fireEvent.click(screen.getByRole('button', { name: /next/ }));
		expect(onPage).toHaveBeenCalledWith(2);
	});

	it('disables next on the last page and reads an empty list as 0–0', () => {
		const { rerender } = render(<Pagination page={2} pageSize={25} total={30} />);
		expect(screen.getByRole('navigation')).toHaveTextContent('26–30 of 30');
		expect(screen.getByRole('button', { name: /next/ })).toBeDisabled();
		rerender(<Pagination total={0} />);
		expect(screen.getByRole('navigation')).toHaveTextContent('0–0 of 0');
		expect(screen.getByRole('navigation')).toHaveTextContent('1 / 1');
	});

	it('loads more, and waits while loading', () => {
		const onPage = vi.fn();
		const { rerender } = render(<Pagination mode="more" page={3} onPage={onPage} />);
		fireEvent.click(screen.getByRole('button', { name: 'load more' }));
		expect(onPage).toHaveBeenCalledWith(4);
		rerender(<Pagination mode="more" loading />);
		expect(screen.getByRole('button', { name: 'loading…' })).toBeDisabled();
	});
});

describe('Breadcrumbs', () => {
	it('links all but the last crumb, which is the current page', () => {
		inRouter(<Breadcrumbs items={[{ label: 'authors', to: '/authors' }, 'dijkstra']} />);
		expect(screen.getByRole('link', { name: 'authors' })).toHaveAttribute('href', '/authors');
		expect(screen.getByText('dijkstra')).toHaveAttribute('aria-current', 'page');
	});
});

describe('SideNav', () => {
	it('marks the active item, flags attention counts and selects', () => {
		const onSelect = vi.fn();
		inRouter(
			<SideNav
				active="v"
				onSelect={onSelect}
				sections={[
					{
						title: 'Content',
						items: [
							{ id: 'v', label: 'Verification queue', count: 12, attention: true, to: '/admin/verification' },
							{ id: 'c', label: 'Curation queue', count: 7, to: '/admin/curation' }
						]
					}
				]}
			/>
		);
		const active = screen.getByRole('link', { name: /Verification queue/ });
		expect(active).toHaveAttribute('aria-current', 'page');
		expect(active.querySelector('[data-attention]')).toHaveTextContent('12');
		fireEvent.click(screen.getByRole('link', { name: /Curation queue/ }));
		expect(onSelect).toHaveBeenCalledWith('c');
	});
});
