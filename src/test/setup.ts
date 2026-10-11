import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
	cleanup();
});

// jsdom has no pointer capture; sonner's swipe handling calls it. (Node-only
// tests run without a DOM, so only where there is one.)
if (typeof Element !== 'undefined') {
	Element.prototype.setPointerCapture ??= () => {};
	Element.prototype.releasePointerCapture ??= () => {};
	Element.prototype.hasPointerCapture ??= () => false;
}
