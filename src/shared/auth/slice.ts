import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type AuthUser = {
	id: string;
	email: string;
	name?: string | null;
	image?: string | null;
	role?: string | null;
	emailVerified: boolean;
	/** ISO timestamp set when onboarding is finished/skipped; null = not yet onboarded. */
	onboardingCompletedAt?: string | null;
};

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthState = {
	user: AuthUser | null;
	status: AuthStatus;
};

const initialState: AuthState = {
	user: null,
	status: 'loading'
};

// Minimal projection of the Better Auth session for synchronous, app-wide reads.
// Better Auth remains the source of truth; this slice is hydrated FROM it (AuthProvider).
const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		sessionLoading(state) {
			state.status = 'loading';
		},
		sessionLoaded(state, action: PayloadAction<AuthUser | null>) {
			state.user = action.payload;
			state.status = action.payload ? 'authenticated' : 'unauthenticated';
		},
		sessionCleared(state) {
			state.user = null;
			state.status = 'unauthenticated';
		}
	}
});

export const { sessionLoading, sessionLoaded, sessionCleared } = authSlice.actions;
export const authReducer = authSlice.reducer;

type WithAuth = { auth: AuthState };

export const selectAuth = (state: WithAuth) => state.auth;
export const selectAuthUser = (state: WithAuth) => state.auth.user;
export const selectAuthStatus = (state: WithAuth) => state.auth.status;
export const selectIsAuthenticated = (state: WithAuth) => state.auth.status === 'authenticated';
