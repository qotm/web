import type { CopyState } from './use-copy';

/** A visually hidden live region: screen readers hear the copy result, sighted users see the hint. */
function CopyStatus({ state, text }: { state: CopyState; text: string }) {
	return (
		<span role="status" className="sr-only">
			{state === 'copied'
				? `Copied “${text}” to the clipboard`
				: state === 'failed'
					? 'Could not copy. Select the text to copy it.'
					: ''}
		</span>
	);
}

export { CopyStatus };
