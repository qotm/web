/**
 * The taxonomy forms (authors, sources, topics): every field is edited as a
 * string and turned into the API's body here, so the three dialogs share one
 * form and one set of rules.
 */
export type FieldKind = 'text' | 'slug' | 'year' | 'url' | 'textarea' | 'select';

export type FieldSpec = {
	name: string;
	label: string;
	kind: FieldKind;
	required?: boolean;
	hint?: string;
	options?: { value: string; label: string }[];
	max?: number;
	/** Shares a row with the next field. */
	half?: boolean;
	/** Suggests author slugs while typing. */
	authors?: boolean;
};

export type FormValues = Record<string, string>;

const YEAR = /^\d{1,4}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const URL_RE = /^https?:\/\/\S+$/;

/** The form's starting values: a record's own, or empty for a new one. */
export function valuesOf(fields: FieldSpec[], record?: Record<string, unknown>): FormValues {
	return Object.fromEntries(
		fields.map((f) => {
			const v = record?.[f.name];
			return [f.name, v == null ? (f.kind === 'select' ? (f.options?.[0]?.value ?? '') : '') : String(v)];
		})
	);
}

export function validate(fields: FieldSpec[], v: FormValues) {
	const errors: Record<string, string> = {};
	for (const f of fields) {
		const s = (v[f.name] ?? '').trim();
		if (!s) {
			if (f.required) errors[f.name] = `${f.label} is required`;
			continue;
		}
		if (f.max && s.length > f.max) errors[f.name] = `At most ${f.max} characters`;
		else if (f.kind === 'year' && !YEAR.test(s)) errors[f.name] = 'A year, like 1974';
		else if (f.kind === 'slug' && !SLUG.test(s)) errors[f.name] = 'Lowercase words joined by hyphens';
		else if (f.kind === 'url' && !URL_RE.test(s)) errors[f.name] = 'A link starting with https://';
	}
	return errors;
}

/**
 * The body to send. A new record leaves empty fields out (the API derives a
 * slug from the name); an edit sends only what changed, an emptied optional
 * field as null.
 */
export function bodyOf(fields: FieldSpec[], v: FormValues, was?: FormValues): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	for (const f of fields) {
		const s = (v[f.name] ?? '').trim();
		if (was && s === (was[f.name] ?? '').trim()) continue;
		if (!s) {
			if (was && !f.required && f.kind !== 'slug') out[f.name] = null;
			continue;
		}
		out[f.name] = f.kind === 'year' ? Number(s) : s;
	}
	return out;
}

/** "Validation: slug: …" from the API, as [field, message]. */
export function apiFieldError(error: unknown): [string, string] | null {
	const message = (error as { data?: { message?: unknown } }).data?.message;
	const m = typeof message === 'string' ? /^Validation: (\w+): (.+)$/.exec(message) : null;
	return m ? [m[1], m[2]] : null;
}
