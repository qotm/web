import { PageMeta } from '@/shared/ui';
import { Section, SectionHeading } from '@/shared/layouts';

/**
 * Placeholder. Replace the body with your actual terms — this route exists from
 * the first commit because the signup consent gate links to it, and a checkbox
 * that says "I agree to the Terms" over a 404 is not consent.
 */
export function TermsRoute() {
	return (
		<>
			<PageMeta title="Terms of Service" />
			<Section>
				<SectionHeading
					eyebrow="Legal"
					title="Terms of Service"
					lede="Replace this page with your terms before you take a single signup."
					align="left"
				/>
				<div className="mx-auto mt-8 max-w-3xl text-body">
					<p>
						Until then this page exists only so the consent checkbox on the signup form has somewhere real to point.
					</p>
				</div>
			</Section>
		</>
	);
}
