import { describe, expect, it } from 'vitest';
import { cleanText, fieldError, initialValues, toBody, validateAs, type SubmitValues } from './schema';

const values = (v: Partial<SubmitValues>): SubmitValues => ({ ...initialValues, ...v });

describe('the submit form', () => {
	it('cleans the words as the API does', () => {
		expect(cleanText('  “Talk is   cheap.”  ')).toBe('Talk is cheap.');
		expect(cleanText("'Hello'")).toBe('Hello');
	});

	it('needs a source, an author and a topic for a canonical quote', () => {
		const errors = validateAs(values({ text: 'Talk is cheap.' }));
		expect(Object.keys(errors).sort()).toEqual(['attribution', 'source', 'topics']);
	});

	it('needs only the words to keep a quote private, whatever the form says', () => {
		expect(validateAs(values({ text: 'Talk is cheap.' }), 'private')).toEqual({});
		expect(validateAs(values({ text: 'ab' }), 'private')).toHaveProperty('text');
	});

	it('needs the rights box for an original', () => {
		const v = values({ type: 'original', text: 'A green build is a hypothesis.', topics: ['programming'] });
		expect(validateAs(v)).toHaveProperty('rights');
		expect(validateAs({ ...v, rights: true })).toEqual({});
	});

	it('checks the year and the link', () => {
		const v = values({ text: 'Talk is cheap.', attribution: 'Linus', source: 'LKML', topics: ['x'] });
		expect(validateAs({ ...v, year: '19x' })).toHaveProperty('year');
		expect(validateAs({ ...v, sourceUrl: 'ftp://x' })).toHaveProperty('sourceUrl');
		expect(validateAs({ ...v, year: '2000', sourceUrl: 'https://lkml.org/x' })).toEqual({});
	});

	it('sends each kind’s body, without empty optional fields', () => {
		const v = values({
			text: '“Talk is cheap.”',
			attribution: ' Linus Torvalds ',
			source: 'LKML',
			year: '2000',
			topics: ['open-source'],
			rights: true
		});
		expect(toBody(v)).toEqual({
			type: 'canonical',
			text: 'Talk is cheap.',
			attribution: 'Linus Torvalds',
			source: 'LKML',
			year: 2000,
			sourceUrl: undefined,
			context: undefined,
			topics: ['open-source']
		});
		expect(toBody(v, 'original')).toEqual({
			type: 'original',
			text: 'Talk is cheap.',
			topics: ['open-source'],
			rights: true
		});
		expect(toBody(v, 'private')).toMatchObject({ type: 'private', attribution: 'Linus Torvalds', year: 2000 });
	});

	it('reads the API’s validation message onto its field', () => {
		expect(fieldError('Validation: sourceUrl: Invalid URL')).toEqual({ field: 'sourceUrl', message: 'Invalid URL' });
		expect(fieldError('Validation: topics.0: Too long')).toEqual({ field: 'topics', message: 'Too long' });
		expect(fieldError('Validation: nope: x')).toBeNull();
		expect(fieldError('Unauthorized')).toBeNull();
	});
});
