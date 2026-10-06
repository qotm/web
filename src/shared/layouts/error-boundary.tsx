import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/shared/ui';
import { StateScreen } from './states/state-screen';
import { reportError } from '@/shared/telemetry';

type ErrorBoundaryProps = {
	children: ReactNode;
	fallback?: ReactNode;
};

type ErrorBoundaryState = {
	hasError: boolean;
};

/** Catches render errors in its subtree and shows a recoverable fallback. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	state: ErrorBoundaryState = { hasError: false };

	static getDerivedStateFromError(): ErrorBoundaryState {
		return { hasError: true };
	}

	componentDidCatch(error: Error, info: ErrorInfo): void {
		console.error('ErrorBoundary caught an error', error, info);
		reportError(error, { componentStack: info.componentStack });
	}

	render(): ReactNode {
		if (this.state.hasError) {
			return (
				this.props.fallback ?? (
					<StateScreen title="Something went wrong" description="An unexpected error occurred. Try reloading the page.">
						<Button onClick={() => window.location.reload()}>Reload</Button>
					</StateScreen>
				)
			);
		}
		return this.props.children;
	}
}
