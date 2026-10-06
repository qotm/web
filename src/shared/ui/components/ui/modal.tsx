import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';

// Open modals, oldest first — so Escape only closes the topmost when nested.
const modalStack: symbol[] = [];

type ModalProps = {
	/** Called on overlay click, Escape, and by the dialog's own close controls. */
	onClose: () => void;
	children: ReactNode;
	/** Accessible label for the dialog. */
	label?: string;
	/** Extra classes for the panel — e.g. a wider `sm:max-w-lg`. */
	className?: string;
	/** Show the mobile drag-handle grabber (default true). */
	handle?: boolean;
	/** Allow closing via overlay click / Escape (default true). */
	dismissible?: boolean;
	/** ARIA role — use "alertdialog" for destructive confirms. */
	role?: 'dialog' | 'alertdialog';
};

/**
 * App modal: a **bottom sheet on mobile** (slides up, rounded top, safe-area
 * aware) and a **centered card on ≥sm**. Rendered in a portal on `document.body`;
 * closes on overlay click + Escape, locks background scroll while open, and caps
 * its height with internal scroll. Enter animation only (unmounts instantly on
 * close, matching the conditional-render pattern callers use).
 */
export function Modal({
	onClose,
	children,
	label,
	className,
	handle = true,
	dismissible = true,
	role = 'dialog'
}: ModalProps) {
	const [shown, setShown] = useState(false);
	const panelRef = useRef<HTMLDivElement>(null);

	// Animate in on mount.
	useEffect(() => {
		const raf = requestAnimationFrame(() => setShown(true));
		return () => cancelAnimationFrame(raf);
	}, []);

	// Escape to close (topmost only) + lock background scroll while open.
	useEffect(() => {
		const id = Symbol('modal');
		modalStack.push(id);
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && dismissible && modalStack[modalStack.length - 1] === id) onClose();
		};
		document.addEventListener('keydown', onKey);
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.removeEventListener('keydown', onKey);
			const index = modalStack.indexOf(id);
			if (index !== -1) modalStack.splice(index, 1);
			// Restore the overflow value this modal saw (keeps the lock while a parent stays open).
			document.body.style.overflow = previousOverflow;
		};
	}, [onClose, dismissible]);

	return createPortal(
		<div className="fixed inset-0 z-60 flex items-end justify-center sm:items-center sm:p-4">
			<div
				aria-hidden="true"
				onClick={dismissible ? onClose : undefined}
				className={cn('fixed inset-0 bg-scrim transition-opacity duration-200', shown ? 'opacity-100' : 'opacity-0')}
			/>
			<div
				ref={panelRef}
				role={role}
				aria-modal="true"
				aria-label={label}
				className={cn(
					'relative flex max-h-[92dvh] w-full flex-col overflow-y-auto bg-card p-6',
					'rounded-t-3xl pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:max-w-md sm:rounded-3xl sm:pb-6',
					'transition duration-200 ease-out',
					shown ? 'translate-y-0 opacity-100 sm:scale-100' : 'translate-y-full opacity-0 sm:translate-y-0 sm:scale-95',
					className
				)}
			>
				{handle ? <div className="mx-auto mb-3 h-1 w-9 shrink-0 rounded-full bg-border sm:hidden" /> : null}
				{children}
			</div>
		</div>,
		document.body
	);
}
