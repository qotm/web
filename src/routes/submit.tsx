import { useState } from 'react';
import { Form, Formik, useFormikContext } from 'formik';
import { useNavigate } from 'react-router';
import { useDebouncedValue } from '@/shared/hooks';
import {
	Button,
	Eyebrow,
	FormCheckbox,
	FormField,
	FormRadioGroup,
	FormTextarea,
	FormTopicPicker,
	MatchCompare,
	Notice,
	PageMeta,
	Skeleton,
	notify
} from '@/shared/ui';
import { paths } from '@/lib/paths';
import { useMeQuery } from '@/features/account/api';
import { useTopicsQuery } from '@/features/quotes/api';
import { track } from '@/shared/analytics';
import { useMatchQuoteQuery, useSubmitQuoteMutation } from '@/features/submissions/api';
import {
	cleanText,
	fieldError,
	initialValues,
	toBody,
	validateAs,
	type QuoteKind,
	type SubmitValues
} from '@/features/submissions/schema';

const KINDS = (handle: string) => [
	{
		value: 'canonical',
		label: 'A quote by someone else',
		description: 'Needs a source. A verifier checks it before it can be curated.'
	},
	{
		value: 'original',
		label: 'My own original',
		description: `Shown as “declared original by ${handle}”. Checked for known matches.`
	},
	{ value: 'private', label: 'A private quote', description: 'Only you see it. Never enters the public dataset.' }
];

const INTRO: Record<QuoteKind, string> = {
	canonical: 'Every canonical quote needs a source. A verifier checks it before it can be curated.',
	original: 'Your own words, shared with the community.',
	private: 'Kept in your library and on your terminal. Nobody else sees it.'
};

/** The closest existing quote, checked as the words settle (canonical and original). */
function LiveMatch({ handle }: { handle: string }) {
	const { values } = useFormikContext<SubmitValues>();
	const navigate = useNavigate();
	const words = useDebouncedValue(cleanText(values.text), 400);
	const [dismissed, setDismissed] = useState<string | null>(null);
	const skip = values.type === 'private' || words.length < 10;
	const { data, isFetching } = useMatchQuoteQuery({ text: words }, { skip });
	if (skip) return null;
	const match = data?.match ? data : null;

	if (values.type === 'original') {
		if (!data) return isFetching ? <Skeleton lines={2} /> : null;
		return match ? (
			<Notice tone="attention" title={`Originality check: this looks close to ${match.match!.id}.`}>
				It is {match.method === 'exact' ? 'the same words' : `about ${Math.round((match.score ?? 0) * 100)}% similar`}.
				A moderator reviews it before it is published as declared original by {handle}.
			</Notice>
		) : (
			<Notice title="Originality check: no known matching attribution found.">
				We compared it against the qotm corpus with exact and fuzzy matching. A moderator reviews anything that looks
				close.
			</Notice>
		);
	}
	if (!match || dismissed === match.match!.id) return null;
	return (
		<MatchCompare
			submitted={words}
			match={match}
			onDismiss={() => setDismissed(match.match!.id)}
			onMarkDuplicate={() => navigate(paths.quote(match.match!.id))}
		/>
	);
}

/**
 * Submit a quote (artboards Submit and SubmitOriginal): a canonical quote by
 * someone else with its source, the member's own original, or a private
 * one. Live matching as the words settle; the API's own validation lands on
 * its field.
 */
export function SubmitRoute() {
	const navigate = useNavigate();
	const { data: me } = useMeQuery();
	const { data: topics } = useTopicsQuery();
	const [submit] = useSubmitQuoteMutation();
	const [failure, setFailure] = useState<string | null>(null);
	// The kind the pressed button sends (Save as private), else the form's type.
	const [as, setAs] = useState<QuoteKind | null>(null);
	const handle = me ? `@${me.handle}` : 'you';

	return (
		<div className="mx-auto flex max-w-(--breakpoint-kit) flex-col gap-tile pt-10 pb-section">
			<PageMeta title="Submit a quote" robots="noindex" />
			<Formik<SubmitValues>
				initialValues={initialValues}
				validate={(values) => validateAs(values, as ?? values.type)}
				onSubmit={async (values, helpers) => {
					setFailure(null);
					const res = await submit(toBody(values, as ?? values.type));
					helpers.setSubmitting(false);
					if ('error' in res) {
						const message = (res.error as { data?: { message?: unknown } }).data?.message;
						const err = fieldError(message);
						if (err) helpers.setFieldError(err.field, err.message);
						else setFailure(typeof message === 'string' ? message : 'The quote was not saved. Try again.');
						return;
					}
					const q = res.data;
					track('quote_submitted', { type: as ?? values.type });
					if (q.type === 'original') {
						// The originality check runs in the background (the worker): with no
						// match it publishes on its own, else a moderator decides.
						notify(
							q.status === 'PUBLISHED'
								? 'Published to the community.'
								: 'Checking it against the corpus. It publishes in a moment unless something looks close.'
						);
						navigate(paths.quote(q.id));
						return;
					}
					notify(q.status === 'PRIVATE' ? 'Saved privately.' : 'Submitted for review.');
					navigate(paths.myQuotes);
				}}
			>
				{({ values, isSubmitting, submitForm }) => {
					const send = (kind: QuoteKind) => {
						setAs(kind);
						// After the state settles, so validate sees the kind.
						setTimeout(() => void submitForm(), 0);
					};
					return (
						<Form className="flex flex-col gap-tile" noValidate>
							<div>
								<Eyebrow>Contribute</Eyebrow>
								<h1 className="m-0 mb-2.5 text-h1">Submit a quote.</h1>
								<p className="m-0 text-muted-foreground">{INTRO[values.type]}</p>
							</div>
							<FormRadioGroup name="type" label="What are you submitting?" variant="card" options={KINDS(handle)} />
							{failure ? <Notice tone="attention">{failure}</Notice> : null}
							<FormTextarea
								name="text"
								label="Quote"
								required
								display
								rows={3}
								maxLength={280}
								hint={values.type === 'canonical' ? 'The exact words, without quotation marks.' : undefined}
							/>
							{values.type !== 'original' ? (
								<>
									<div className="grid grid-cols-2 gap-grid narrow:grid-cols-1">
										<FormField
											name="attribution"
											label="Author"
											required={values.type === 'canonical'}
											optional={values.type === 'private'}
										/>
										<FormField name="year" label="Year" optional inputMode="numeric" />
									</div>
									<FormField
										name="source"
										label="Source"
										required={values.type === 'canonical'}
										optional={values.type === 'private'}
										hint="The book, paper, talk or post where the words first appeared."
									/>
									<FormField name="sourceUrl" label="Source URL" optional mono placeholder="https://" />
									<FormTextarea
										name="context"
										label="Context"
										optional
										rows={2}
										placeholder="Where and why it was said."
									/>
								</>
							) : null}
							{topics ? (
								<FormTopicPicker
									name="topics"
									topics={topics.list.map((t) => ({ slug: t.slug, label: t.name }))}
									hint={values.type === 'private' ? 'Optional for private quotes.' : undefined}
								/>
							) : (
								<Skeleton lines={2} />
							)}
							<LiveMatch handle={handle} />
							{values.type === 'canonical' ? (
								<Notice title="You’re credited as the contributor.">
									{values.attribution.trim() || 'The author'} stays the author. Your handle appears as “submitted by{' '}
									{handle}”.
								</Notice>
							) : null}
							{values.type === 'original' ? (
								<>
									<Notice tone="wash" title="Public isn’t the same as shipped.">
										Once published, your quote is on the web as “declared original by {handle}”. It reaches the CLI only
										if a curator adds it to a dataset release.
									</Notice>
									<FormCheckbox
										name="rights"
										label="I wrote this quote and have the right to publish it."
										description="Required for community originals."
									/>
								</>
							) : null}
							<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-card-y">
								{values.type === 'canonical' ? (
									<span className="font-mono text-[13px] text-muted-foreground">or from the terminal: qotm submit</span>
								) : (
									<span />
								)}
								<div className="flex flex-wrap gap-3">
									{values.type === 'private' ? (
										<Button type="button" variant="accent" disabled={isSubmitting} onClick={() => send('private')}>
											Save privately
										</Button>
									) : (
										<>
											<Button type="button" variant="quiet" disabled={isSubmitting} onClick={() => send('private')}>
												{values.type === 'original' ? 'Keep it private' : 'Save as private'}
											</Button>
											<Button type="button" variant="accent" disabled={isSubmitting} onClick={() => send(values.type)}>
												{values.type === 'original' ? 'Publish to the community' : 'Submit for review'}
											</Button>
										</>
									)}
								</div>
							</div>
						</Form>
					);
				}}
			</Formik>
		</div>
	);
}
