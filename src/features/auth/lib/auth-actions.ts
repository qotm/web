import { getAuthClient } from '@/shared/auth';

type ActionResult = { error?: string };

function messageOf(error: { message?: string } | null | undefined, fallback: string): string {
	return error?.message ?? fallback;
}

export async function loginWithEmail(input: {
	email: string;
	password: string;
	remember?: boolean;
}): Promise<ActionResult> {
	const { error } = await getAuthClient().signIn.email({
		email: input.email,
		password: input.password,
		rememberMe: input.remember ?? true
	});
	return error ? { error: messageOf(error, 'Could not log in. Check your details and try again.') } : {};
}

export async function signupWithEmail(input: {
	name: string;
	email: string;
	password: string;
	callbackURL?: string;
}): Promise<ActionResult> {
	const { error } = await getAuthClient().signUp.email({
		name: input.name,
		email: input.email,
		password: input.password,
		callbackURL: input.callbackURL
	});
	return error ? { error: messageOf(error, 'Could not create your account.') } : {};
}

export async function signInWithGoogle(options: {
	/** Where existing users land after sign-in (usually the client app). */
	callbackURL?: string;
	/** Where first-time users land (the onboarding wizard). */
	newUserCallbackURL?: string;
}): Promise<void> {
	await getAuthClient().signIn.social({
		provider: 'google',
		callbackURL: options.callbackURL,
		newUserCallbackURL: options.newUserCallbackURL
	});
}

export async function requestPasswordReset(input: { email: string; redirectTo?: string }): Promise<ActionResult> {
	const { error } = await getAuthClient().requestPasswordReset({ email: input.email, redirectTo: input.redirectTo });
	return error ? { error: messageOf(error, 'Could not send the reset link.') } : {};
}

export async function resetPasswordWithToken(input: { newPassword: string; token: string }): Promise<ActionResult> {
	const { error } = await getAuthClient().resetPassword({ newPassword: input.newPassword, token: input.token });
	return error ? { error: messageOf(error, 'Could not reset your password. The link may have expired.') } : {};
}

export async function resendVerification(input: { email: string; callbackURL?: string }): Promise<ActionResult> {
	const { error } = await getAuthClient().sendVerificationEmail({ email: input.email, callbackURL: input.callbackURL });
	return error ? { error: messageOf(error, 'Could not resend the email.') } : {};
}

export async function verifyEmailToken(token: string): Promise<ActionResult> {
	const { error } = await getAuthClient().verifyEmail({ query: { token } });
	return error ? { error: messageOf(error, 'Could not verify your email. The link may have expired.') } : {};
}
