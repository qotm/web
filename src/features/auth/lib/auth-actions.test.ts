import { beforeEach, describe, expect, it, vi } from 'vitest';

const magicLink = vi.fn();
vi.mock('@/shared/auth', () => ({
	getAuthClient: () => ({ signIn: { magicLink, social: vi.fn() } })
}));

const { sendMagicLink } = await import('./auth-actions');

describe('sendMagicLink', () => {
	beforeEach(() => magicLink.mockReset());

	it('sends the link with where it should land', async () => {
		magicLink.mockResolvedValue({ error: null });
		expect(await sendMagicLink({ email: 'ada@example.com', callbackURL: 'http://x/favorites' })).toEqual({});
		expect(magicLink).toHaveBeenCalledWith({ email: 'ada@example.com', callbackURL: 'http://x/favorites' });
	});

	it.each([
		[{ code: 'TOO_MANY_LINKS', status: 429 }, /Wait a few minutes/],
		[{ code: 'DISPOSABLE_EMAIL', status: 400 }, /disposable addresses/],
		[{ status: 500, message: 'Boom' }, /Boom/]
	])('explains %o in plain words', async (error, message) => {
		magicLink.mockResolvedValue({ error });
		expect((await sendMagicLink({ email: 'a@b.c', callbackURL: '/' })).error).toMatch(message);
	});
});
