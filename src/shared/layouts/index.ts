// @/shared/layouts — shared layouts and state components.
export { AuthLayout } from './auth-layout';
export { Loading } from './states/loading';
export { AppShellSkeleton } from './states/app-shell-skeleton';
export { RouteFallback } from './states/route-fallback';
export { PageSkeleton } from './states/page-skeleton';
export { Forbidden } from './states/forbidden';
export { NotFound } from './states/not-found';
export { Empty } from './states/empty';
export { StateScreen } from './states/state-screen';
export { ErrorBoundary } from './error-boundary';

// App shell (Client + Admin)
export { AppShell } from './app-shell/app-shell';
export type { NavItem, ComingSoonItem, PreloadRoute } from './app-shell/app-shell';
export { UserMenu } from './app-shell/user-menu';
export type { ShellUser } from './app-shell/user-menu';

// Marketing (landing)
export { MarketingLayout } from './marketing/marketing-layout';
export { Section } from './marketing/section';
export type { SectionTone } from './marketing/section';
export { SectionHeading } from './marketing/section-heading';
