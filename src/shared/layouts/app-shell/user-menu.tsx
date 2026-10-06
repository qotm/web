import { useEffect, useRef, useState } from 'react';
import { LogOut } from 'lucide-react';

export type ShellUser = {
	name?: string | null;
	email?: string | null;
	image?: string | null;
};

function initials(user: ShellUser): string {
	const name = (user.name ?? '').trim();
	if (name) {
		const parts = name.split(/\s+/);
		const first = parts[0]?.[0] ?? '';
		const second = parts[1]?.[0] ?? '';
		return (first + second || first).toUpperCase();
	}
	const email = (user.email ?? '').trim();
	return email ? email[0].toUpperCase() : '?';
}

/** Avatar button + dropdown (name/email + sign out). Sign-out is delegated via `onSignOut`. */
export function UserMenu({ user, onSignOut }: { user: ShellUser; onSignOut: () => void }) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		const onDocClick = (event: MouseEvent) => {
			if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
		};
		document.addEventListener('mousedown', onDocClick);
		return () => document.removeEventListener('mousedown', onDocClick);
	}, [open]);

	return (
		<div className="relative" ref={ref}>
			<button
				type="button"
				onClick={() => setOpen((value) => !value)}
				aria-haspopup="menu"
				aria-expanded={open}
				aria-label="Account menu"
				className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-bold text-primary-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
			>
				{user.image ? <img src={user.image} alt="" className="size-9 rounded-full object-cover" /> : initials(user)}
			</button>
			{open ? (
				<div
					role="menu"
					className="absolute right-0 top-11 z-50 w-56 rounded-2xl border border-border bg-card p-2 shadow-[0_12px_32px_rgba(14,15,12,0.18)]"
				>
					<div className="px-3 py-2">
						<p className="truncate text-sm font-semibold text-foreground">{user.name ?? 'Your account'}</p>
						{user.email ? <p className="truncate text-xs text-mute">{user.email}</p> : null}
					</div>
					<div className="my-1 h-px bg-border" />
					<button
						type="button"
						role="menuitem"
						onClick={() => {
							setOpen(false);
							onSignOut();
						}}
						className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
					>
						<LogOut className="size-4" />
						Sign out
					</button>
				</div>
			) : null}
		</div>
	);
}
