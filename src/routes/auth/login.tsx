import { useState } from 'react';
import { Form, Formik } from 'formik';
import { Navigate, useSearchParams } from 'react-router';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { getSafeRedirect, useAuth } from '@/shared/auth';
import { Button, Card, Divider, FormField, Logo, Notice, PageMeta, socialMark } from '@/shared/ui';
import { DeviceCode, SignInAside } from '@/features/auth/components/sign-in-aside';
import { linkError, sendMagicLink, signInWithProvider, type SocialProvider } from '@/features/auth/lib/auth-actions';
import { magicLinkSchema } from '@/features/auth/lib/schemas';

const PROVIDERS: { id: SocialProvider; label: string }[] = [
	{ id: 'google', label: 'Google' },
	{ id: 'github', label: 'GitHub' }
];

/** The terminal code in a `/device?user_code=` redirect, if that is where sign-in leads. */
function deviceCodeIn(target: string) {
	try {
		const url = new URL(target);
		return url.pathname === '/device' ? url.searchParams.get('user_code') : null;
	} catch {
		return null;
	}
}

/**
 * Sign in by email link or OAuth (artboard SignIn; BUILD-PLAN §9: GitHub and
 * Google). No passwords anywhere. A link that comes back used or expired
 * lands here with `?error=`; sign-in for `qotm login` shows the terminal's
 * code beside the form.
 */
export function LoginRoute() {
	const [params] = useSearchParams();
	const { isAuthenticated } = useAuth();
	const [error, setError] = useState<string | null>(null);
	const [sentTo, setSentTo] = useState<string | null>(null);
	// Absolute and allow-listed: the link lands here once it is used.
	const target = getSafeRedirect(params.get('redirect'));
	const expired = linkError(params.get('error'));
	const deviceCode = deviceCodeIn(target);

	if (isAuthenticated) return <Navigate to={new URL(target).pathname + new URL(target).search} replace />;

	// Where a used or expired link should land: back here, still heading to the target.
	const errorTarget = `${window.location.origin}/login?${new URLSearchParams({ redirect: target })}`;

	return (
		<div className="grid grid-cols-2 items-start gap-page py-[72px] narrow:grid-cols-1 narrow:py-section">
			<PageMeta title="Sign in" robots="noindex" />
			<Card>
				<div className="flex flex-col gap-grid px-1.5 py-2.5">
					<Logo lockup="symbol" height={32} alt="" />
					<div>
						<h1 className="m-0 mb-2 text-h1">{sentTo ? 'Check your email.' : 'Sign in to qotm.'}</h1>
						<p className="m-0 text-[15px] text-muted-foreground">
							{sentTo ? (
								<>
									We sent a sign-in link to <b className="font-medium text-foreground">{sentTo}</b>. It works once and
									expires in 10 minutes.
								</>
							) : (
								'An account is never needed to read quotes. It lets you submit, save and recommend.'
							)}
						</p>
					</div>
					{expired && !sentTo ? (
						<Notice tone="attention" title="That link did not work.">
							{expired}
						</Notice>
					) : null}
					{error ? (
						<Notice tone="attention" title="The link was not sent.">
							{error}
						</Notice>
					) : null}
					{sentTo ? (
						<Button variant="outline" block onClick={() => setSentTo(null)}>
							Use a different email
						</Button>
					) : (
						<Formik
							initialValues={{ email: '' }}
							validationSchema={toFormikValidationSchema(magicLinkSchema)}
							onSubmit={async (values, helpers) => {
								setError(null);
								const email = values.email.trim();
								const { error: err } = await sendMagicLink({
									email,
									callbackURL: target,
									errorCallbackURL: errorTarget
								});
								helpers.setSubmitting(false);
								if (err) setError(err);
								else setSentTo(email);
							}}
						>
							{({ isSubmitting }) => (
								<Form className="flex flex-col gap-grid" noValidate>
									<FormField
										name="email"
										label="Email"
										type="email"
										placeholder="you@example.com"
										autoComplete="email"
									/>
									<Button type="submit" block disabled={isSubmitting}>
										{isSubmitting ? 'Sending…' : 'Email me a sign-in link'}
									</Button>
									<Divider variant="graphic" gap="4px" />
									<div className="grid grid-cols-2 gap-3">
										{PROVIDERS.map((p) => (
											<Button
												key={p.id}
												type="button"
												variant="outline"
												block
												disabled={isSubmitting}
												aria-label={`Continue with ${p.label}`}
												onClick={() => void signInWithProvider(p.id, target)}
											>
												{socialMark(p.id)}
												{p.label}
											</Button>
										))}
									</div>
								</Form>
							)}
						</Formik>
					)}
					<p className="m-0 font-mono text-[13px] text-muted-foreground">
						New here? The same link creates your account.
					</p>
				</div>
			</Card>
			<SignInAside caption={deviceCode ? 'Started it from the terminal with' : 'Or sign in from your terminal'}>
				{deviceCode ? (
					<Card label="Connect your terminal">
						<div className="flex flex-col gap-4">
							<p className="m-0 text-[15px]">
								Your terminal is asking to sign in. Sign in here, then approve it. Check that the code matches the one
								it printed.
							</p>
							<DeviceCode code={deviceCode} />
						</div>
					</Card>
				) : null}
			</SignInAside>
		</div>
	);
}
