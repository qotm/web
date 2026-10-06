import { Spinner } from '@/shared/ui';

/** Full-page loading state (route suspense / session bootstrap). */
export function Loading({ label = 'Loading…' }: { label?: string }) {
	return (
		<div className="flex min-h-screen w-full flex-col items-center justify-center gap-3 bg-background text-mute">
			<Spinner className="size-6" />
			<span className="text-sm">{label}</span>
		</div>
	);
}
