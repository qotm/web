import { describe, expect, it } from 'vitest';
import { apiFieldError, bodyOf, validate, valuesOf, type FieldSpec } from './taxonomy';

const AUTHOR: FieldSpec[] = [
	{ name: 'name', label: 'Name', kind: 'text', required: true, max: 120 },
	{ name: 'slug', label: 'Slug', kind: 'slug' },
	{ name: 'bornYear', label: 'Born', kind: 'year' },
	{ name: 'diedYear', label: 'Died', kind: 'year' },
	{ name: 'description', label: 'Description', kind: 'textarea' }
];

describe('taxonomy forms', () => {
	it('starts from a record, or empty', () => {
		expect(valuesOf(AUTHOR)).toEqual({ name: '', slug: '', bornYear: '', diedYear: '', description: '' });
		expect(
			valuesOf(AUTHOR, { name: 'Grace Hopper', slug: 'hopper', bornYear: 1906, diedYear: 1992, description: null })
		).toEqual({
			name: 'Grace Hopper',
			slug: 'hopper',
			bornYear: '1906',
			diedYear: '1992',
			description: ''
		});
	});

	it('checks required fields, years, slugs and links', () => {
		expect(validate(AUTHOR, valuesOf(AUTHOR))).toEqual({ name: 'Name is required' });
		expect(validate(AUTHOR, { ...valuesOf(AUTHOR), name: 'X', slug: 'Grace Hopper', bornYear: '19o6' })).toEqual({
			slug: 'Lowercase words joined by hyphens',
			bornYear: 'A year, like 1974'
		});
		expect(validate([{ name: 'url', label: 'Link', kind: 'url' }], { url: 'example.com' })).toEqual({
			url: 'A link starting with https://'
		});
	});

	it('creates with what was filled in', () => {
		expect(bodyOf(AUTHOR, { ...valuesOf(AUTHOR), name: ' Grace Hopper ', bornYear: '1906' })).toEqual({
			name: 'Grace Hopper',
			bornYear: 1906
		});
	});

	it('edits with only what changed, an emptied field as null', () => {
		const was = valuesOf(AUTHOR, { name: 'Grace Hopper', slug: 'hopper', bornYear: 1906, diedYear: 1992 });
		expect(bodyOf(AUTHOR, was, was)).toEqual({});
		expect(bodyOf(AUTHOR, { ...was, diedYear: '', description: 'Rear admiral.' }, was)).toEqual({
			diedYear: null,
			description: 'Rear admiral.'
		});
	});

	it('reads the API’s field errors', () => {
		expect(apiFieldError({ data: { message: 'Validation: slug: Invalid string' } })).toEqual([
			'slug',
			'Invalid string'
		]);
		expect(apiFieldError({ data: { message: 'Conflict' } })).toBeNull();
	});
});
