import { useState } from 'react';
import { Form, Formik } from 'formik';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { toast } from 'sonner';
import { AuthLayout } from '@/shared/layouts';
import { Alert } from '@/shared/ui';
import { AuthCard } from '@/features/auth/components/auth-card';
import { PasswordField } from '@/features/auth/components/password-field';
import { SubmitButton } from '@/features/auth/components/submit-button';
import { resetPasswordWithToken } from '@/features/auth/lib/auth-actions';
import { resetSchema } from '@/features/auth/lib/schemas';

export function ResetPasswordRoute() {
	const [params] = useSearchParams();
	const token = params.get('token');
	const navigate = useNavigate();
	const [error, setError] = useState<string | null>(null);

	if (!token) {
		return (
			<AuthLayout>
				<AuthCard
					title="Reset link invalid"
					description="This password reset link is missing or has expired."
					footer={
						<Link to="/forgot-password" className="font-semibold text-ink-deep">
							Request a new link
						</Link>
					}
				>
					<Alert variant="destructive">Open the most recent reset email and use its link.</Alert>
				</AuthCard>
			</AuthLayout>
		);
	}

	return (
		<AuthLayout>
			<AuthCard title="Choose a new password">
				{error ? (
					<Alert variant="destructive" className="mb-4">
						{error}
					</Alert>
				) : null}
				<Formik
					initialValues={{ password: '', confirm: '' }}
					validationSchema={toFormikValidationSchema(resetSchema)}
					onSubmit={async (values, helpers) => {
						setError(null);
						const { error: err } = await resetPasswordWithToken({ newPassword: values.password, token });
						helpers.setSubmitting(false);
						if (err) {
							setError(err);
							return;
						}
						toast.success('Password updated. You can log in now.');
						navigate('/login');
					}}
				>
					{({ isSubmitting }) => (
						<Form className="flex flex-col gap-4">
							<PasswordField
								name="password"
								label="New password"
								placeholder="At least 8 characters"
								autoComplete="new-password"
								showStrength
							/>
							<PasswordField
								name="confirm"
								label="Confirm new password"
								placeholder="Type it again"
								autoComplete="new-password"
							/>
							<SubmitButton loading={isSubmitting}>Save new password</SubmitButton>
						</Form>
					)}
				</Formik>
			</AuthCard>
		</AuthLayout>
	);
}
