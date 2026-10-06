import { useState } from 'react';
import { Form, Formik } from 'formik';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { getSafeRedirect } from '@/shared/auth';
import { AuthLayout } from '@/shared/layouts';
import { Alert, FormField } from '@/shared/ui';
import { AuthCard } from '@/features/auth/components/auth-card';
import { CheckboxField } from '@/features/auth/components/checkbox-field';
import { GoogleButton } from '@/features/auth/components/google-button';
import { OrDivider } from '@/features/auth/components/or-divider';
import { PasswordField } from '@/features/auth/components/password-field';
import { SubmitButton } from '@/features/auth/components/submit-button';
import { signInWithGoogle, signupWithEmail } from '@/features/auth/lib/auth-actions';
import { withRedirect } from '@/features/auth/lib/redirect';
import { signupSchema } from '@/features/auth/lib/schemas';
import { APP_ORIGIN } from '@/lib/env';
import { PRIVACY_PATH, TERMS_PATH } from '@/lib/paths';

/**
 * Opened in a new tab rather than navigated to: a same-tab hop would discard a
 * half-filled signup form, and asking someone to re-enter it to read what they
 * are agreeing to is how consent gets clicked through unread. These two routes
 * ship regardless of whether the marketing site is included, precisely so this
 * link always resolves.
 */
const legalLinkClass = 'font-semibold text-ink-deep underline underline-offset-2';

function TermsLabel() {
	return (
		<>
			I agree to the{' '}
			<a href={TERMS_PATH} target="_blank" rel="noopener noreferrer" className={legalLinkClass}>
				Terms of Service
			</a>{' '}
			and{' '}
			<a href={PRIVACY_PATH} target="_blank" rel="noopener noreferrer" className={legalLinkClass}>
				Privacy Policy
			</a>
			.
		</>
	);
}

export function SignupRoute() {
	const [params] = useSearchParams();
	const redirect = params.get('redirect');
	const navigate = useNavigate();
	const [error, setError] = useState<string | null>(null);

	return (
		<AuthLayout>
			<AuthCard
				title="Create your free account"
				description="No fees, no card — get started in a minute."
				footer={
					<>
						Already have an account?{' '}
						<Link to={withRedirect('/login', redirect)} className="font-semibold text-ink-deep">
							Log in
						</Link>
					</>
				}
			>
				{error ? (
					<Alert variant="destructive" className="mb-4">
						{error}
					</Alert>
				) : null}
				<Formik
					initialValues={{ name: '', email: '', password: '', acceptedTerms: false }}
					validationSchema={toFormikValidationSchema(signupSchema)}
					onSubmit={async ({ name, email, password }, helpers) => {
						setError(null);
						const { error: err } = await signupWithEmail({
							name,
							email,
							password,
							// Absolute, and it has to be: this lands in an email, where a
							// path has nothing to resolve against.
							callbackURL: `${APP_ORIGIN}/verified`
						});
						helpers.setSubmitting(false);
						if (err) {
							setError(err);
							return;
						}
						navigate(withRedirect(`/verify-email?email=${encodeURIComponent(email)}`, redirect));
					}}
				>
					{({ isSubmitting, values }) => (
						<Form className="flex flex-col gap-4">
							<FormField name="name" label="Full name" placeholder="Your name" autoComplete="name" />
							<FormField name="email" label="Email" type="email" placeholder="you@example.com" autoComplete="email" />
							<PasswordField
								name="password"
								label="Password"
								placeholder="At least 8 characters"
								autoComplete="new-password"
								showStrength
							/>
							<CheckboxField name="acceptedTerms" label={<TermsLabel />} />
							<SubmitButton loading={isSubmitting}>Create account</SubmitButton>
							<OrDivider />
							{/* Google is a second route to the same account, so the same gate applies —
								    otherwise the consent is one click away from being skipped entirely. */}
							<GoogleButton
								onClick={() => void signInWithGoogle({ callbackURL: getSafeRedirect(redirect) })}
								disabled={isSubmitting || !values.acceptedTerms}
							/>
						</Form>
					)}
				</Formik>
			</AuthCard>
		</AuthLayout>
	);
}
