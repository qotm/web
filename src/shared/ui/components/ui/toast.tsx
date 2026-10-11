import * as React from 'react';
import { toast as sonner } from 'sonner';
import { cn, glyph as textGlyph } from '../../lib/utils';

type ToastProps = {
	message: React.ReactNode;
	/** One action, in mono clay: "undo". */
	action?: string;
	onAction?: () => void;
	onClose?: () => void;
	glyph?: string;
	className?: string;
};

/** qotm_kit Toast: an ink bar after an action — "Saved to favorites." — with one optional action. */
function Toast({ message, action, onAction, onClose, glyph = '✓', className }: ToastProps) {
	return (
		<div
			role="status"
			className={cn(
				'box-border inline-flex max-w-[480px] items-center gap-3 rounded-field bg-dark py-[11px] pr-3.5 pl-4 text-ui text-dark-foreground shadow-raised',
				className
			)}
		>
			{glyph ? <span className="font-mono text-dark-accent">{textGlyph(glyph)}</span> : null}
			<span className="flex-1">{message}</span>
			{action ? (
				<button
					type="button"
					onClick={onAction}
					className="cursor-pointer border-0 border-b border-transparent bg-transparent px-0 py-0.5 font-mono text-[13px]/[normal] text-dark-accent hover:border-dark-accent"
				>
					{action}
				</button>
			) : null}
			{onClose ? (
				<button
					type="button"
					aria-label="Dismiss"
					onClick={onClose}
					className="cursor-pointer border-0 bg-transparent px-1.5 py-px font-mono text-xs text-dark-muted"
				>
					{textGlyph('✕')}
				</button>
			) : null}
		</div>
	);
}

/**
 * Shows a kit Toast through the mounted <Toaster />: `notify('Saved to
 * favorites.', { action: 'undo', onAction })`. The action dismisses it.
 */
function notify(message: React.ReactNode, options: { action?: string; onAction?: () => void; glyph?: string } = {}) {
	return sonner.custom((id) => (
		<Toast
			message={message}
			glyph={options.glyph}
			action={options.action}
			onAction={() => {
				sonner.dismiss(id);
				options.onAction?.();
			}}
			onClose={() => sonner.dismiss(id)}
		/>
	));
}

export { Toast, notify };
export type { ToastProps };
