// Runtime configuration for @/shared/api. The consuming app calls configureApi()
// once at startup (before creating the store or issuing requests) to inject the
// backend base URL and the 401 -> re-auth redirect handler (from @/shared/auth).

let apiBaseUrl = '';
let onUnauthorized: () => void = () => {};

export function configureApi(options: { baseUrl: string; onUnauthorized?: () => void }): void {
	apiBaseUrl = options.baseUrl.replace(/\/$/, '');
	if (options.onUnauthorized) {
		onUnauthorized = options.onUnauthorized;
	}
}

export function getApiBaseUrl(): string {
	return apiBaseUrl;
}

export function notifyUnauthorized(): void {
	onUnauthorized();
}
