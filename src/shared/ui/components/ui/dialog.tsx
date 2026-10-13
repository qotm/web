import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn, glyph } from '../../lib/utils';

// Open dialogs, oldest first, so Escape closes only the topmost.
const stack: symbol[] = [];

const FOCUSABLE =
	'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type DialogProps = {
	open?: boolean;
	title?: React.ReactNode;
	description?: React.ReactNode;
	footer?: React.ReactNode;
	/** Escape, the scrim and the ✕ close it; without it, it only closes from its own buttons. */
	onClose?: () => void;
	width?: number;
	/** In flow, not over the page (documentation, the kit gallery). */
	inline?: boolean;
	role?: 'dialog' | 'alertdialog';
	className?: string;
	children?: React.ReactNode;
};

/**
 * qotm_kit Dialog: centred over a flat ink scrim at 45%, never blurred.
 * Escape and a scrim click close it; focus moves in, stays in, and returns
 * to whatever opened it; the page behind does not scroll.
 */
function Dialog({
	open = true,
	title,
	description,
	footer,
	onClose,
	width = 480,
	inline = false,
	role = 'dialog',
	className,
	children
}: DialogProps) {
	const panel = React.useRef<HTMLDivElement>(null);
	const titleId = React.useId();
	const descriptionId = React.useId();

	React.useEffect(() => {
		if (!open || inline) return;
		const id = Symbol('dialog');
		stack.push(id);
		const opener = document.activeElement as HTMLElement | null;
		const first = panel.current?.querySelector<HTMLElement>(FOCUSABLE);
		(first ?? panel.current)?.focus();
		const onKey = (event: KeyboardEvent) => {
			if (stack[stack.length - 1] !== id) return;
			if (event.key === 'Escape' && onClose) {
				event.stopPropagation();
				onClose();
			}
			if (event.key === 'Tab' && panel.current) {
				const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
				if (!items.length) return;
				const [head, tail] = [items[0], items[items.length - 1]];
				if (event.shiftKey && document.activeElement === head) {
					event.preventDefault();
					tail.focus();
				} else if (!event.shiftKey && document.activeElement === tail) {
					event.preventDefault();
					head.focus();
				}
			}
		};
		document.addEventListener('keydown', onKey);
		const overflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.removeEventListener('keydown', onKey);
			document.body.style.overflow = overflow;
			stack.splice(stack.indexOf(id), 1);
			opener?.focus?.();
		};
	}, [open, inline, onClose]);

	if (!open) return null;

	const box = (
		<div
			ref={panel}
			role={role}
			aria-modal={!inline}
			aria-labelledby={title ? titleId : undefined}
			aria-describedby={description ? descriptionId : undefined}
			tabIndex={-1}
			style={{ width }}
			onClick={(event) => event.stopPropagation()}
			className={cn(
				'box-border max-h-[calc(100vh-64px)] max-w-full overflow-auto rounded-card border border-border bg-card p-tile shadow-raised outline-none',
				className
			)}
		>
			<div className="mb-2 flex items-start justify-between gap-4">
				{title ? (
					<h3 id={titleId} className="m-0 text-h3">
						{title}
					</h3>
				) : null}
				{onClose ? (
					<button
						type="button"
						aria-label="Close"
						onClick={onClose}
						className="tap -mt-1 -mr-1.5 size-7 flex-none cursor-pointer rounded-control border-0 bg-transparent px-1.5 py-px font-mono text-[13px] text-stone-600 hover:bg-background hover:text-foreground"
					>
						{glyph('✕')}
					</button>
				) : null}
			</div>
			{description ? (
				<p id={descriptionId} className="mt-0 mb-4 text-ui text-muted-foreground">
					{description}
				</p>
			) : null}
			<div className="flex flex-col gap-4 text-ui">{children}</div>
			{footer ? <div className="mt-5.5 flex justify-end gap-3 border-t border-border pt-4.5">{footer}</div> : null}
		</div>
	);

	if (inline) {
		return <div className="relative box-border flex min-h-full items-center justify-center bg-scrim p-8">{box}</div>;
	}
	return createPortal(
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim p-8" onClick={onClose}>
			{box}
		</div>,
		document.body
	);
}

export { Dialog };
export type { DialogProps };
