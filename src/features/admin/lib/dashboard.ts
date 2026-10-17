import type { AdminStatsResponse } from '@/shared/types';

/** How long something has waited, as the oldest-in-queue table shows it: "6d", "5h", "12m". */
export function waited(since: string, now = Date.now()) {
	const m = Math.max(0, Math.floor((now - new Date(since).getTime()) / 60_000));
	if (m < 60) return `${m}m`;
	if (m < 1440) return `${Math.floor(m / 60)}h`;
	return `${Math.floor(m / 1440)}d`;
}

/** "oldest waiting 6 days", or nothing when the queue is empty. */
export function oldestNote(since: string | null, now = Date.now()) {
	if (!since) return null;
	const days = Math.floor((now - new Date(since).getTime()) / 86_400_000);
	if (days < 1) return 'oldest waiting under a day';
	return `oldest waiting ${days} day${days === 1 ? '' : 's'}`;
}

/** A 0–1 ratio as a percentage; "—" when there was nothing to measure. */
export const rate = (r: number | null) => (r == null ? '—' : `${Math.round(r * 1000) / 10}%`);

/** A count, or "—" when it is not collected (npm downloads before the package is out). */
export const count = (n: number | null) => (n == null ? '—' : n);

/** The four queue cards: label, size, the note under it, and where it leads. */
export function queueCards(q: AdminStatsResponse['queues'], now = Date.now()) {
	return [
		{
			page: 'verification',
			label: 'Verification queue',
			value: q.verification.count,
			note: oldestNote(q.verification.oldestSince, now)
		},
		{
			page: 'curation',
			label: 'Curation queue',
			value: q.curation.count,
			note: `${q.curation.communityCandidates} community candidate${q.curation.communityCandidates === 1 ? '' : 's'}`
		},
		{
			page: 'reports',
			label: 'Open reports',
			value: q.reports.count,
			note: `${q.reports.onCurated} on a curated quote`
		},
		{
			page: 'submissions',
			label: 'Originality holds',
			value: q.submissions.count,
			note: oldestNote(q.submissions.oldestSince, now) ?? 'nothing held'
		}
	] as const;
}

/** "3 days ago", "5 hours ago": how long ago something entered a queue. */
export function ago(since: string, now = Date.now()) {
	const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
	const m = Math.max(1, Math.round((now - new Date(since).getTime()) / 60_000));
	if (m < 60) return rtf.format(-m, 'minute');
	if (m < 1440) return rtf.format(-Math.round(m / 60), 'hour');
	return rtf.format(-Math.round(m / 1440), 'day');
}
