import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { fileSize } from '../../lib/format';
import { DataTable } from './data-table';
import { MatchCompare } from './match-compare';
import { ReleaseSummary } from './release-summary';
import { ReviewDecision } from './review-decision';

type Row = { id: string; status: string; count: number };
const rows: Row[] = [
	{ id: 'q_1', status: 'SUBMITTED', count: 1200 },
	{ id: 'q_2', status: 'VERIFIED', count: 3 }
];
const columns = [
	{ key: 'id', label: 'id', mono: true },
	{ key: 'status', label: 'state' },
	{ key: 'count', label: 'count' }
];

describe('DataTable', () => {
	it('renders status as a badge and numbers with separators', () => {
		render(<DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />);
		const table = within(screen.getByRole('table'));
		expect(table.getByText('submitted')).toHaveAttribute('data-status', 'SUBMITTED');
		expect(table.getByText('1,200')).toBeInTheDocument();
	});

	it('shows the empty line across every column', () => {
		render(<DataTable columns={columns} rows={[]} rowKey={(r: Row) => r.id} selectable empty="Nothing waiting." />);
		expect(within(screen.getByRole('table')).getByText('Nothing waiting.')).toHaveAttribute('colspan', '4');
	});

	it('selects rows and all, reporting the keys, and a checkbox does not open the row', () => {
		const onSelect = vi.fn();
		const onRowClick = vi.fn();
		render(
			<DataTable
				columns={columns}
				rows={rows}
				rowKey={(r) => r.id}
				selectable
				onSelect={onSelect}
				onRowClick={onRowClick}
			/>
		);
		const table = within(screen.getByRole('table'));
		fireEvent.click(table.getByRole('checkbox', { name: 'Select q_2' }));
		expect(onSelect).toHaveBeenLastCalledWith(['q_2']);
		expect(onRowClick).not.toHaveBeenCalled();
		const all = table.getByRole('checkbox', { name: 'Select all' }) as HTMLInputElement;
		expect(all.indeterminate).toBe(true);
		fireEvent.click(all);
		expect(onSelect).toHaveBeenLastCalledWith(['q_1', 'q_2']);
		fireEvent.click(all);
		expect(onSelect).toHaveBeenLastCalledWith([]);
	});

	it('opens a row by click, Enter or Space', () => {
		const onRowClick = vi.fn();
		render(
			<DataTable
				columns={columns}
				rows={rows}
				rowKey={(r) => r.id}
				onRowClick={onRowClick}
				rowLabel={(r) => `Open ${r.id}`}
			/>
		);
		const row = screen.getByRole('row', { name: 'Open q_1' });
		expect(row).toHaveAttribute('tabindex', '0');
		fireEvent.click(row);
		fireEvent.keyDown(row, { key: 'Enter' });
		fireEvent.keyDown(row, { key: ' ' });
		fireEvent.keyDown(row, { key: 'a' });
		expect(onRowClick).toHaveBeenCalledTimes(3);
	});
});

describe('DataTable as cards (a phone)', () => {
	it('puts the id, state and end on top, the main column as the title and the rest as meta', () => {
		render(<DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />);
		const card = within(screen.getAllByRole('listitem')[0]!);
		expect(card.getByText('q_1')).toBeInTheDocument();
		expect(card.getByText('submitted')).toHaveAttribute('data-status', 'SUBMITTED');
	});

	it('opens a card like a row, and selects with its own checkbox', () => {
		const onRowClick = vi.fn();
		const onSelect = vi.fn();
		render(
			<DataTable
				columns={columns}
				rows={rows}
				rowKey={(r) => r.id}
				selectable
				onSelect={onSelect}
				onRowClick={onRowClick}
				rowLabel={(r) => `Open ${r.id}`}
			/>
		);
		const card = screen.getByRole('listitem', { name: 'Open q_2' });
		fireEvent.keyDown(card, { key: 'Enter' });
		expect(onRowClick).toHaveBeenCalledTimes(1);
		fireEvent.click(within(card).getByRole('checkbox', { name: 'Select q_2' }));
		expect(onSelect).toHaveBeenLastCalledWith(['q_2']);
		expect(onRowClick).toHaveBeenCalledTimes(1);
	});
});

describe('ReleaseSummary', () => {
	const release = {
		version: 'v2026.09.1',
		state: 'DRAFT' as const,
		eligible: 10,
		added: 1,
		corrected: 0,
		withdrawn: 0,
		sizeBytes: null,
		sha256: null,
		publishedAt: null
	};

	it('can only publish a built preview, and nothing while busy', () => {
		const { rerender } = render(<ReleaseSummary release={release} />);
		expect(screen.getByRole('button', { name: 'Publish' })).toBeDisabled();
		expect(screen.getByText('draft')).toBeInTheDocument();
		rerender(<ReleaseSummary release={{ ...release, state: 'PREVIEW' }} busy />);
		expect(screen.getByRole('button', { name: 'Publish' })).toBeDisabled();
		expect(screen.getByRole('button', { name: 'Build preview' })).toBeDisabled();
	});

	it('writes sizes as the kit does', () => {
		expect(fileSize(512)).toBe('512 B');
		expect(fileSize(2936013)).toBe('2.8 MB');
		expect(fileSize(1536)).toBe('1.5 KB');
	});
});

describe('ReviewDecision', () => {
	it('sends the outcome with the trimmed note', () => {
		const onDecide = vi.fn();
		render(<ReviewDecision kind="moderation" onDecide={onDecide} />);
		fireEvent.change(screen.getByRole('textbox', { name: 'Note' }), { target: { value: '  Off topic.  ' } });
		fireEvent.click(screen.getByRole('button', { name: 'Withdraw' }));
		expect(onDecide).toHaveBeenCalledWith('WITHDRAWN', 'Off topic.');
	});

	it('holds an outcome that needs a note until one is written', () => {
		render(<ReviewDecision kind="verification" noteRequired={['NEEDS_EVIDENCE', 'REJECTED']} />);
		const section = screen.getByRole('region', { name: 'Verification decision' });
		expect(within(section).getByRole('button', { name: 'Reject' })).toBeDisabled();
		expect(within(section).getByRole('button', { name: 'Verify' })).toBeEnabled();
		fireEvent.change(screen.getByRole('textbox', { name: 'Note' }), { target: { value: 'No source.' } });
		expect(within(section).getByRole('button', { name: 'Reject' })).toBeEnabled();
	});

	it('has the curation outcomes', () => {
		render(<ReviewDecision kind="curation" />);
		expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(['Curate', 'Keep out of dataset']);
	});
});

describe('MatchCompare', () => {
	it('reads an exact match without a score', () => {
		render(
			<MatchCompare
				submitted="a"
				match={{ method: 'exact', score: null, match: { id: 'q_1', text: 'a', author: null } }}
			/>
		);
		expect(screen.getByRole('region', { name: 'Possible match' })).toHaveTextContent('normalized exact match');
		expect(screen.queryByText(/similar/)).toBeNull();
	});
});
