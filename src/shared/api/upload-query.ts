import type { BaseQueryFn, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { getApiBaseUrl, notifyUnauthorized } from './config';

/** How long an upload may stall (no bytes acknowledged) before we give up. */
const DEFAULT_STALL_TIMEOUT_MS = 45_000;

export type UploadArgs = {
	url: string;
	body: FormData;
	method?: 'POST' | 'PUT' | 'PATCH';
	/** Called with 0-100 as the request body is written to the socket. */
	onProgress?: (percent: number) => void;
	/**
	 * Abort if no upload progress is observed for this many ms. Guards against a
	 * connection that opens, stalls mid-body and never errors on its own — the
	 * common failure on slow mobile uplinks.
	 */
	stallTimeoutMs?: number;
};

/** RTK Query's own marker for an aborted-by-timeout request. */
const TIMEOUT_ERROR: FetchBaseQueryError = {
	status: 'TIMEOUT_ERROR',
	error: 'The upload stalled. Check your connection and try again.'
};

function parseBody(xhr: XMLHttpRequest): unknown {
	const text = xhr.responseText;
	if (!text) return undefined;
	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
}

/**
 * Multipart uploads over XMLHttpRequest instead of `fetch`.
 *
 * `fetchBaseQuery` cannot report request-body progress (the Fetch API exposes no
 * upload stream events), so a large file on a slow connection is indistinguishable
 * from a hung request — the UI can only show an indefinite spinner. XHR still
 * emits `upload.onprogress`, which lets callers render real progress and lets us
 * abort a stalled transfer rather than waiting on the OS socket timeout.
 *
 * Mirrors `baseQueryWithReauth`: prefixes the configured API base URL, sends the
 * session cookie, and routes 401s to the shared re-auth handler.
 */
export const uploadBaseQuery: BaseQueryFn<UploadArgs, unknown, FetchBaseQueryError> = (args) =>
	new Promise((resolve) => {
		const { url, body, method = 'POST', onProgress, stallTimeoutMs = DEFAULT_STALL_TIMEOUT_MS } = args;
		const xhr = new XMLHttpRequest();

		let stallTimer: ReturnType<typeof setTimeout> | undefined;
		let settled = false;

		const cleanup = () => {
			if (stallTimer) clearTimeout(stallTimer);
		};

		const settle = (result: { data: unknown } | { error: FetchBaseQueryError }) => {
			if (settled) return;
			settled = true;
			cleanup();
			resolve(result);
		};

		// Restarted on every progress event; only fires when the socket goes quiet.
		const armStallTimer = () => {
			if (stallTimer) clearTimeout(stallTimer);
			stallTimer = setTimeout(() => {
				xhr.abort();
				settle({ error: TIMEOUT_ERROR });
			}, stallTimeoutMs);
		};

		xhr.open(method, `${getApiBaseUrl()}${url}`, true);
		// Matches fetchBaseQuery's `credentials: 'include'` — Better Auth session cookie.
		xhr.withCredentials = true;

		xhr.upload.onprogress = (event) => {
			armStallTimer();
			if (!event.lengthComputable || !onProgress) return;
			onProgress(Math.round((event.loaded / event.total) * 100));
		};

		// Body is fully written; the server is now working. Keep the stall guard
		// running so a server that accepts the bytes and then hangs still fails.
		xhr.upload.onload = () => {
			onProgress?.(100);
			armStallTimer();
		};

		xhr.onload = () => {
			const data = parseBody(xhr);
			if (xhr.status >= 200 && xhr.status < 300) {
				settle({ data });
				return;
			}
			if (xhr.status === 401) notifyUnauthorized();
			settle({ error: { status: xhr.status, data } as FetchBaseQueryError });
		};

		xhr.onerror = () => {
			settle({
				error: { status: 'FETCH_ERROR', error: 'The upload failed. Check your connection and try again.' }
			});
		};

		// Fires when the transfer is cut mid-body — the truncated-upload case.
		xhr.onabort = () => settle({ error: TIMEOUT_ERROR });

		armStallTimer();
		xhr.send(body);
	});
