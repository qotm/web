import { useCallback, useEffect, useRef, useState } from 'react';
import { track } from '@/shared/analytics';
import { getApiBaseUrl } from '@/shared/api';
import { Button, Dialog, Field, Input, ShareCard, Tabs, notify } from '@/shared/ui';
import { paths } from '@/lib/paths';

type Variant = 'quote' | 'terminal';

/** How often, and how many times, to ask again while the worker renders the image. */
const RENDER_POLL_MS = 2_500;
const RENDER_TRIES = 12;

/**
 * The rendered image, or null if it is still not ready after ~30s. The API
 * redirects to the render once it exists; until then it answers 200 with a
 * placeholder (and Retry-After, which a cross-origin fetch cannot read), so
 * "followed a redirect" is what tells a real image from the stand-in.
 */
async function renderedImage(url: string): Promise<Response | null> {
	for (let i = 0; i < RENDER_TRIES; i++) {
		const res = await fetch(url);
		if (!res.ok) throw new Error(String(res.status));
		if (res.redirected) return res;
		await new Promise((r) => setTimeout(r, RENDER_POLL_MS));
	}
	return null;
}

type ShareDialogProps = {
	open: boolean;
	onClose: () => void;
	id: string;
	text: string;
	author: string;
};

/**
 * Share (artboard Share): the quote card or the terminal card, the
 * permanent link, the image to download (the worker's render) and copy link.
 */
/**
 * The preview's width: the dialog's content width, up to the 548px it was
 * drawn at. A callback ref, since the dialog mounts its content when it opens.
 */
function usePreviewWidth() {
	const [width, setWidth] = useState(548);
	const observer = useRef<ResizeObserver | null>(null);
	const measure = useCallback((el: HTMLDivElement | null) => {
		observer.current?.disconnect();
		if (!el || typeof ResizeObserver === 'undefined') return;
		const measure = () => el.clientWidth && setWidth(Math.min(548, el.clientWidth));
		measure();
		observer.current = new ResizeObserver(measure);
		observer.current.observe(el);
	}, []);
	return [measure, width] as const;
}

export function ShareDialog({ open, onClose, id, text, author }: ShareDialogProps) {
	const [variant, setVariant] = useState<Variant>('quote');
	const [busy, setBusy] = useState(false);
	const [measurePreview, previewWidth] = usePreviewWidth();
	const link = `${window.location.origin}${paths.quote(id)}`;

	useEffect(() => {
		if (open) track('share_card_opened');
	}, [open]);

	const copy = () =>
		navigator.clipboard
			.writeText(link)
			.then(() => {
				track('quote_link_copied', { from: 'share_dialog' });
				notify(`Link copied: ${paths.quote(id)}`, { glyph: '↗' });
			})
			.catch(() => notify('Select the link to copy it.'));

	const download = async () => {
		setBusy(true);
		try {
			const res = await renderedImage(`${getApiBaseUrl()}/v1/quotes/${id}/share-image?variant=${variant}`);
			if (!res) return notify('The image is still being made. Try again in a moment.');
			const url = URL.createObjectURL(await res.blob());
			const a = Object.assign(document.createElement('a'), { href: url, download: `qotm-${id}-${variant}.png` });
			a.click();
			track('share_card_downloaded', { variant });
			URL.revokeObjectURL(url);
		} catch {
			notify('The image did not download. Try again.');
		} finally {
			setBusy(false);
		}
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			width={600}
			title="Share this quote"
			description="The link always points at the quote’s permanent id, even if its wording is corrected later."
			footer={
				<>
					<Button variant="quiet" onClick={onClose}>
						Close
					</Button>
					<Button variant="outline" disabled={busy} onClick={() => void download()}>
						{busy ? 'Preparing image…' : 'Download image'}
					</Button>
					<Button onClick={() => void copy()}>Copy link</Button>
				</>
			}
		>
			<Tabs
				label="Card"
				items={[
					{ id: 'quote', label: 'quote card' },
					{ id: 'terminal', label: 'terminal card' }
				]}
				active={variant}
				onSelect={(v) => setVariant(v as Variant)}
			/>
			{/* Scaled to the dialog, not cropped by it, on a phone. */}
			<div ref={measurePreview} className="w-full">
				<ShareCard quote={text} author={author} id={id} variant={variant} width={previewWidth} />
			</div>
			<Field label="Link" htmlFor="share-link">
				<Input id="share-link" mono readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
			</Field>
		</Dialog>
	);
}
