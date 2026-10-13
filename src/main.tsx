import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { cliCommand, startAnalytics, track } from '@/shared/analytics';
import { onTerminalCopy } from '@/shared/ui';
import { initTelemetry } from '@/shared/telemetry';
import { ANALYTICS, API_URL, TELEMETRY } from '@/lib/env';
import { RouterProvider } from 'react-router';
import '@/shared/ui/styles/globals.css';
import { Providers } from './app/providers';
import { router } from './app/router';

// If the first screen needs data immediately, kick its query off here rather
// than in a component effect: by this point every module above has finished
// evaluating and `providers` has already called `configureApi` at module scope,
// so the fetch races the session check instead of queueing behind it.

initTelemetry({ service: 'qotm-web', ...TELEMETRY, apiUrls: [API_URL] });
startAnalytics({ ...ANALYTICS, routes: router.routes });
onTerminalCopy((command) => track('cli_command_copied', { command: cliCommand(command) }));

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<Providers>
			<RouterProvider router={router} />
		</Providers>
	</StrictMode>
);
