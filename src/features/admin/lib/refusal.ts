/** The API's reason for refusing a decision, to show as is; `fallback` for validation errors and anything unexpected. */
export const refusal = (error: unknown, fallback: string) => {
	const message = (error as { data?: { message?: unknown } }).data?.message;
	return typeof message === 'string' && !message.startsWith('Validation') ? message : fallback;
};
