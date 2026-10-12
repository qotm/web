import { useState } from 'react';
import { Form, Formik } from 'formik';
import { z } from 'zod';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import type { MyQuoteEntity } from '@/shared/types';
import { zAddEvidence } from '@/shared/types';
import { Button, Checkbox, Dialog, FormField, FormTextarea, Notice, TopicPicker, notify } from '@/shared/ui';
import { useTopicsQuery } from '@/features/quotes/api';
import { cleanText, initialValues, toBody, validateAs, type SubmitValues } from '@/features/submissions/schema';
import {
	useAddEvidenceMutation,
	useDeleteMyQuoteMutation,
	useEditMyQuoteMutation,
	useSubmitPrivateMutation
} from '../api';

type DialogProps = { quote: MyQuoteEntity; open: boolean; onClose: () => void };

/** The generated rules, with a message people can act on for the note. */
const evidenceSchema = zAddEvidence.extend({
	note: z.string().trim().min(3, 'Say what you found, in a few words').max(1000)
});

const failed = (error: unknown, fallback: string) => {
	const message = (error as { data?: { message?: unknown } } | undefined)?.data?.message;
	return typeof message === 'string' && !message.startsWith('Validation') ? message : fallback;
};

/** Delete a private or unpublished quote, after asking. */
export function DeleteDialog({ quote, open, onClose }: DialogProps) {
	const [remove, { isLoading }] = useDeleteMyQuoteMutation();
	const [error, setError] = useState<string | null>(null);
	return (
		<Dialog
			open={open}
			onClose={onClose}
			role="alertdialog"
			width={460}
			title="Delete this quote?"
			description={`“${quote.text}” is removed from your library and your terminal's next sync. This cannot be undone.`}
			footer={
				<>
					<Button variant="quiet" onClick={onClose}>
						Keep it
					</Button>
					<Button
						variant="danger"
						disabled={isLoading}
						onClick={async () => {
							const res = await remove(quote.id);
							if ('error' in res) return setError(failed(res.error, 'It was not deleted. Try again.'));
							notify('Deleted.');
							onClose();
						}}
					>
						Delete
					</Button>
				</>
			}
		>
			{error ? <Notice tone="attention">{error}</Notice> : null}
		</Dialog>
	);
}

/** Edit a private quote: the words and where they came from. */
export function EditDialog({ quote, open, onClose }: DialogProps) {
	const [edit] = useEditMyQuoteMutation();
	const [error, setError] = useState<string | null>(null);
	const start: SubmitValues = {
		...initialValues,
		type: 'private',
		text: quote.text,
		attribution: quote.author?.name ?? quote.attribution ?? '',
		year: quote.year ? String(quote.year) : '',
		source: quote.work ?? ''
	};
	return (
		<Formik<SubmitValues>
			initialValues={start}
			enableReinitialize
			validate={(v) => validateAs(v, 'private')}
			onSubmit={async (v, helpers) => {
				const body = toBody(v, 'private');
				if (body.type !== 'private') return;
				const res = await edit({
					id: quote.id,
					text: body.text,
					attribution: body.attribution ?? null,
					source: body.source ?? null,
					year: body.year ?? null
				});
				helpers.setSubmitting(false);
				if ('error' in res) return setError(failed(res.error, 'The changes were not saved. Try again.'));
				notify('Saved.');
				onClose();
			}}
		>
			{({ isSubmitting, submitForm }) => (
				<Dialog
					open={open}
					onClose={onClose}
					width={560}
					title="Edit quote"
					footer={
						<>
							<Button variant="quiet" onClick={onClose}>
								Cancel
							</Button>
							<Button disabled={isSubmitting} onClick={() => void submitForm()}>
								Save
							</Button>
						</>
					}
				>
					<Form className="flex flex-col gap-grid" noValidate>
						{error ? <Notice tone="attention">{error}</Notice> : null}
						<FormTextarea
							name="text"
							label="Quote"
							required
							display
							rows={3}
							maxLength={280}
							id={`edit-text-${quote.id}`}
						/>
						<div className="grid grid-cols-[1fr_120px] gap-grid narrow:grid-cols-1">
							<FormField name="attribution" label="Author" optional id={`edit-author-${quote.id}`} />
							<FormField name="year" label="Year" optional inputMode="numeric" id={`edit-year-${quote.id}`} />
						</div>
						<FormField name="source" label="Source" optional id={`edit-source-${quote.id}`} />
					</Form>
				</Dialog>
			)}
		</Formik>
	);
}

/** Share a private quote as the member's own original: topics and the rights box. */
export function SubmitOriginalDialog({ quote, open, onClose }: DialogProps) {
	const { data: topics } = useTopicsQuery();
	const [submit, { isLoading }] = useSubmitPrivateMutation();
	const [picked, setPicked] = useState<string[]>(quote.topics.map((t) => t.slug));
	const [rights, setRights] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const ready = rights && picked.length > 0;
	return (
		<Dialog
			open={open}
			onClose={onClose}
			width={560}
			title="Submit as your original"
			description="It then goes through the community-original checks, and is shown as declared original by you."
			footer={
				<>
					<Button variant="quiet" onClick={onClose}>
						Cancel
					</Button>
					<Button
						variant="accent"
						disabled={!ready || isLoading}
						onClick={async () => {
							const res = await submit({ id: quote.id, rights: true, topics: picked });
							if ('error' in res) return setError(failed(res.error, 'It was not submitted. Try again.'));
							notify('Submitted. It publishes once the originality check passes.');
							onClose();
						}}
					>
						Submit
					</Button>
				</>
			}
		>
			<p className="m-0 font-display text-[18px]/[1.4] font-semibold">“{cleanText(quote.text)}”</p>
			{error ? <Notice tone="attention">{error}</Notice> : null}
			<TopicPicker
				topics={(topics?.list ?? []).map((t) => ({ slug: t.slug, label: t.name }))}
				value={picked}
				onChange={setPicked}
			/>
			<Checkbox
				label="I wrote this quote and have the right to publish it."
				description="Required for community originals."
				checked={rights}
				onChange={(e) => setRights(e.target.checked)}
			/>
		</Dialog>
	);
}

/** Answer "needs evidence": what the verifier asked for, and where to find it. */
export function EvidenceDialog({ quote, open, onClose }: DialogProps) {
	const [add] = useAddEvidenceMutation();
	const [error, setError] = useState<string | null>(null);
	return (
		<Formik
			initialValues={{ note: '', source: '', sourceUrl: '' }}
			validationSchema={toFormikValidationSchema(evidenceSchema)}
			onSubmit={async (v, helpers) => {
				const res = await add({
					id: quote.id,
					note: v.note.trim(),
					source: v.source.trim() || undefined,
					sourceUrl: v.sourceUrl.trim() || undefined
				});
				helpers.setSubmitting(false);
				if ('error' in res) return setError(failed(res.error, 'The evidence was not sent. Try again.'));
				notify('Sent to the verifier.');
				onClose();
			}}
		>
			{({ isSubmitting, submitForm }) => (
				<Dialog
					open={open}
					onClose={onClose}
					width={560}
					title="Add evidence"
					description="A primary source: where the words first appeared, ideally with a link."
					footer={
						<>
							<Button variant="quiet" onClick={onClose}>
								Cancel
							</Button>
							<Button disabled={isSubmitting} onClick={() => void submitForm()}>
								Send to the verifier
							</Button>
						</>
					}
				>
					<Form className="flex flex-col gap-grid" noValidate>
						{quote.review ? (
							<Notice tone="attention" title="What the verifier asked">
								{quote.review.note}
							</Notice>
						) : null}
						{error ? <Notice tone="attention">{error}</Notice> : null}
						<FormTextarea
							name="note"
							label="What you found"
							required
							rows={3}
							maxLength={1000}
							id={`ev-note-${quote.id}`}
						/>
						<FormField name="source" label="Source" optional id={`ev-source-${quote.id}`} />
						<FormField
							name="sourceUrl"
							label="Source URL"
							optional
							mono
							placeholder="https://"
							id={`ev-url-${quote.id}`}
						/>
					</Form>
				</Dialog>
			)}
		</Formik>
	);
}
