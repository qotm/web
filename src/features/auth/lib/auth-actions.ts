import { getAuthClient } from '@/shared/auth';

type ActionResult = { error?: string };

/** Sign-in providers the API offers besides the magic link (BUILD-PLAN §9). */
export type SocialProvider = 'github' | 'google';

/**
 * Emails a one-time sign-in link; the same link creates the account for a
 * new address. `callbackURL` is where the link lands once it is used.
 */
export async function sendMagicLink(input: { email: string; callbackURL: string }): Promise<ActionResult> {
	const { error } = await getAuthClient().signIn.magicLink({
		email: input.email,
		callbackURL: input.callbackURL
	});
	if (!error) return {};
	if (error.code === 'TOO_MANY_LINKS' || error.status === 429) {
		return { error: 'Too many links asked for. Wait a few minutes, then try again.' };
	}
	if (error.code === 'DISPOSABLE_EMAIL') {
		return { error: 'Use an address you keep: disposable addresses cannot sign in.' };
	}
	return { error: error.message ?? 'Could not send the link. Try again.' };
}

export async function signInWithProvider(provider: SocialProvider, callbackURL: string): Promise<void> {
	await getAuthClient().signIn.social({ provider, callbackURL });
}
