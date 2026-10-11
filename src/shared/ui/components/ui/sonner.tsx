import type { ComponentProps } from 'react';
import { Toaster as SonnerToaster } from 'sonner';

type ToasterProps = ComponentProps<typeof SonnerToaster>;

/**
 * Where `notify()` toasts appear: bottom centre, 24px up, as the kit floats
 * them. Unstyled: each toast draws itself as the kit's ink Toast.
 */
function Toaster(props: ToasterProps) {
	return <SonnerToaster position="bottom-center" offset={24} toastOptions={{ unstyled: true }} {...props} />;
}

export { Toaster };
