import { useParams } from 'react-router';
import { NotFound } from '@/shared/layouts';
import { PageMeta } from '@/shared/ui';

/**
 * `/@:handle` (and its tabs). React Router has no `@` prefix in a segment, so
 * the route is `/:handle` and anything without the `@` is a 404 here.
 */
export function ProfileRoute() {
	const { handle = '' } = useParams();
	if (!handle.startsWith('@') || handle.length < 2) return <NotFound />;
	return (
		<>
			<PageMeta title={handle} />
			<h1 className="text-h1">{handle}</h1>
		</>
	);
}
