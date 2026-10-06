import { z } from 'zod';

/**
 * Install once per app at bootstrap. Friendly defaults for missing/empty
 * required fields; explicit per-field messages (.email(), .min(1, '...'),
 * .positive('...'), etc.) always take precedence over these.
 */
export function installZodErrorMap() {
	z.config({
		customError: (issue) => {
			if (issue.code === 'invalid_type' && (issue.input === undefined || issue.input === null)) {
				return 'This field is required';
			}
			if (
				issue.code === 'invalid_type' &&
				issue.expected === 'number' &&
				typeof issue.input === 'number' &&
				Number.isNaN(issue.input)
			) {
				return 'This field is required';
			}
			if (issue.code === 'too_small' && issue.origin === 'string' && issue.minimum === 1) {
				return 'This field is required';
			}
			return undefined;
		}
	});
}
