import { Button } from '@/shared/ui';

function GoogleIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
			<path
				fill="#4285F4"
				d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.3-2.1 3.7-5.1 3.7-8.6z"
			/>
			<path
				fill="#34A853"
				d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-6-2.1-6.9-5.1L1.2 17.2C3.2 21.2 7.3 24 12 24z"
			/>
			<path
				fill="#FBBC05"
				d="M5.1 14.3c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.2 6.8C.4 8.4 0 10.1 0 12s.4 3.6 1.2 5.2l3.9-2.9z"
			/>
			<path
				fill="#EA4335"
				d="M12 4.6c1.8 0 3 .8 3.7 1.4l3.3-3.2C17 1 14.2 0 12 0 7.3 0 3.2 2.8 1.2 6.8l3.9 2.9c1-3 3.7-5.1 6.9-5.1z"
			/>
		</svg>
	);
}

export function GoogleButton({
	onClick,
	disabled,
	label = 'Continue with Google'
}: {
	onClick: () => void;
	disabled?: boolean;
	label?: string;
}) {
	return (
		<Button type="button" variant="outline" className="w-full" onClick={onClick} disabled={disabled}>
			<GoogleIcon />
			{label}
		</Button>
	);
}
