import { defineConfig, devices } from '@playwright/test';

/**
 * The browser suite. Playwright starts its own API, from the backend's
 * compiled build with `.env.test` (the test database, password sign-in on),
 * and a web dev server pointed at it, on ports of their own so the dev API
 * (5060) and web (3000) keep running. `e2e/global-setup.ts` resets and seeds
 * the test database first. Never run it alongside the backend's e2e suite:
 * both use the test database.
 */
export const E2E = {
	apiPort: 5160,
	webPort: 5162,
	get api() {
		return `http://localhost:${this.apiPort}`;
	},
	get web() {
		return `http://localhost:${this.webPort}`;
	}
};

const backend = '../backend/apps/api';

export default defineConfig({
	testDir: './e2e',
	fullyParallel: false,
	workers: 1,
	retries: 0,
	reporter: [['list']],
	globalSetup: './e2e/global-setup.ts',
	use: {
		baseURL: E2E.web,
		trace: 'retain-on-failure'
	},
	projects: [
		{
			name: 'desktop',
			use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } }
		}
	],
	webServer: [
		{
			// The compiled API (the dev API's watch keeps dist/ current; run
			// `yarn build` in the API first if it is not running).
			command: 'yarn dotenv -e .env.test -- node dist/src/main',
			cwd: backend,
			url: `${E2E.api}/health`,
			reuseExistingServer: false,
			timeout: 120_000,
			env: {
				PORT: String(E2E.apiPort),
				BETTER_AUTH_URL: E2E.api,
				FRONTEND_HOST: E2E.web,
				RATE_LIMIT_ENABLED: 'false',
				AUTH_PASSWORD_ENABLED: 'true',
				// A host-only cookie: .env.test shares it across .qotm.site.
				BETTER_AUTH_COOKIE_DOMAIN: '',
				LOG_LEVEL: 'warn'
			}
		},
		{
			command: `yarn vite --port ${E2E.webPort} --strictPort`,
			url: E2E.web,
			reuseExistingServer: false,
			timeout: 120_000,
			env: {
				PORT: String(E2E.webPort),
				VITE_APP_API_URL: E2E.api
			}
		}
	]
});
