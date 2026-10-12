import { execSync } from 'node:child_process';

/**
 * A known test stack: the database emptied, then the test users and the
 * sample content; Redis flushed, so no cached feed or queued job (a release
 * build the test stack has no worker to run) outlives the last run.
 */
export default function globalSetup() {
	execSync('yarn test:db:seed:e2e', {
		cwd: '../backend/apps/api',
		stdio: 'inherit'
	});
	execSync('docker exec qotm-test-redis redis-cli FLUSHALL', { stdio: 'ignore' });
}
