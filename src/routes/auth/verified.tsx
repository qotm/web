import { useSearchParams } from 'react-router';
import { Check } from 'lucide-react';
import { getSafeRedirect } from '@/shared/auth';
import { AuthLayout } from '@/shared/layouts';
import { Button, Card } from '@/shared/ui';

export function VerifiedRoute() {
	const [params] = useSearchParams();
	const redirect = params.get('redirect');

	return (
		<AuthLayout>
			<Card className="items-center text-center">
				<span className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
					<Check className="size-8" strokeWidth={2.4} />
				</span>
				<div className="flex flex-col gap-2">
					<h2 className="font-display text-2xl font-black text-foreground">You're verified</h2>
					<p className="text-sm text-body">
						Your email is confirmed. Continue to Qotm Web — everything is ready for you.
					</p>
				</div>
				{/* No explicit fallback: `configureAuth({ defaultRedirect })` already
				    knows where the app lives. */}
				<Button className="w-full" onClick={() => window.location.assign(getSafeRedirect(redirect))}>
					Continue
				</Button>
			</Card>
		</AuthLayout>
	);
}
