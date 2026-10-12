import { CommandBlock, Notice } from '@/shared/ui';

/** The sign-in screen's right column: the terminal route in, and the reassurance. */
export function SignInAside({ caption, children }: { caption: string; children?: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-grid">
			{children}
			<CommandBlock caption={caption} command="qotm login" />
			<Notice tone="info">
				qotm never asks for your password in the terminal. Logging out keeps the quotes you already have.
			</Notice>
		</div>
	);
}

/** The terminal's code, large and spaced, as the artboard shows it. */
export function DeviceCode({ code }: { code: string }) {
	return (
		<div
			data-testid="device-code"
			className="rounded-field border border-border bg-background p-grid text-center font-mono text-[36px]/[1.6] tracking-[0.18em]"
		>
			{code}
		</div>
	);
}
