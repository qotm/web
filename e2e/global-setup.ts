import { execSync } from 'node:child_process';

/** A known test database: emptied, then the test users and the sample content. */
export default function globalSetup() {
	execSync('yarn test:db:seed:e2e', {
		cwd: '../backend/apps/api',
		stdio: 'inherit'
	});
}
