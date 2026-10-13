import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { track } from '@/shared/analytics';
import { loginRedirect, useAuth } from '@/shared/auth';
import { notify, type QuoteAction } from '@/shared/ui';
import { paths } from '@/lib/paths';
import { useReactMutation } from './api';

/**
 * What a quote's ActionBar does: like, favorite and recommend save through
 * the API (signed out, they go to sign-in and back); share copies the
 * quote's link; report opens the quote's report form.
 */
export function useQuoteActions() {
	const { isAuthenticated } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const [react] = useReactMutation();

	return useCallback(
		(id: string) => (action: QuoteAction, on?: boolean) => {
			if (action === 'share') {
				const path = paths.quote(id);
				void navigator.clipboard
					?.writeText(`${window.location.origin}${path}`)
					.then(() => {
						track('quote_link_copied', { from: 'actions' });
						notify(`Link copied: ${path}`, { glyph: '↗' });
					})
					.catch(() => notify(`Copy this link: ${path}`, { glyph: '↗' }));
				return;
			}
			if (action === 'report') {
				navigate(`${paths.quote(id)}#report`);
				return;
			}
			if (!isAuthenticated) {
				navigate(loginRedirect(location.pathname + location.search));
				return;
			}
			void react({ id, reaction: action, on: Boolean(on) })
				.unwrap()
				.then(() => track('quote_reacted', { reaction: action, on: Boolean(on) }))
				.catch(() => notify('That did not save. Try again.'));
		},
		[isAuthenticated, location.pathname, location.search, navigate, react]
	);
}
