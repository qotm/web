import { z } from 'zod';
import type { SubmitQuote } from '@/shared/types';

/**
 * The submit form's rules, as the API's SubmitQuote validates them (backend
 * submissions/dto: the generated zSubmitQuote is only `unknown`, since the
 * generator does not emit its discriminated union).
 */
export type QuoteKind = SubmitQuote['type'];

const QUOTE_MARKS = /^["“”„'‘’«»]+|["“”„'‘’«»]+$/g;

/** The words as the API stores them: one space at a time, no surrounding quotation marks. */
export const cleanText = (text: string) => text.replace(/\s+/g, ' ').trim().replace(QUOTE_MARKS, '').trim();

const text = z
	.string()
	.transform(cleanText)
	.pipe(z.string().min(3, 'At least 3 characters').max(280, 'At most 280 characters'));
const year = z
	.string()
	.trim()
	.regex(/^-?\d{0,4}$/, 'A year, like 1974')
	.optional();
const url = z
	.string()
	.trim()
	.refine((v) => !v || /^https?:\/\/\S+$/.test(v), 'A link starting with http:// or https://')
	.optional();

export const submitSchema = z.discriminatedUnion('type', [
	z.object({
		type: z.literal('canonical'),
		text,
		attribution: z.string().trim().min(2, 'Who said or wrote it').max(160),
		year,
		source: z.string().trim().min(2, 'The book, paper, talk or post').max(300),
		sourceUrl: url,
		context: z.string().max(1000).optional(),
		topics: z.array(z.string()).min(1, 'Pick at least one topic').max(3),
		rights: z.boolean().optional()
	}),
	z.object({
		type: z.literal('original'),
		text,
		topics: z.array(z.string()).min(1, 'Pick at least one topic').max(3),
		rights: z.literal(true, { error: 'Confirm you wrote this quote and may publish it' }),
		attribution: z.string().optional(),
		year,
		source: z.string().optional(),
		sourceUrl: url,
		context: z.string().optional()
	}),
	z.object({
		type: z.literal('private'),
		text,
		attribution: z.string().trim().max(160).optional(),
		year,
		source: z.string().trim().max(300).optional(),
		sourceUrl: url,
		context: z.string().max(1000).optional(),
		topics: z.array(z.string()).max(3),
		rights: z.boolean().optional()
	})
]);

export type SubmitValues = {
	type: QuoteKind;
	text: string;
	attribution: string;
	year: string;
	source: string;
	sourceUrl: string;
	context: string;
	topics: string[];
	rights: boolean;
};

export const initialValues: SubmitValues = {
	type: 'canonical',
	text: '',
	attribution: '',
	year: '',
	source: '',
	sourceUrl: '',
	context: '',
	topics: [],
	rights: false
};

const opt = (v: string) => (v.trim() ? v.trim() : undefined);
const yearOf = (v: string) => (v.trim() ? Number(v) : undefined);

/** The API body for the form, as `type` (Save as private sends the same words as private). */
export function toBody(v: SubmitValues, as: QuoteKind = v.type): SubmitQuote {
	const words = cleanText(v.text);
	if (as === 'original') return { type: 'original', text: words, topics: v.topics, rights: true };
	if (as === 'canonical')
		return {
			type: 'canonical',
			text: words,
			attribution: v.attribution.trim(),
			source: v.source.trim(),
			year: yearOf(v.year),
			sourceUrl: opt(v.sourceUrl),
			context: opt(v.context),
			topics: v.topics
		};
	return {
		type: 'private',
		text: words,
		attribution: opt(v.attribution),
		source: opt(v.source),
		year: yearOf(v.year),
		sourceUrl: opt(v.sourceUrl),
		context: opt(v.context),
		topics: v.topics
	};
}

/**
 * The API's validation failures read "Validation: <field>: <problem>";
 * returns the form field and message, or null for anything else.
 */
export function fieldError(message: unknown): { field: keyof SubmitValues; message: string } | null {
	if (typeof message !== 'string') return null;
	const m = /^Validation: ([\w.]+): (.+)$/.exec(message);
	if (!m) return null;
	const field = m[1].split('.')[0] as keyof SubmitValues;
	return field in initialValues ? { field, message: m[2] } : null;
}

/**
 * Formik errors for the values, checked as `as` (the button pressed: "Save as
 * private" needs only the words, whatever the form's type).
 */
export function validateAs(values: SubmitValues, as: QuoteKind = values.type) {
	const res = submitSchema.safeParse({ ...values, type: as });
	if (res.success) return {};
	const errors: Partial<Record<keyof SubmitValues, string>> = {};
	for (const issue of res.error.issues) {
		const field = issue.path[0] as keyof SubmitValues;
		if (field && !errors[field]) errors[field] = issue.message;
	}
	return errors;
}
