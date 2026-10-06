import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Mail } from 'lucide-react';
import { getAuthClient } from '@/shared/auth';
import { AuthLayout } from '@/shared/layouts';
import { Alert, Button, Card } from '@/shared/ui';
import { SubmitButton } from '@/features/auth/components/submit-button';
import { resendVerification, verifyEmailToken } from '@/features/auth/lib/auth-actions';
import { APP_ORIGIN } from '@/lib/env';

export function VerifyEmailRoute() {
	const [params] = useSearchParams();
	const navigate = useNavigate();
	const email = params.get('email') ?? '';
	const token = params.get('token');
	const [error, setError] = useState<string | null>(null);
	const [checking, setChecking] = useState(Boolean(token));
	const [resent, setResent] = useState(false);

	useEffect(() => {
		if (!token) return;
		let active = true;
		void (async () => {
			const { error: err } = await verifyEmailToken(token);
			if (!active) return;
			if (err) {
				setError(err);
				setChecking(false);
				return;
			}
			navigate('/verified', { replace: true });
		})();
		return () => {
			active = false;
		};
	}, [token, navigate]);

	const handleClickedLink = async () => {
		setError(null);
		setChecking(true);
		const { data } = await getAuthClient().getSession();
		setChecking(false);
		if (data?.user?.emailVerified) {
			navigate('/verified');
		} else {
			setError("We can't confirm it yet — click the link in your email, then try again.");
		}
	};

	const handleResend = async () => {
		setError(null);
		// Absolute: this lands in an email, where a path has nothing to resolve against.
		const { error: err } = await resendVerification({ email, callbackURL: `${APP_ORIGIN}/verified` });
		if (err) {
			setError(err);
			return;
		}
		setResent(true);
	};

	return (
		<AuthLayout>
			<Card className="items-center text-center">
				<span className="flex size-16 items-center justify-center rounded-full bg-accent text-ink-deep">
					<Mail className="size-7" />
				</span>
				<div className="flex flex-col gap-2">
					<h2 className="font-display text-2xl font-black text-foreground">Check your inbox</h2>
					<p className="text-sm text-body">
						We sent a verification link to{' '}
						<strong className="font-semibold text-foreground">{email || 'your email'}</strong>.
					</p>
					<p className="text-sm text-mute">The link expires in 24 hours. Check spam if you don't see it.</p>
				</div>
				{error ? (
					<Alert variant="destructive" className="w-full text-left">
						{error}
					</Alert>
				) : null}
				<div className="flex w-full flex-col gap-2">
					<SubmitButton type="button" loading={checking} onClick={handleClickedLink}>
						I've clicked the link
					</SubmitButton>
					<Button type="button" variant="outline" className="w-full" onClick={handleResend} disabled={resent}>
						{resent ? 'Verification email sent' : 'Resend email'}
					</Button>
				</div>
				<p className="text-sm text-body">
					Wrong address?{' '}
					<Link to="/signup" className="font-semibold text-ink-deep">
						Edit your email
					</Link>
				</p>
			</Card>
		</AuthLayout>
	);
}
