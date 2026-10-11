import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Component and logic tests: jsdom, `src/**/*.test.{ts,tsx}`. The browser
// suite is Playwright's (`e2e/`, `yarn test:e2e`).
export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: { '@': path.resolve(import.meta.dirname, './src') }
	},
	test: {
		environment: 'jsdom',
		include: ['src/**/*.test.{ts,tsx}'],
		setupFiles: ['./src/test/setup.ts'],
		css: false,
		env: { VITE_APP_API_URL: 'http://api.test' }
	}
});
