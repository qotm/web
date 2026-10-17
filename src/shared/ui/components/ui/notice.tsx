import * as React from 'react';
import { cn, glyph as textGlyph } from '../../lib/utils';

type NoticeTone = 'info' | 'wash' | 'attention' | 'dark';

const GLYPHS: Record<NoticeTone, string> = { info: '→', wash: '·', attention: '?', dark: '~ >' };

const TONES: Record<NoticeTone, { box: string; glyph: string; body: string }> = {
	info: { box: 'border border-border bg-card', glyph: 'text-clay-600', body: 'text-muted-foreground' },
	wash: { box: 'bg-accent', glyph: 'text-clay-700', body: 'text-foreground' },
	attention: {
		box: 'bg-accent shadow-[inset_0_0_0_1px_var(--color-clay-200)]',
		glyph: 'text-clay-700',
		body: 'text-foreground'
	},
	dark: { box: 'bg-dark text-dark-foreground', glyph: 'text-dark-accent', body: 'text-dark-muted' }
};

type NoticeProps = Omit<React.ComponentProps<'div'>, 'title'> & {
	tone?: NoticeTone;
	title?: React.ReactNode;
	glyph?: string;
	action?: React.ReactNode;
};

/**
 * qotm_kit Notice: an inline explanatory panel (provenance caveats, review
 * outcomes, offline notes). info · wash · attention · dark. In a box under
 * 480px wide (a phone) the action moves under the text, so the text keeps
 * the width.
 */
function Notice({ tone = 'info', title, glyph, action, className, children, ...props }: NoticeProps) {
	const t = TONES[tone];
	return (
		<div
			role="note"
			className={cn(
				'@container flex flex-wrap items-start gap-x-3.5 gap-y-3 rounded-field px-4.5 py-3.5 text-[15px]/[1.5]',
				t.box,
				className
			)}
			{...props}
		>
			<span aria-hidden="true" className={cn('min-w-3.5 flex-none font-mono text-[13px]/[22px]', t.glyph)}>
				{textGlyph(glyph ?? GLYPHS[tone])}
			</span>
			<div className="flex min-w-0 flex-1 flex-col gap-0.5 wrap-anywhere">
				{title ? <strong className="font-medium">{title}</strong> : null}
				{children ? <div className={t.body}>{children}</div> : null}
			</div>
			{action ? (
				<div className="flex-none self-center @max-[480px]:basis-full @max-[480px]:self-start @max-[480px]:pl-7">
					{action}
				</div>
			) : null}
		</div>
	);
}

export { Notice };
export type { NoticeProps, NoticeTone };
