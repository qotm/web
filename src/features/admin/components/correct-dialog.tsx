import { useState } from 'react';
import { Form, Formik } from 'formik';
import { useAdminAuthorsQuery, useCorrectQuoteMutation } from '@/features/admin/api';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import type { AdminQuoteEntity } from '@/shared/types';
import { Button, Dialog, Field, FormField, FormTextarea, Input, Notice, notify } from '@/shared/ui';
import { correctionBody, correctionValues, type CorrectionValues } from '../lib/queues';
import { refusal } from '../lib/refusal';

/** The API's own words for a refusal it explains ("Link the author before verifying…"). */
const validateCorrection = (v: CorrectionValues) => {
	const errors: Partial<Record<keyof CorrectionValues, string>> = {};
	if (v.note.trim().length < 3) errors.note = 'Say what you checked, for the audit log';
	if (!v.text.trim()) errors.text = 'The quote needs its words';
	if (v.year.trim() && !/^-?\d{1,4}$/.test(v.year.trim())) errors.year = 'A year, like 1974';
	if (v.sourceUrl.trim() && !/^https?:\/\/\S+$/.test(v.sourceUrl.trim()))
		errors.sourceUrl = 'A link starting with https://';
	return errors;
};

type CorrectDialogProps = {
	quote: AdminQuoteEntity;
	open: boolean;
	onClose: () => void;
	title?: string;
};

/** Correct the wording (kept as a Correction), link the author, and set where it comes from. */
export function CorrectDialog({ quote, open, onClose, title = 'Correct before verifying' }: CorrectDialogProps) {
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
					title={title}
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
