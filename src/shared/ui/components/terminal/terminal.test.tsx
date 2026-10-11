import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CommandBlock } from './command-block';
import { InstallPill } from './install-pill';
import { Cursor, Prompt, Terminal } from './terminal';

const writeText = vi.fn<(text: string) => Promise<void>>();

beforeEach(() => {
	vi.useFakeTimers();
	writeText.mockReset().mockResolvedValue(undefined);
	Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
});
afterEach(() => vi.useRealTimers());

const click = async (el: HTMLElement) => {
	await act(async () => {
		fireEvent.click(el);
	});
};

describe('CommandBlock', () => {
	it('copies the command, announces it and resets after 1.4s', async () => {
		render(<CommandBlock command="qotm open q_8f2k1c" caption="Open this in your terminal" />);
		const button = screen.getByRole('button', { name: 'Copy qotm open q_8f2k1c' });
		await click(button);
		expect(writeText).toHaveBeenCalledWith('qotm open q_8f2k1c');
		expect(button).toHaveTextContent('copied');
		expect(screen.getByRole('status')).toHaveTextContent('Copied “qotm open q_8f2k1c” to the clipboard');
		act(() => vi.advanceTimersByTime(1400));
		expect(button).toHaveTextContent('copy');
		expect(screen.getByRole('status')).toBeEmptyDOMElement();
	});

	it('says so when the browser refuses the clipboard', async () => {
		writeText.mockRejectedValue(new Error('denied'));
		render(<CommandBlock command="qotm --favorites" tone="light" />);
		await click(screen.getByRole('button'));
		expect(screen.getByRole('button')).toHaveTextContent('select to copy');
		expect(screen.getByRole('status')).toHaveTextContent('Could not copy');
	});
});

describe('InstallPill', () => {
	it('is plain text unless copyable', async () => {
		const { rerender } = render(<InstallPill />);
		expect(screen.queryByRole('button')).toBeNull();
		expect(screen.getByText('npm i -g qotm')).toBeInTheDocument();
		rerender(<InstallPill copyable />);
		await click(screen.getByRole('button', { name: 'Copy npm i -g qotm' }));
		expect(writeText).toHaveBeenCalledWith('npm i -g qotm');
	});
});

describe('Terminal', () => {
	it('renders its title and body; prompt and cursor are decorative', () => {
		render(
			<Terminal title="~/projects">
				<Prompt /> qotm
				<Cursor data-testid="cursor" />
			</Terminal>
		);
		expect(screen.getByText('~/projects')).toBeInTheDocument();
		expect(screen.getByText('~ >')).toHaveAttribute('aria-hidden', 'true');
		expect(screen.getByTestId('cursor')).toHaveAttribute('aria-hidden', 'true');
	});
});
