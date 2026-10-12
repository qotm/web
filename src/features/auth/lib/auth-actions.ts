import { getAuthClient } from '@/shared/auth';

type ActionResult = { error?: string };

/** Sign-in providers the API offers besides the magic link (BUILD-PLAN §9). */
export type SocialProvider = 'github' | 'google';

/**
 * Emails a one-time sign-in link; the same link creates the account for a
 * new address. `callbackURL` is where the link lands once it is used;
 * `errorCallbackURL` where a used or expired link lands, with `?error=`.
 */
export async function sendMagicLink(input: {
	email: string;
	callbackURL: string;
	errorCallbackURL?: string;
}): Promise<ActionResult> {
	const { error } = await getAuthClient().signIn.magicLink({
		email: input.email,
		callbackURL: input.callbackURL,
		errorCallbackURL: input.errorCallbackURL
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

/** Why a link that came back to /login with `?error=` did not sign anyone in. */
export function linkError(code: string | null): string | null {
	if (!code) return null;
	if (code === 'INVALID_TOKEN' || code === 'EXPIRED_TOKEN')
		return 'That sign-in link has expired or was already used. Links work once, for 10 minutes. Ask for a new one.';
	if (code === 'new_user_signup_disabled') return 'New accounts are closed for now.';
	return 'That link did not sign you in. Ask for a new one.';
}
