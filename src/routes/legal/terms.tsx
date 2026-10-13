import { LegalDocument } from '@/features/legal/legal-document';
import { TERMS } from '@/features/legal/documents';

/** /terms: the Terms of Service (text in `features/legal/documents.ts`). */
export function TermsRoute() {
	return <LegalDocument doc={TERMS} />;
}
