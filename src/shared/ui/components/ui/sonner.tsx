import type { ComponentProps } from 'react';
import { Toaster as SonnerToaster } from 'sonner';

type ToasterProps = ComponentProps<typeof SonnerToaster>;

function Toaster(props: ToasterProps) {
	return (
		<SonnerToaster
			position="top-center"
			toastOptions={{
				classNames: {
					toast: 'rounded-2xl border border-border bg-card text-card-foreground',
					description: 'text-mute',
					actionButton: 'bg-primary text-primary-foreground',
					cancelButton: 'bg-secondary text-secondary-foreground'
				}
			}}
			{...props}
		/>
	);
}

export { Toaster };
