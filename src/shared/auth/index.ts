// @/shared/auth — authentication on Better Auth.
export { configureAuth } from './config';
export { initAuthClient, getAuthClient } from './client';
export type { AuthClient } from './client';
export { AuthProvider } from './provider';
export { useAuth } from './hooks';
export { ProtectedRoute, RoleRoute } from './guards';
export { redirectToLogin, loginRedirect, getSafeRedirect, configureRedirects } from './redirect';
export { signOut, broadcastAuthEvent, AUTH_BROADCAST_CHANNEL } from './logout';
export {
	authReducer,
	sessionLoading,
	sessionLoaded,
	sessionCleared,
	selectAuth,
	selectAuthUser,
	selectAuthStatus,
	selectIsAuthenticated
} from './slice';
export type { AuthUser, AuthStatus } from './slice';
