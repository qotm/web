import { useState } from 'react';
import { getApiBaseUrl } from '@/shared/api';
import { Button, Dialog, Field, Input, ShareCard, Tabs, notify } from '@/shared/ui';
import { paths } from '@/lib/paths';

type Variant = 'quote' | 'terminal';

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
export function ShareDialog({ open, onClose, id, text, author }: ShareDialogProps) {
	const [variant, setVariant] = useState<Variant>('quote');
	const [busy, setBusy] = useState(false);
	const link = `${window.location.origin}${paths.quote(id)}`;

	const copy = () =>
		navigator.clipboard
			.writeText(link)
			.then(() => notify(`Link copied: ${paths.quote(id)}`, { glyph: '↗' }))
			.catch(() => notify('Select the link to copy it.'));

	const download = async () => {
		setBusy(true);
		try {
			const res = await fetch(`${getApiBaseUrl()}/v1/quotes/${id}/share-image?variant=${variant}`);
			if (!res.ok) throw new Error(String(res.status));
			const url = URL.createObjectURL(await res.blob());
			const a = Object.assign(document.createElement('a'), { href: url, download: `qotm-${id}-${variant}.png` });
			a.click();
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
						{busy ? 'Downloading…' : 'Download image'}
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
			<ShareCard quote={text} author={author} id={id} variant={variant} width={548} className="max-w-full" />
			<Field label="Link" htmlFor="share-link">
				<Input id="share-link" mono readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
			</Field>
		</Dialog>
	);
}
