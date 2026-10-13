import { LegalDocument } from '@/features/legal/legal-document';
import { PRIVACY } from '@/features/legal/documents';

/** /privacy: the Privacy Policy (text in `features/legal/documents.ts`). */
export function PrivacyRoute() {
	return <LegalDocument doc={PRIVACY} />;
}
