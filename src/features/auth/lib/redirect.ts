/** Append the current `redirect` param to an in-app path (threads it across screens). */
export function withRedirect(path: string, redirect: string | null): string {
	if (!redirect) return path;
	const separator = path.includes('?') ? '&' : '?';
	return `${path}${separator}redirect=${encodeURIComponent(redirect)}`;
}
