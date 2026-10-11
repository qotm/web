import { useState } from 'react';
import { Form, Formik } from 'formik';
import { useSearchParams } from 'react-router';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { getSafeRedirect } from '@/shared/auth';
import { AuthLayout } from '@/shared/layouts';
import { Alert, FormField } from '@/shared/ui';
import { AuthCard } from '@/features/auth/components/auth-card';
import { GoogleButton } from '@/features/auth/components/google-button';
import { OrDivider } from '@/features/auth/components/or-divider';
import { SubmitButton } from '@/features/auth/components/submit-button';
import { sendMagicLink, signInWithProvider } from '@/features/auth/lib/auth-actions';
import { magicLinkSchema } from '@/features/auth/lib/schemas';

/**
 * Sign in by email link (or OAuth). No passwords anywhere (BUILD-PLAN §9);
 * the SignIn artboard's layout and the device approval arrive with QOT-77.
 */
export function LoginRoute() {
	const [params] = useSearchParams();
	const [error, setError] = useState<string | null>(null);
	const [sentTo, setSentTo] = useState<string | null>(null);
	// Absolute and allow-listed: the link lands here once it is used.
	const target = () => getSafeRedirect(params.get('redirect'));

	return (
		<AuthLayout>
			<AuthCard
				title={sentTo ? 'Check your email.' : 'Sign in.'}
				description={
					sentTo
						? `We sent a sign-in link to ${sentTo}. It works once and expires in 10 minutes.`
						: 'Enter your email and we will send you a link. New here? The same link creates your account.'
				}
			>
				{error ? (
					<Alert variant="destructive" className="mb-4">
						{error}
					</Alert>
				) : null}
				{sentTo ? null : (
					<Formik
						initialValues={{ email: '' }}
						validationSchema={toFormikValidationSchema(magicLinkSchema)}
						onSubmit={async (values, helpers) => {
							setError(null);
							const email = values.email.trim();
							const { error: err } = await sendMagicLink({ email, callbackURL: target() });
							helpers.setSubmitting(false);
							if (err) setError(err);
							else setSentTo(email);
						}}
					>
						{({ isSubmitting }) => (
							<Form className="flex flex-col gap-4">
								<FormField name="email" label="Email" type="email" placeholder="you@example.com" autoComplete="email" />
								<SubmitButton loading={isSubmitting}>Send sign-in link</SubmitButton>
								<OrDivider />
								<GoogleButton onClick={() => void signInWithProvider('google', target())} disabled={isSubmitting} />
							</Form>
						)}
					</Formik>
				)}
			</AuthCard>
		</AuthLayout>
	);
}
