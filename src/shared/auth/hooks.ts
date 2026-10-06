import { useSelector } from 'react-redux';
import { selectAuth } from './slice';

/** Synchronous auth state for rendering/gating. Hydrated from Better Auth. */
export function useAuth() {
	const { user, status } = useSelector(selectAuth);
	return {
		user,
		status,
		isAuthenticated: status === 'authenticated',
		isLoading: status === 'loading'
	};
}
