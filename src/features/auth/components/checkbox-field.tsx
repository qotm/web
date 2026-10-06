import type { ReactNode } from 'react';
import { useField } from 'formik';
import { Checkbox, FormError } from '@/shared/ui';

/**
 * Formik-bound checkbox with the design's inline label treatment.
 *
 * `label` is a node, not a string, because the signup consent needs links to
 * Terms and Privacy inside it. Clicking one does not toggle the box: HTML
 * defines a label's activation behaviour as doing nothing for events targeted
 * at interactive descendants.
 *
 * `items-start` rather than the design's `center`: the design only has this on
 * the single-line "Remember me", and consent copy wraps to two or three lines on
 * a phone — centring would then float the box against the middle of the block.
 * `mt-0.5` puts it on the first line's optical centre, so the single-line case
 * looks unchanged.
 */
export function CheckboxField({ name, label }: { name: string; label: ReactNode }) {
	const [field, meta] = useField({ name, type: 'checkbox' });
	const showError = meta.touched && Boolean(meta.error);

	return (
		<div className="flex flex-col gap-1.5">
			<label className="flex cursor-pointer items-start gap-2.5">
				<Checkbox {...field} checked={field.value} aria-invalid={showError || undefined} className="mt-0.5" />
				<span className="text-sm text-body">{label}</span>
			</label>
			{showError ? <FormError>{meta.error}</FormError> : null}
		</div>
	);
}
