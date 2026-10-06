import { PageMeta } from '@/shared/ui';

export function HomeRoute() {
	return (
		<>
			<PageMeta title="Home" />
			<div className="space-y-2">
				<h1 className="text-2xl font-semibold">Home</h1>
				<p className="text-muted-foreground">
					Replace this with your first feature. Data calls belong in a
					<code className="mx-1">features/&lt;name&gt;/api.ts</code>
					slice that extends the shared <code>baseApi</code>.
				</p>
			</div>
		</>
	);
}
