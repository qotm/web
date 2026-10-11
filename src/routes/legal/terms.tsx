import { PageMeta } from '@/shared/ui';
import { Section, SectionHeading } from '@/shared/layouts';

/** Placeholder until the terms are written; linked from the footer and sign-in. */
export function TermsRoute() {
	return (
		<>
			<PageMeta title="Terms of Service" />
			<Section>
				<SectionHeading
					eyebrow="Legal"
					title="Terms of Service"
					lede="The terms for using qotm are being written."
					align="left"
				/>
				<div className="mx-auto mt-8 max-w-3xl text-body">
					<p>
						Until they are, nothing here changes how the site works: quotes you submit stay credited to you, and private
						quotes stay yours.
					</p>
				</div>
			</Section>
		</>
	);
}
