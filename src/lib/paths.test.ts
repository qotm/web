import { describe, expect, it } from 'vitest';
import { appPath } from './paths';

describe('appPath', () => {
	it('names routes from the root, with single slashes', () => {
		expect(appPath()).toBe('/');
		expect(appPath('settings')).toBe('/settings');
		expect(appPath('/admin//users/')).toBe('/admin/users');
	});
});
