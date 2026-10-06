import { Monitor, Moon, Sun } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from './use-theme';
import type { ThemeMode } from './theme-context';

const NEXT_LABEL: Record<ThemeMode, string> = {
	light: 'Switch to dark theme',
	dark: 'Switch to system theme',
	system: 'Switch to light theme'
};

const ICONS: Record<ThemeMode, React.ReactNode> = {
	light: <Sun className="size-4" aria-hidden="true" />,
	dark: <Moon className="size-4" aria-hidden="true" />,
	system: <Monitor className="size-4" aria-hidden="true" />
};

/**
 * Single-button theme control that cycles light → dark → system. The icon shows
 * the *current* mode, while the accessible name says what pressing it will do —
 * an icon-only control has to announce its action, not just its state.
 */
export function ThemeToggle({ className }: { className?: string }) {
	const { mode, toggle } = useTheme();

	return (
		<button
			type="button"
			onClick={toggle}
			title={NEXT_LABEL[mode]}
			aria-label={NEXT_LABEL[mode]}
			className={cn(
				'flex size-9 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-accent',
				className
			)}
		>
			{ICONS[mode]}
		</button>
	);
}
