// @/shared/ui — the UI kit (qotm_kit on shadcn/ui), its theme, and primitives.
export * from './lib/utils';
export * from './lib/format';
export * from './lib/zod-setup';

// Primitives
export * from './components/ui/button';
export * from './components/ui/icon-button';
export * from './components/ui/text-link';
export * from './components/ui/kbd';
// Forms (qotm_kit): Field wraps a control with its label, hint and error.
export * from './components/ui/field';
export * from './components/ui/input';
export * from './components/ui/textarea';
export * from './components/ui/select';
export * from './components/ui/checkbox';
export * from './components/ui/radio-group';
export * from './components/ui/switch';
export * from './components/ui/search-field';
export * from './components/ui/topic-picker';
// Surfaces and feedback (qotm_kit)
export * from './components/ui/card';
export * from './components/ui/tile';
export * from './components/ui/dialog';
export * from './components/ui/menu';
export * from './components/ui/toast';
export * from './components/ui/notice';
export * from './components/ui/empty-state';
export * from './components/ui/progress';
export * from './components/ui/skeleton';
export * from './components/ui/spinner';
export * from './components/ui/sonner';
// Display (qotm_kit)
export * from './components/ui/badge';
export * from './components/ui/status-badge';
export * from './components/ui/eyebrow';
export * from './components/ui/divider';
export * from './components/ui/avatar';
export * from './components/ui/topic-tag';
// Navigation (qotm_kit)
export * from './components/ui/tabs';
export * from './components/ui/pagination';
export * from './components/ui/breadcrumbs';
export * from './components/ui/side-nav';
// Quotes (qotm_kit)
export * from './components/quote/quote-block';
export * from './components/quote/attribution';
export * from './components/quote/action-bar';
export * from './components/quote/quote-card';
export * from './components/quote/provenance-panel';
export * from './components/quote/lifecycle-steps';
export * from './components/quote/lifecycle';
export * from './components/quote/share-card';
// People (qotm_kit)
export * from './components/people/stats';
export * from './components/people/author-header';
export * from './components/people/profile-header';
export * from './components/people/contribution-row';
// Admin (qotm_kit)
export * from './components/admin/data-table';
export * from './components/admin/console-menu';
export * from './components/admin/stat-card';
export * from './components/admin/release-summary';
export * from './components/admin/review-decision';
export * from './components/admin/match-compare';
// Site chrome (qotm_kit)
export * from './components/site/site-header';
export * from './components/site/site-footer';
// Terminal (qotm_kit)
export * from './components/terminal/terminal';
export * from './components/terminal/install-pill';
export * from './components/terminal/command-block';
export { onTerminalCopy } from './components/terminal/use-copy';

// Form primitives (Formik + Zod)
export * from './components/form/form';

// Theme (light/dark/system) — shared by every app
export { THEME_COLOR } from './theme/theme-colors';

// Document metadata (per-route titles, description, robots, canonical)
export { PageMeta } from './meta/page-meta';
export type { PageMetaProps } from './meta/page-meta';
export { MetaProvider } from './meta/meta-provider';
export { useMetaConfig } from './meta/use-meta-config';
export type { MetaConfig } from './meta/meta-context';

// Brand
export * from './components/brand/logo';
export * from './components/brand/social-icons';
