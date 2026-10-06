import { PageMeta } from '@/shared/ui';
import { Section, SectionHeading } from '@/shared/layouts';

/**
 * Placeholder — see the note in `terms.tsx`. A privacy policy is also the one
 * page several jurisdictions require you to have before you collect an email
 * address, so this is not decoration.
 */
export function PrivacyRoute() {
	return (
		<>
			<PageMeta title="Privacy Policy" />
			<Section>
				<SectionHeading
					eyebrow="Legal"
					title="Privacy Policy"
					lede="What you collect, why, how long you keep it, and who else sees it."
					align="left"
				/>
				<div className="mx-auto mt-8 max-w-3xl text-body">
					<p>Replace this page before launch.</p>
				</div>
			</Section>
		</>
	);
}
