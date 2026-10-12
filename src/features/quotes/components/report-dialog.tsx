import { useState } from 'react';
import type { CreateReport } from '@/shared/types';
import { Button, Dialog, Field, Notice, RadioGroup, Textarea, notify } from '@/shared/ui';
import { useReportQuoteMutation } from '../api';

/** The report reasons, worded as the artboard (Report) words them. */
const REASONS: { value: CreateReport['reason']; label: string; description: string }[] = [
	{ value: 'attribution', label: 'Attribution', description: 'Wrong author, or no evidence they said it.' },
	{ value: 'content', label: 'Content', description: 'Offensive or off-topic.' },
	{ value: 'originality', label: 'Originality', description: 'Not the submitter’s own words.' },
	{ value: 'duplicate', label: 'Duplicate', description: 'Already in qotm under another id.' },
	{ value: 'other', label: 'Something else', description: 'Anything a moderator should look at.' }
];

/** Report (artboard Report): a reason and optional details, to the moderators. */
export function ReportDialog({ open, onClose, id }: { open: boolean; onClose: () => void; id: string }) {
	const [reason, setReason] = useState<CreateReport['reason']>('attribution');
	const [details, setDetails] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [report, { isLoading }] = useReportQuoteMutation();

	const send = async () => {
		setError(null);
		const res = await report({ id, reason, details: details.trim() || undefined });
		if ('error' in res) {
			const status = (res.error as { status?: number }).status;
			setError(
				status === 409
					? 'You already have an open report on this quote. Moderators will get to it.'
					: 'The report did not send. Try again.'
			);
			return;
		}
		notify('Report sent. Moderators will review it; the quote stays up meanwhile.');
		setDetails('');
		onClose();
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			width={520}
			title="Report this quote"
			description="Reports go to moderators. The quote stays up while it is reviewed."
			footer={
				<>
					<Button variant="quiet" onClick={onClose}>
						Cancel
					</Button>
					<Button disabled={isLoading} onClick={() => void send()}>
						{isLoading ? 'Sending…' : 'Send report'}
					</Button>
				</>
			}
		>
			{error ? <Notice tone="attention">{error}</Notice> : null}
			<RadioGroup
				label="What’s wrong?"
				name="report-reason"
				options={REASONS}
				value={reason}
				onChange={(v) => setReason(v as CreateReport['reason'])}
			/>
			<Field label="Details" optional htmlFor="report-details" count={`${details.length} / 2000`}>
				<Textarea
					id="report-details"
					rows={3}
					maxLength={2000}
					placeholder="A link to the real source helps."
					value={details}
					onChange={(e) => setDetails(e.target.value)}
				/>
			</Field>
		</Dialog>
	);
}
