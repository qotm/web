import * as React from 'react';
import type { ProfileEntity } from '@/shared/types';
import { cn } from '../../lib/utils';
import { Avatar } from '../ui/avatar';
import { StatusBadge } from '../ui/status-badge';
import { Stats, type Stat } from './stats';

type ProfileHeaderProps = {
	profile: Pick<ProfileEntity, 'handle' | 'name' | 'image' | 'bio' | 'role' | 'joinedAt' | 'stats'>;
	/** Defaults to the profile's quotes, contributions and curated counts. */
	stats?: Stat[];
	/** Buttons under the stats (edit profile, copy link). */
	actions?: React.ReactNode;
	className?: string;
};

const joined = (iso: string) =>
	new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });

/** qotm_kit ProfileHeader: avatar, name, @handle with the role badge and join date, bio, then stats and actions. */
function ProfileHeader({ profile: p, stats, actions, className }: ProfileHeaderProps) {
	const handle = `@${p.handle}`;
	const items = stats ?? [
		{ label: 'quotes', value: p.stats.quotes },
		{ label: 'contributions', value: p.stats.contributions },
		{ label: 'curated', value: p.stats.curated }
	];
	return (
		<header className={cn('flex flex-wrap items-end justify-between gap-page pt-page pb-tile', className)}>
			<div className="flex min-w-0 items-center gap-5">
				<Avatar name={p.name} handle={p.handle} src={p.image} size={64} />
				<div>
					<h1 className="m-0 text-h2">{p.name || handle}</h1>
					<p className="m-0 mt-2 flex flex-wrap items-center gap-2 font-mono text-[13px]/[1.6] text-muted-foreground">
						<span className="text-ink">{handle}</span>
						{p.role !== 'member' ? <StatusBadge status={p.role} /> : null}
						<span>· joined {joined(p.joinedAt)}</span>
					</p>
					{p.bio ? <p className="m-0 mt-2.5 text-[15px]/[1.6] text-ink">{p.bio}</p> : null}
				</div>
			</div>
			<div className="flex flex-col items-end gap-4">
				<Stats items={items} />
				{actions ? <div className="flex gap-2">{actions}</div> : null}
			</div>
		</header>
	);
}

export { ProfileHeader };
export type { ProfileHeaderProps };
