import { describe, expect, it } from 'vitest';
import { appPath, paths } from './paths';

describe('appPath', () => {
	it('names routes from the root, with single slashes', () => {
		expect(appPath()).toBe('/');
		expect(appPath('settings')).toBe('/settings');
		expect(appPath('/admin//users/')).toBe('/admin/users');
	});
});

describe('paths', () => {
	it('builds the community URLs', () => {
		expect(paths.quote('q_8f2k1c')).toBe('/q/8f2k1c');
		expect(paths.quote('8f2k1c')).toBe('/q/8f2k1c');
		expect(paths.author('dijkstra')).toBe('/authors/dijkstra');
		expect(paths.topic('software-design')).toBe('/topics/software-design');
		expect(paths.search('a b')).toBe('/search?q=a%20b');
		expect(paths.search()).toBe('/search');
	});

	it('puts the @ on profile URLs once', () => {
		expect(paths.profile('ada')).toBe('/@ada');
		expect(paths.profile('@ada', 'contributions')).toBe('/@ada/contributions');
	});
});
