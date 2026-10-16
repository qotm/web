import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RouteObject } from 'react-router';
import { cliCommand, routePattern, sanitizePayload, startAnalytics, track } from '.';

const routes: RouteObject[] = [
	{
		path: '/',
		children: [
			{ path: 'q/:id' },
			{ path: 'authors/:slug' },
			{ path: 'login' },
			{ path: 'admin', children: [{ path: 'quotes/:id' }] }
		]
	}
];

describe('routePattern', () => {
	it('names the route, never its ids', () => {
		expect(routePattern(routes, '/admin/quotes/q_8f2k1c')).toBe('/admin/quotes/:id');
		expect(routePattern(routes, '/nowhere/at/all')).toBe('/*');
	});
});

describe('sanitizePayload', () => {
	it('keeps a public page’s real path and title, without its query', () => {
		expect(sanitizePayload(routes, { url: '/q/8f2k1c?ref=x#top', title: 'Simplicity · qotm', website: 'w' })).toEqual({
			url: '/q/8f2k1c',
			title: 'Simplicity · qotm',
			website: 'w'
		});
	});

	it('reports a private page by its pattern and drops its title and token', () => {
		expect(sanitizePayload(routes, { url: '/admin/quotes/q_8f2k1c', title: 'A quote · Console' })).toEqual({
			url: '/admin/quotes/:id'
		});
		expect(sanitizePayload(routes, { url: '/login?token=secret', title: 'Sign in' })).toEqual({
			url: '/login',
			title: 'Sign in'
		});
	});

	it('treats referrers the same way, and cuts an external one to its origin', () => {
		expect(sanitizePayload(routes, { referrer: '/admin/quotes/q_1' }).referrer).toBe('/admin/quotes/:id');
		expect(sanitizePayload(routes, { referrer: '/authors/dijkstra?x=1' }).referrer).toBe('/authors/dijkstra');
		expect(sanitizePayload(routes, { referrer: 'https://news.ycombinator.com/item?id=1' }).referrer).toBe(
			'https://news.ycombinator.com'
		);
		expect(sanitizePayload(routes, { referrer: 'not a url' })).not.toHaveProperty('referrer');
	});
});

describe('startAnalytics', () => {
	it('loads nothing without a host and website id, and the tracker once with them', () => {
		startAnalytics({ host: undefined, websiteId: 'id', routes });
		expect(document.querySelector('script[data-website-id]')).toBeNull();

		startAnalytics({ host: 'https://umami.example.com/', websiteId: 'id', routes });
		startAnalytics({ host: 'https://umami.example.com/', websiteId: 'id', routes });
		const scripts = document.querySelectorAll<HTMLScriptElement>('script[data-website-id]');
		expect(scripts).toHaveLength(1);
		expect(scripts[0].src).toBe('https://umami.example.com/script.js');
		expect(scripts[0].dataset.beforeSend).toBe('__qotmUmamiBeforeSend');
		expect(scripts[0].dataset.performance).toBe('true');
	});
});

describe('cliCommand', () => {
	it('names a command without its arguments', () => {
		expect(cliCommand('npm i -g qotm')).toBe('install');
		expect(cliCommand('qotm --author edsger-dijkstra')).toBe('--author');
		expect(cliCommand('qotm sync')).toBe('sync');
		expect(cliCommand('qotm open q_8f2k1c')).toBe('open');
		expect(cliCommand('qotm')).toBe('qotm');
		expect(cliCommand('qotm "some words"')).toBe('other');
	});
});

describe('track', () => {
	afterEach(() => {
		delete (window as { umami?: unknown }).umami;
	});

	it('sends through the tracker once it has loaded, and is quiet before', () => {
		expect(() => track('share_card_opened')).not.toThrow();
		const send = vi.fn();
		(window as { umami?: unknown }).umami = { track: send };
		track('quote_reacted', { reaction: 'like', on: true });
		expect(send).toHaveBeenCalledWith('quote_reacted', { reaction: 'like', on: true });
	});
});
