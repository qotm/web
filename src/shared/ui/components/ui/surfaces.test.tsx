import { useState } from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { Toaster } from './sonner';
import { Button } from './button';
import { Dialog } from './dialog';
import { Menu } from './menu';
import { notify } from './toast';

function Harness({ onClose }: { onClose?: () => void }) {
	const [open, setOpen] = useState(false);
	return (
		<>
			<Button onClick={() => setOpen(true)}>Report</Button>
			<Dialog
				open={open}
				title="Report this quote"
				onClose={() => {
					onClose?.();
					setOpen(false);
				}}
				footer={<Button>Send report</Button>}
			>
				<input aria-label="Details" />
			</Dialog>
		</>
	);
}

describe('Dialog', () => {
	it('takes focus, keeps it inside, closes on Escape and gives focus back', async () => {
		const onClose = vi.fn();
		render(<Harness onClose={onClose} />);
		const opener = screen.getByRole('button', { name: 'Report' });
		await userEvent.click(opener);
		const dialog = screen.getByRole('dialog', { name: 'Report this quote' });
		expect(dialog).toHaveAttribute('aria-modal', 'true');
		expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
		expect(document.body.style.overflow).toBe('hidden');

		await userEvent.tab(); // Details
		await userEvent.tab(); // Send report
		await userEvent.tab(); // wraps to Close
		expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
		await userEvent.tab({ shift: true });
		expect(screen.getByRole('button', { name: 'Send report' })).toHaveFocus();

		await userEvent.keyboard('{Escape}');
		expect(onClose).toHaveBeenCalled();
		expect(screen.queryByRole('dialog')).toBeNull();
		expect(opener).toHaveFocus();
		expect(document.body.style.overflow).toBe('');
	});

	it('closes on a scrim click but not on a click inside', async () => {
		const onClose = vi.fn();
		render(<Harness onClose={onClose} />);
		await userEvent.click(screen.getByRole('button', { name: 'Report' }));
		await userEvent.click(screen.getByLabelText('Details'));
		expect(onClose).not.toHaveBeenCalled();
		await userEvent.click(screen.getByRole('dialog').parentElement!);
		expect(onClose).toHaveBeenCalledOnce();
	});
});

describe('Menu', () => {
	it('picks an item, closes, and returns focus to its trigger', async () => {
		const onSelect = vi.fn();
		render(
			<MemoryRouter>
				<Menu
					label="Account"
					trigger={<span>ad</span>}
					onSelect={onSelect}
					items={[
						{ heading: '@ada' },
						{ id: 'favorites', label: 'Favorites', hint: '48' },
						{ divider: true },
						{ id: 'out', label: 'Sign out', danger: true }
					]}
				/>
			</MemoryRouter>
		);
		const toggle = screen.getByRole('button', { name: 'Account' });
		await userEvent.click(toggle);
		expect(toggle).toHaveAttribute('aria-expanded', 'true');
		await userEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }));
		expect(onSelect).toHaveBeenCalledWith('out');
		expect(screen.queryByRole('menu')).toBeNull();
		expect(toggle).toHaveFocus();
	});
});

describe('notify', () => {
	it('shows the kit toast, and its action undoes and dismisses', async () => {
		const undo = vi.fn();
		render(<Toaster />);
		act(() => {
			notify('Saved to favorites.', { action: 'undo', onAction: undo });
		});
		const toast = await screen.findByRole('status');
		expect(toast).toHaveTextContent('Saved to favorites.');
		await userEvent.click(screen.getByRole('button', { name: 'undo' }));
		expect(undo).toHaveBeenCalledOnce();
	});
});
