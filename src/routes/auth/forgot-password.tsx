import { useState } from 'react';
import { Form, Formik } from 'formik';
import { Link, useNavigate } from 'react-router';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { AuthLayout } from '@/shared/layouts';
import { Alert, Button, FormField } from '@/shared/ui';
import { AuthCard } from '@/features/auth/components/auth-card';
import { SubmitButton } from '@/features/auth/components/submit-button';
import { requestPasswordReset } from '@/features/auth/lib/auth-actions';
import { forgotSchema } from '@/features/auth/lib/schemas';
import { APP_ORIGIN } from '@/lib/env';

export function ForgotPasswordRoute() {
	const navigate = useNavigate();
	const [error, setError] = useState<string | null>(null);
	const [sentTo, setSentTo] = useState<string | null>(null);

	return (
		<AuthLayout>
			<AuthCard
				title="Reset your password"
				footer={
					<Link to="/login" className="font-semibold text-ink-deep">
						← Back to log in
					</Link>
				}
			>
				{sentTo ? (
					<div className="flex flex-col gap-4">
						<div className="flex items-start gap-3 rounded-2xl bg-accent p-4">
							<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
								✓
							</span>
							<div>
								<p className="text-sm font-semibold text-foreground">Reset link sent</p>
								<p className="mt-0.5 text-sm text-body">
									If <strong className="font-semibold">{sentTo}</strong> has an account, a link is on its way. It
									expires in 30 minutes.
								</p>
							</div>
						</div>
						<Button variant="outline" className="w-full" onClick={() => navigate('/reset-password')}>
							I have the link — set a new password
						</Button>
					</div>
				) : (
					<>
						{error ? (
							<Alert variant="destructive" className="mb-4">
								{error}
							</Alert>
						) : null}
						<p className="mb-4 text-sm text-body">
							Enter the email you signed up with and we'll send you a reset link.
						</p>
						<Formik
							initialValues={{ email: '' }}
							validationSchema={toFormikValidationSchema(forgotSchema)}
							onSubmit={async (values, helpers) => {
								setError(null);
								const { error: err } = await requestPasswordReset({
									email: values.email,
									// Absolute: this lands in an email, where a path has nothing
									// to resolve against.
									redirectTo: `${APP_ORIGIN}/reset-password`
								});
								helpers.setSubmitting(false);
								if (err) {
									setError(err);
									return;
								}
								setSentTo(values.email);
							}}
						>
							{({ isSubmitting }) => (
								<Form className="flex flex-col gap-4">
									<FormField
										name="email"
										label="Email"
										type="email"
										placeholder="you@example.com"
										autoComplete="email"
									/>
									<SubmitButton loading={isSubmitting}>Send reset link</SubmitButton>
								</Form>
							)}
						</Formik>
					</>
				)}
			</AuthCard>
		</AuthLayout>
	);
}
