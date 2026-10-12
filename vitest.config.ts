import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Component and logic tests: jsdom, `src/**/*.test.{ts,tsx}`; the web image's
// server, `server/**/*.test.ts`, runs in node (each file says so). The browser
// suite is Playwright's (`e2e/`, `yarn test:e2e`).
export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: { '@': path.resolve(import.meta.dirname, './src') }
	},
	test: {
		environment: 'jsdom',
		include: ['src/**/*.test.{ts,tsx}', 'server/**/*.test.ts'],
		setupFiles: ['./src/test/setup.ts'],
		css: false,
		env: { VITE_APP_API_URL: 'http://api.test' }
	}
});
