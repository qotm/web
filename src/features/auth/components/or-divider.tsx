export function OrDivider({ label = 'or continue with' }: { label?: string }) {
	return (
		<div className="flex items-center gap-3">
			<span className="h-px flex-1 bg-border" />
			<span className="text-xs font-medium text-mute">{label}</span>
			<span className="h-px flex-1 bg-border" />
		</div>
	);
}
