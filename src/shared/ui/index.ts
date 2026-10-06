// @/shared/ui — shared shadcn/ui components (Wise design system), theme, and primitives.
export * from './lib/utils';
export * from './lib/zod-setup';

// Primitives
export * from './components/ui/button';
export * from './components/ui/input';
export * from './components/ui/search-input';
export * from './components/ui/label';
export * from './components/ui/card';
export * from './components/ui/alert';
export * from './components/ui/checkbox';
export * from './components/ui/select';
export * from './components/ui/modal';
export * from './components/ui/textarea';
export * from './components/ui/popover';
// Calendar is intentionally NOT re-exported here — it pulls in react-day-picker, and
// DatePicker lazy-loads it so it stays out of the main bundle.
export * from './components/ui/date-picker';
export * from './components/ui/progress';
export * from './components/ui/skeleton';
export * from './components/ui/spinner';
export * from './components/ui/sonner';

// Form primitives (Formik + Zod)
export * from './components/form/form';

// Theme (light/dark/system) — shared by every app
export { ThemeProvider } from './theme/theme-provider';
export { ThemeToggle } from './theme/theme-toggle';
export { useTheme } from './theme/use-theme';
export { themeInitScript } from './theme/init-script';
export { THEME_STORAGE_KEY, THEME_COLORS } from './theme/theme-context';
export type { ThemeMode, ResolvedTheme } from './theme/theme-context';

// Document metadata (per-route titles, description, robots, canonical)
export { PageMeta } from './meta/page-meta';
export type { PageMetaProps } from './meta/page-meta';
export { MetaProvider } from './meta/meta-provider';
export { useMetaConfig } from './meta/use-meta-config';
export type { MetaConfig } from './meta/meta-context';

// Brand
export * from './components/brand/logo';
export * from './components/brand/social-icons';
