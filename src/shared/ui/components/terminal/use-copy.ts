import * as React from 'react';

type CopyState = 'idle' | 'copied' | 'failed';

let copyListener: ((text: string) => void) | undefined;

/** Called with every command the terminal components copy (the app's analytics); one listener. */
function onTerminalCopy(listener: ((text: string) => void) | undefined) {
	copyListener = listener;
}

/**
 * Copies `text` to the clipboard. The state goes back to idle after 1.4s, as in
 * the kit; `failed` means the browser refused (no permission, insecure origin).
 */
function useCopy(text: string) {
	const [state, setState] = React.useState<CopyState>('idle');
	const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
	React.useEffect(() => () => clearTimeout(timer.current), []);
	const copy = React.useCallback(async () => {
		let next: CopyState = 'copied';
		try {
			await navigator.clipboard.writeText(text);
			copyListener?.(text);
		} catch {
			next = 'failed';
		}
		setState(next);
		clearTimeout(timer.current);
		timer.current = setTimeout(() => setState('idle'), 1400);
	}, [text]);
	return [state, copy] as const;
}

/** The hint the kit shows in place of "copy". */
const copyHint = (state: CopyState) => (state === 'copied' ? 'copied' : state === 'failed' ? 'select to copy' : 'copy');

export { useCopy, copyHint, onTerminalCopy };
export type { CopyState };
