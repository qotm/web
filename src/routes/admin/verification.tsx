import { useState } from 'react';
import { Form, Formik } from 'formik';
import { useSearchParams } from 'react-router';
import {
	useAdminAuthorsQuery,
	useAdminQuoteQuery,
	useAdminVerificationQuery,
	useCorrectQuoteMutation,
	useVerifyQuoteMutation
} from '@/features/admin/api';
import { ago, waited } from '@/features/admin/lib/dashboard';
import {
	correctionBody,
	correctionValues,
	notesOf,
	submitter,
	verification,
	type CorrectionValues
} from '@/features/admin/lib/queues';
import { Empty, PageSkeleton, StateScreen } from '@/shared/layouts';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import type { AdminQuoteEntity, QueueItemEntity } from '@/shared/types';
import {
	Button,
	Card,
	DataTable,
	Dialog,
	Field,
	FormField,
	FormTextarea,
	Input,
	Notice,
	PageMeta,
	Pagination,
	ProvenancePanel,
	QuoteBlock,
	ReviewDecision,
	StatusBadge,
	notify
} from '@/shared/ui';

const PAGE_SIZE = 20;

/** The API's own words for a refusal it explains ("Link the author before verifying…"). */
const refusal = (error: unknown, fallback: string) => {
	const message = (error as { data?: { message?: unknown } }).data?.message;
	return typeof message === 'string' && !message.startsWith('Validation') ? message : fallback;
};

const validateCorrection = (v: CorrectionValues) => {
	const errors: Partial<Record<keyof CorrectionValues, string>> = {};
	if (v.note.trim().length < 3) errors.note = 'Say what you checked, for the audit log';
	if (!v.text.trim()) errors.text = 'The quote needs its words';
	if (v.year.trim() && !/^-?\d{1,4}$/.test(v.year.trim())) errors.year = 'A year, like 1974';
	if (v.sourceUrl.trim() && !/^https?:\/\/\S+$/.test(v.sourceUrl.trim()))
		errors.sourceUrl = 'A link starting with https://';
	return errors;
};

/** Correct the wording (kept as a Correction), link the author, and set where it comes from. */
function CorrectDialog({ quote, open, onClose }: { quote: AdminQuoteEntity; open: boolean; onClose: () => void }) {
	const [correct] = useCorrectQuoteMutation();
	const [error, setError] = useState<string | null>(null);
	const [authorQuery, setAuthorQuery] = useState(quote.author?.name ?? quote.attribution ?? '');
	const search = useDebouncedValue(authorQuery, 250);
	const { data: authors } = useAdminAuthorsQuery({ search, limit: 8 }, { skip: !open });
	return (
		<Formik<CorrectionValues>
			initialValues={correctionValues(quote)}
			enableReinitialize
			validate={validateCorrection}
			onSubmit={async (v, helpers) => {
				setError(null);
				const res = await correct({ id: quote.id, body: correctionBody(quote, v) });
				helpers.setSubmitting(false);
				if ('error' in res) return setError(refusal(res.error, 'The correction was not saved. Try again.'));
				notify('Corrected. The old wording is kept as a correction.');
				onClose();
			}}
		>
			{({ isSubmitting, submitForm, setFieldValue, values }) => (
				<Dialog
					open={open}
					onClose={onClose}
					width={600}
					title="Correct before verifying"
					description="Match the source exactly. A new wording is kept as a correction; releases keep the text they shipped."
					footer={
						<>
							<Button variant="quiet" onClick={onClose}>
								Cancel
							</Button>
							<Button disabled={isSubmitting} onClick={() => void submitForm()}>
								Save correction
							</Button>
						</>
					}
				>
					<Form className="flex flex-col gap-grid" noValidate>
						{error ? <Notice tone="attention">{error}</Notice> : null}
						<FormTextarea name="text" label="Quote" required display rows={3} maxLength={280} id="correct-text" />
						<div className="flex flex-col gap-2">
							<Field
								label="Author"
								htmlFor="correct-author"
								hint={values.author ? `Linked: ${values.author}` : 'Not linked. Pick the author to link.'}
							>
								<Input id="correct-author" value={authorQuery} onChange={(e) => setAuthorQuery(e.target.value)} />
							</Field>
							{authors?.list.length ? (
								<div role="listbox" aria-label="Authors" className="flex flex-wrap gap-2">
									{authors.list.map((a) => (
										<Button
											key={a.slug}
											type="button"
											size="sm"
											role="option"
											aria-selected={values.author === a.slug}
											variant={values.author === a.slug ? 'solid' : 'outline'}
											onClick={() => void setFieldValue('author', a.slug)}
										>
											{a.name}
										</Button>
									))}
								</div>
							) : null}
						</div>
						<div className="grid grid-cols-[120px_1fr] gap-grid narrow:grid-cols-1">
							<FormField name="year" label="Year" optional inputMode="numeric" id="correct-year" />
							<FormField name="sourceUrl" label="Source link" optional mono id="correct-source-url" />
						</div>
						<FormTextarea name="context" label="Context" optional rows={2} maxLength={1000} id="correct-context" />
						<FormTextarea
							name="note"
							label="Note"
							required
							rows={2}
							hint="Kept in the audit log with your name."
							id="correct-note"
						/>
					</Form>
				</Dialog>
			)}
		</Formik>
	);
}

/** The selected quote: the submission, its provenance, notes, and the verifier's decision. */
function Selected({ item }: { item: QueueItemEntity }) {
	const { data: quote, isLoading, isError, refetch } = useAdminQuoteQuery(item.id);
	const [verify, { isLoading: deciding }] = useVerifyQuoteMutation();
	const [correcting, setCorrecting] = useState(false);

	if (isLoading) return <PageSkeleton />;
	if (isError || !quote)
		return (
			<StateScreen compact title="This quote did not load." description="Check your connection and try again.">
				<Button variant="outline" onClick={() => void refetch()}>
					Try again
				</Button>
			</StateScreen>
		);

	const notes = notesOf(quote);
	const cite = [quote.source?.title ?? quote.work, quote.year].filter(Boolean).join(', ');
	return (
		<div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-start gap-grid narrow:grid-cols-1">
			<div className="flex flex-col gap-grid">
				<Card aria-label={`Submission ${quote.id}`}>
					<div className="flex flex-col gap-stack">
						<div className="flex flex-wrap items-center justify-between gap-2">
							<StatusBadge status={quote.status} />
							<span className="font-mono text-[12px] text-stone-600">
								{quote.id} · submitted by {submitter(quote)} · {ago(item.waitingSince)}
							</span>
						</div>
						<QuoteBlock
							size="sm"
							quote={quote.text}
							author={quote.author?.name ?? quote.attribution ?? undefined}
							cite={cite || undefined}
						/>
					</div>
				</Card>
				<ProvenancePanel quote={quote} />
				{!quote.author ? (
					<Notice
						tone="attention"
						title="Link the author before verifying."
						action={
							<Button size="sm" variant="outline" onClick={() => setCorrecting(true)}>
								Link author
							</Button>
						}
					>
						Submitted as “{quote.attribution ?? 'unknown'}”. A verified quote is credited to an author record.
					</Notice>
				) : null}
				<Notice
					title="Check the wording against the source."
					action={
						<Button size="sm" variant="outline" onClick={() => setCorrecting(true)}>
							Correct wording
						</Button>
					}
				>
					If it differs, correct the text before verifying: the old wording is kept as a correction.
				</Notice>
				{notes.length ? (
					<section aria-labelledby="h-notes" className="flex flex-col gap-2">
						<h3
							id="h-notes"
							className="m-0 font-mono text-[12px]/[1.6] font-normal tracking-[0.14em] text-stone-600 uppercase"
						>
							Notes
						</h3>
						<ul className="m-0 flex list-none flex-col gap-2 p-0">
							{notes.map((h) => (
								<li key={h.at} className="rounded-field border border-border bg-card px-4 py-3 text-[15px]">
									<div className="mb-1 flex flex-wrap items-center gap-2 font-mono text-[12px] text-stone-600">
										<StatusBadge status={h.status} />
										{h.by ? `@${h.by.handle}` : 'qotm'} · {h.at.slice(0, 10)}
									</div>
									{h.note}
								</li>
							))}
						</ul>
					</section>
				) : null}
				<CorrectDialog quote={quote} open={correcting} onClose={() => setCorrecting(false)} />
			</div>
			<ReviewDecision
				key={quote.id}
				kind="verification"
				busy={deciding}
				noteRequired={['NEEDS_EVIDENCE', 'REJECTED']}
				onDecide={async (status, note) => {
					const body = verification(status, note);
					if (!body) return;
					const res = await verify({ id: quote.id, body });
					if ('error' in res) return notify(refusal(res.error, 'That was not saved. Try again.'));
					notify(
						{
							verify: `${quote.id} verified.`,
							needs_evidence: `Evidence requested for ${quote.id}.`,
							reject: `${quote.id} rejected.`
						}[body.decision]
					);
				}}
			/>
		</div>
	);
}

/**
 * The verification queue (artboard AdminVerification): canonical quotes
 * waiting for a verifier, oldest first. The selected one shows the
 * submission, its provenance and notes, a prompt to correct its wording or
 * link its author, and the verification decision.
 */
export function AdminVerificationRoute() {
	const [params, setParams] = useSearchParams();
	const page = Math.max(1, Number(params.get('page')) || 1);
	const { data, isLoading, isError, refetch } = useAdminVerificationQuery({ page, limit: PAGE_SIZE });
	const set = (next: Record<string, string | null>) =>
		setParams(
			(p) => {
				for (const [k, v] of Object.entries(next))
					if (v === null) p.delete(k);
					else p.set(k, v);
				return p;
			},
			{ replace: true }
		);
	const list = data?.list ?? [];
	const selected = list.find((q) => q.id === params.get('id')) ?? list[0];

	return (
		<div className="flex flex-col gap-card-y">
			<PageMeta title="Verification queue" robots="noindex" />
			<header>
				<h1 className="m-0 text-h1">Verification queue.</h1>
				<p className="mt-2 mb-0 text-[15px] text-muted-foreground">
					Did this person actually say or write these words, and is there sufficient evidence?
				</p>
			</header>
			{isLoading ? (
				<PageSkeleton />
			) : isError || !data ? (
				<StateScreen compact title="The queue did not load." description="Check your connection and try again.">
					<Button variant="outline" onClick={() => void refetch()}>
						Try again
					</Button>
				</StateScreen>
			) : !list.length ? (
				<Empty title="Nothing to verify." description="Canonical quotes land here once they are submitted." />
			) : (
				<>
					<DataTable<QueueItemEntity>
						dense
						label="Verification queue"
						rows={list}
						rowKey={(q) => q.id}
						onRowClick={(q) => set({ id: q.id })}
						rowLabel={(q) => `Review ${q.id}${q.id === selected?.id ? ' (selected)' : ''}`}
						columns={[
							{ key: 'id', label: 'id', mono: true },
							{
								key: 'text',
								label: 'quote',
								render: (q) => <span className="line-clamp-1 max-w-[300px]">{q.text}</span>
							},
							{
								key: 'author',
								label: 'author',
								render: (q) => <span className="whitespace-nowrap">{q.author?.name ?? q.attribution ?? '—'}</span>
							},
							{ key: 'by', label: 'submitted by', mono: true, render: submitter },
							{ key: 'status', label: 'state', render: (q) => <StatusBadge status={q.status} /> },
							{ key: 'age', label: 'waiting', mono: true, align: 'right', render: (q) => waited(q.waitingSince) }
						]}
					/>
					{data.lastPage > 1 ? (
						<Pagination
							page={page}
							pageSize={data.pageSize}
							total={data.total}
							onPage={(p) => set({ page: String(p), id: null })}
						/>
					) : null}
					{selected ? <Selected item={selected} /> : null}
				</>
			)}
		</div>
	);
}
