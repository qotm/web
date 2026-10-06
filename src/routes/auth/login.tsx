import { useState } from 'react';
import { Form, Formik } from 'formik';
import { Link, useSearchParams } from 'react-router';
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
import { loginWithEmail, signInWithGoogle } from '@/features/auth/lib/auth-actions';
import { withRedirect } from '@/features/auth/lib/redirect';
import { loginSchema } from '@/features/auth/lib/schemas';

export function LoginRoute() {
	const [params] = useSearchParams();
	const redirect = params.get('redirect');
	const [error, setError] = useState<string | null>(null);
	// No explicit fallback: `configureAuth({ defaultRedirect })` in app/providers
	// already knows where the app lives, and duplicating it here is how the two
	// drift when the app moves under a different base path.
	const target = () => getSafeRedirect(redirect);

	return (
		<AuthLayout>
			<AuthCard
				title="Welcome back"
				description="Log in to pick up where you left off."
				footer={
					<>
						New here?{' '}
						<Link to={withRedirect('/signup', redirect)} className="font-semibold text-ink-deep">
							Create a free account
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
					initialValues={{ email: '', password: '', remember: true }}
					validationSchema={toFormikValidationSchema(loginSchema)}
					onSubmit={async (values, helpers) => {
						setError(null);
						const { error: err } = await loginWithEmail(values);
						helpers.setSubmitting(false);
						if (err) {
							setError(err);
							return;
						}
						// A full load rather than `navigate()`: `getSafeRedirect` returns an
						// absolute URL (it has to, to be checked against an origin
						// allowlist), and it also re-bootstraps the session cleanly.
						window.location.assign(target());
					}}
				>
					{({ isSubmitting }) => (
						<Form className="flex flex-col gap-4">
							<FormField name="email" label="Email" type="email" placeholder="you@example.com" autoComplete="email" />
							<PasswordField
								name="password"
								label="Password"
								placeholder="Your password"
								autoComplete="current-password"
								action={
									<Link to="/forgot-password" className="text-xs font-semibold text-ink-deep">
										Forgot password?
									</Link>
								}
							/>
							<CheckboxField name="remember" label="Remember me on this device" />
							<SubmitButton loading={isSubmitting}>Log in</SubmitButton>
							<OrDivider />
							<GoogleButton onClick={() => void signInWithGoogle({ callbackURL: target() })} disabled={isSubmitting} />
						</Form>
					)}
				</Formik>
			</AuthCard>
		</AuthLayout>
	);
}
