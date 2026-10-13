import type { IncomingHttpHeaders } from 'node:http';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';

export type Got = { status: number; body: string };
export type HttpGet = (url: string, timeoutMs: number) => Promise<Got>;

export type GotBytes = { status: number; headers: IncomingHttpHeaders; body: Buffer };
export type HttpGetBytes = (url: string, timeoutMs: number) => Promise<GotBytes>;

/**
 * A GET with node:http, not fetch: fetch refuses the Fetch spec's "bad
 * ports" (the dev API's 5060 is one), and an internal API can live anywhere.
 * Redirects are not followed; the caller decides.
 */
export const httpGetBytes: HttpGetBytes = (url, timeoutMs) =>
	new Promise((resolve, reject) => {
		const req = (url.startsWith('https:') ? httpsRequest : httpRequest)(url, { timeout: timeoutMs }, (res) => {
			const chunks: Buffer[] = [];
			res.on('data', (c: Buffer) => chunks.push(c));
			res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(chunks) }));
			res.on('error', reject);
		});
		req.on('timeout', () => req.destroy(new Error(`timed out after ${timeoutMs}ms`)));
		req.on('error', reject);
		req.end();
	});

/** A JSON GET from the API. */
export const httpGet: HttpGet = (url, timeoutMs) =>
	new Promise((resolve, reject) => {
		const req = (url.startsWith('https:') ? httpsRequest : httpRequest)(
			url,
			{ headers: { accept: 'application/json' }, timeout: timeoutMs },
			(res) => {
				const chunks: Buffer[] = [];
				res.on('data', (c: Buffer) => chunks.push(c));
				res.on('end', () => resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks).toString('utf8') }));
				res.on('error', reject);
			}
		);
		req.on('timeout', () => req.destroy(new Error(`timed out after ${timeoutMs}ms`)));
		req.on('error', reject);
		req.end();
	});
